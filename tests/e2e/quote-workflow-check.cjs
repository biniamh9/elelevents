const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const QA_EMAIL = "qa-admin@elelevents.local";
const QA_PASSWORD = "QA-Admin-2026!";
const RESULTS_PATH = path.join(process.cwd(), "tests/e2e/quote-workflow-results.json");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const results = [];

function getQuoteActionSecret() {
  return (
    process.env.QUOTE_ACTION_SECRET?.trim() ||
    process.env.EMAIL_INBOUND_WEBHOOK_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "local-elel-quote-action-secret"
  );
}

function normalizeQuotedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function createQuoteActionToken(input) {
  const payload = `${input.inquiryId}|${input.email.trim().toLowerCase()}|${normalizeQuotedAt(input.quotedAt)}`;
  const signature = crypto
    .createHmac("sha256", getQuoteActionSecret())
    .update(payload)
    .digest("hex");

  return `${Buffer.from(payload, "utf8").toString("base64url")}.${signature}`;
}

function push(step, result, detail) {
  results.push({
    testedAt: new Date().toISOString(),
    step,
    result,
    detail,
  });
}

async function record(step, fn) {
  try {
    const detail = await fn();
    push(step, "PASS", detail || "");
    return detail;
  } catch (error) {
    push(step, "FAIL", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function login(page) {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle" });
  await page.locator("input[type='email']").fill(QA_EMAIL);
  await page.locator("input[type='password']").fill(QA_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  try {
    await page.waitForURL(/\/admin\/(inquiries|crm-analytics|documents|contracts|finance|calendar|rentals|settings)/, {
      timeout: 20000,
    });
  } catch {
    await page.waitForTimeout(3000);
  }

  if (/\/admin\/login/.test(page.url())) {
    throw new Error("Admin login did not reach an authenticated admin route.");
  }
}

async function checkQuoteWorkflowSchema() {
  const { error: documentError } = await supabase
    .from("client_documents")
    .select("quote_workflow_status, quote_revision_number, quote_last_sent_at, quote_last_client_response_at, quote_last_accepted_at, quote_last_revision_requested_at")
    .limit(1);

  if (documentError) {
    throw new Error(
      `Quote workflow columns are missing. Apply supabase.quote-workflow.sql first. ${documentError.message}`
    );
  }

  const { error: revisionError } = await supabase
    .from("client_document_quote_revisions")
    .select("id")
    .limit(1);

  if (revisionError) {
    throw new Error(
      `Quote revision table is missing. Apply supabase.quote-workflow.sql first. ${revisionError.message}`
    );
  }

  const { error: activityError } = await supabase.from("activity_log").insert({
    entity_type: "document",
    entity_id: "00000000-0000-0000-0000-000000000000",
    action: "qa.schema_probe",
    summary: "QA schema probe",
    metadata: { source: "quote_workflow_check" },
  });

  if (activityError) {
    throw new Error(
      `activity_entity_type is missing the document value. Apply supabase.quote-workflow.sql first. ${activityError.message}`
    );
  }

  await supabase
    .from("activity_log")
    .delete()
    .eq("entity_type", "document")
    .eq("entity_id", "00000000-0000-0000-0000-000000000000")
    .eq("action", "qa.schema_probe");
}

async function createTempInquiry() {
  const stamp = Date.now();
  const email = `qa-quote-${stamp}@elelevents.local`;

  const { data, error } = await supabase
    .from("event_inquiries")
    .insert({
      first_name: "QA",
      last_name: `Quote ${stamp}`,
      email,
      phone: "4045558899",
      event_type: "Wedding",
      event_date: "2026-10-18",
      guest_count: 220,
      status: "contacted",
      estimated_price: 6200,
      consultation_status: "completed",
      quote_response_status: "not_sent",
      booking_stage: "consultation_scheduled",
    })
    .select("id, email")
    .single();

  if (error || !data) {
    throw new Error(`Temp inquiry creation failed: ${error?.message || "unknown"}`);
  }

  return data;
}

async function waitForQuote(inquiryId, expectedWorkflowStatus, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const { data, error } = await supabase
      .from("client_documents")
      .select("id, status, quote_workflow_status, quote_revision_number, quote_last_sent_at, quote_last_accepted_at, quote_last_revision_requested_at, total_amount")
      .eq("inquiry_id", inquiryId)
      .eq("document_type", "quote")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Quote lookup failed: ${error.message}`);
    }

    if (data?.quote_workflow_status === expectedWorkflowStatus) {
      return data;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Quote did not reach workflow status ${expectedWorkflowStatus}.`);
}

async function waitForProjectStatus(inquiryId, expectedStatus, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const { data, error } = await supabase
      .from("event_projects")
      .select("id, status")
      .eq("inquiry_id", inquiryId)
      .maybeSingle();

    if (error) {
      throw new Error(`Project lookup failed: ${error.message}`);
    }

    if (data?.status === expectedStatus) {
      return data;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Project did not reach status ${expectedStatus}.`);
}

async function countQuoteRevisions(documentId, workflowStatus) {
  const { count, error } = await supabase
    .from("client_document_quote_revisions")
    .select("*", { count: "exact", head: true })
    .eq("document_id", documentId)
    .eq("workflow_status", workflowStatus);

  if (error) {
    throw new Error(`Quote revision count failed: ${error.message}`);
  }

  return count ?? 0;
}

async function cleanup(inquiryId) {
  const { data: documents } = await supabase
    .from("client_documents")
    .select("id")
    .eq("inquiry_id", inquiryId);
  const documentIds = (documents ?? []).map((document) => document.id);

  if (documentIds.length) {
    await supabase.from("client_document_quote_revisions").delete().in("document_id", documentIds);
    await supabase.from("client_document_line_items").delete().in("document_id", documentIds);
    await supabase.from("client_document_payments").delete().in("document_id", documentIds);
    await supabase.from("activity_log").delete().eq("entity_type", "document").in("entity_id", documentIds);
    await supabase.from("client_documents").delete().in("id", documentIds);
  }

  const { data: project } = await supabase
    .from("event_projects")
    .select("id")
    .eq("inquiry_id", inquiryId)
    .maybeSingle();
  if (project?.id) {
    await supabase.from("activity_log").delete().eq("entity_type", "event_project").eq("entity_id", project.id);
    await supabase.from("event_projects").delete().eq("id", project.id);
  }

  await supabase.from("activity_log").delete().eq("entity_type", "inquiry").eq("entity_id", inquiryId);
  await supabase.from("workflow_transitions").delete().eq("inquiry_id", inquiryId);
  await supabase.from("crm_follow_up_tasks").delete().eq("inquiry_id", inquiryId);
  await supabase.from("customer_interactions").delete().eq("inquiry_id", inquiryId);
  await supabase.from("event_inquiries").delete().eq("id", inquiryId);
}

async function run() {
  await record("Quote workflow schema is installed", async () => {
    await checkQuoteWorkflowSchema();
    return "Quote workflow columns, revision table, and document activity enum are available.";
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "failed";
    if (reason !== "net::ERR_ABORTED") {
      requestFailures.push(`${request.method()} ${request.url()} :: ${reason}`);
    }
  });

  let inquiry = null;

  try {
    inquiry = await createTempInquiry();

    await record("Admin login", async () => {
      await login(page);
      return page.url();
    });

    await record("Quote draft saves workflow status", async () => {
      const response = await page.request.put(
        `${BASE_URL}/api/admin/inquiries/${inquiry.id}/quote-pricing`,
        {
          data: {
            base_fee: 3200,
            discount_amount: 0,
            delivery_fee: 450,
            labor_adjustment: 650,
            tax_amount: 0,
            manual_total_override: null,
            notes: "QA quote workflow draft.",
            draft_status: "internal_draft",
            generate_draft: true,
            mark_as_quoted: false,
            line_items: [
              {
                item_name: "Ceremony backdrop",
                unit_label: "package",
                unit_price: 1400,
                quantity: 1,
                notes: "QA line item",
                is_custom: true,
              },
            ],
          },
        }
      );
      if (!response.ok()) {
        throw new Error(`Draft save failed: ${response.status()} ${await response.text()}`);
      }
      const quote = await waitForQuote(inquiry.id, "draft");
      await waitForProjectStatus(inquiry.id, "quote_drafted");
      const revisions = await countQuoteRevisions(quote.id, "draft");
      if (revisions < 1) {
        throw new Error("Draft quote revision snapshot was not created.");
      }
      return `Quote ${quote.id} saved as draft with ${revisions} draft revision snapshot(s).`;
    });

    await record("Send or mark quote writes sent workflow status", async () => {
      const response = await page.request.post(
        `${BASE_URL}/api/admin/inquiries/${inquiry.id}/send-quote`,
        {
          data: {
            quoteAmount: 5700,
            quoteMessage: "QA quote workflow send.",
          },
        }
      );
      let sendDetail = "Quote email route sent successfully.";
      if (!response.ok()) {
        const body = await response.text();
        if (!body.includes("domain is not verified")) {
          throw new Error(`Send quote failed: ${response.status()} ${body}`);
        }

        const fallback = await page.request.put(
          `${BASE_URL}/api/admin/inquiries/${inquiry.id}/quote-pricing`,
          {
            data: {
              base_fee: 3200,
              discount_amount: 0,
              delivery_fee: 450,
              labor_adjustment: 650,
              tax_amount: 0,
              manual_total_override: null,
              notes: "QA quote workflow marked sent after email provider block.",
              draft_status: "shared_with_customer",
              generate_draft: false,
              mark_as_quoted: true,
              line_items: [
                {
                  item_name: "Ceremony backdrop",
                  unit_label: "package",
                  unit_price: 1400,
                  quantity: 1,
                  notes: "QA line item",
                  is_custom: true,
                },
              ],
            },
          }
        );

        if (!fallback.ok()) {
          throw new Error(`Fallback quote mark-as-sent failed: ${fallback.status()} ${await fallback.text()}`);
        }
        sendDetail = "Resend sender domain blocked email send; mark-as-quoted fallback verified sent workflow.";
      }
      const quote = await waitForQuote(inquiry.id, "sent");
      await waitForProjectStatus(inquiry.id, "quote_sent");
      const revisions = await countQuoteRevisions(quote.id, "sent");
      if (revisions < 1) {
        throw new Error("Sent quote revision snapshot was not created.");
      }
      return `${sendDetail} Quote ${quote.id} moved to sent.`;
    });

    await record("Client approve writes accepted workflow status", async () => {
      const { data: currentInquiry } = await supabase
        .from("event_inquiries")
        .select("id, email, quoted_at")
        .eq("id", inquiry.id)
        .single();
      const token = createQuoteActionToken({
        inquiryId: currentInquiry.id,
        email: currentInquiry.email,
        quotedAt: currentInquiry.quoted_at,
      });
      const response = await page.request.post(`${BASE_URL}/api/quotes/respond`, {
        data: {
          inquiryId: inquiry.id,
          token,
          action: "approve",
          comment: "QA approval.",
        },
      });
      if (!response.ok()) {
        throw new Error(`Approve quote failed: ${response.status()} ${await response.text()}`);
      }
      const quote = await waitForQuote(inquiry.id, "accepted");
      await waitForProjectStatus(inquiry.id, "quote_accepted");
      const revisions = await countQuoteRevisions(quote.id, "accepted");
      if (revisions < 1) {
        throw new Error("Accepted quote revision snapshot was not created.");
      }
      return "Client approval updated quote and project lifecycle.";
    });

    await record("Client change request writes revision_requested workflow status", async () => {
      const { data: currentInquiry } = await supabase
        .from("event_inquiries")
        .select("id, email, quoted_at")
        .eq("id", inquiry.id)
        .single();
      const token = createQuoteActionToken({
        inquiryId: currentInquiry.id,
        email: currentInquiry.email,
        quotedAt: currentInquiry.quoted_at,
      });
      const before = await waitForQuote(inquiry.id, "accepted");
      const response = await page.request.post(`${BASE_URL}/api/quotes/respond`, {
        data: {
          inquiryId: inquiry.id,
          token,
          action: "request_changes",
          comment: "QA revision request.",
        },
      });
      if (!response.ok()) {
        throw new Error(`Request changes failed: ${response.status()} ${await response.text()}`);
      }
      const quote = await waitForQuote(inquiry.id, "revision_requested");
      await waitForProjectStatus(inquiry.id, "quote_drafted");
      if (Number(quote.quote_revision_number ?? 0) <= Number(before.quote_revision_number ?? 0)) {
        throw new Error("Quote revision number did not increment after change request.");
      }
      const revisions = await countQuoteRevisions(quote.id, "revision_requested");
      if (revisions < 1) {
        throw new Error("Revision requested quote snapshot was not created.");
      }
      return `Revision requested and revision number advanced to ${quote.quote_revision_number}.`;
    });

    await record("CRM timeline shows quote activity", async () => {
      const quote = await waitForQuote(inquiry.id, "revision_requested");
      const { data: activities } = await supabase
        .from("activity_log")
        .select("action")
        .eq("entity_type", "document")
        .eq("entity_id", quote.id);
      const actions = new Set((activities ?? []).map((activity) => activity.action));
      for (const action of ["quote.draft_saved", "quote.sent", "quote.accepted", "quote.revision_requested"]) {
        if (!actions.has(action)) {
          throw new Error(`Missing document activity action ${action}.`);
        }
      }

      const { data: project } = await supabase
        .from("event_projects")
        .select("id")
        .eq("inquiry_id", inquiry.id)
        .maybeSingle();
      if (!project?.id) {
        throw new Error("Project was not created for quote workflow.");
      }

      await page.goto(`${BASE_URL}/admin/events/projects/${project.id}`, {
        waitUntil: "networkidle",
      });
      await page.waitForLoadState("networkidle");
      const text = await page.locator("body").textContent();
      for (const expected of [
        "Quote draft saved",
        "Quote sent to client",
        "Client requested quote changes",
      ]) {
        if (!text?.includes(expected)) {
          throw new Error(`Project timeline did not include ${expected}.`);
        }
      }
      return "Project timeline includes quote draft, sent, and revision activity.";
    });

    await record("Browser console/network", async () => {
      if (consoleErrors.length || pageErrors.length || requestFailures.length) {
        throw new Error(
          JSON.stringify({ consoleErrors, pageErrors, requestFailures }, null, 2)
        );
      }
      return JSON.stringify({ consoleErrors, pageErrors, requestFailures }, null, 2);
    });
  } finally {
    if (inquiry?.id) {
      await cleanup(inquiry.id);
    }
    await browser.close();
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  }
}

run().catch((error) => {
  if (!results.some((result) => result.result === "FAIL")) {
    push("Runner", "FAIL", error instanceof Error ? error.message : String(error));
  }
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  process.exit(1);
});
