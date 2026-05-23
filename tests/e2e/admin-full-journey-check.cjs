const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const QA_EMAIL = "qa-admin@elelevents.local";
const QA_PASSWORD = "QA-Admin-2026!";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const results = [];

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
  await page.waitForURL(/\/admin\/(inquiries|crm-analytics|documents|contracts|finance|calendar|rentals|settings)/, {
    timeout: 20000,
  });
}

async function requestJson(page, method, url, data) {
  const response = await page.request[method.toLowerCase()](url, { data });
  const body = await response.json().catch(() => ({}));
  if (!response.ok()) {
    throw new Error(`${method} ${url} failed ${response.status()}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function queryOne(table, columns, column, value) {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq(column, value)
    .maybeSingle();

  if (error) {
    throw new Error(`${table} lookup failed: ${error.message}`);
  }

  return data;
}

async function cleanup({ inquiryId, clientId, projectId, documentIds }) {
  if (documentIds.length) {
    await supabase.from("client_document_payments").delete().in("document_id", documentIds);
    await supabase.from("client_document_line_items").delete().in("document_id", documentIds);
    await supabase.from("client_document_quote_revisions").delete().in("document_id", documentIds);
    await supabase.from("activity_log").delete().eq("entity_type", "document").in("entity_id", documentIds);
    await supabase.from("client_documents").delete().in("id", documentIds);
  }

  if (projectId) {
    await supabase.from("activity_log").delete().eq("entity_type", "event_project").eq("entity_id", projectId);
    await supabase.from("event_projects").delete().eq("id", projectId);
  }

  if (inquiryId) {
    await supabase.from("activity_log").delete().eq("entity_type", "inquiry").eq("entity_id", inquiryId);
    await supabase.from("workflow_transitions").delete().eq("inquiry_id", inquiryId);
    await supabase.from("event_inquiries").delete().eq("id", inquiryId);
  }

  if (clientId) {
    await supabase.from("activity_log").delete().eq("entity_type", "client").eq("entity_id", clientId);
    await supabase.from("clients").delete().eq("id", clientId);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  const created = {
    inquiryId: null,
    clientId: null,
    projectId: null,
    documentIds: [],
  };

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

  try {
    await record("Admin login", async () => {
      await login(page);
      return page.url();
    });

    const stamp = Date.now();
    const email = `qa-full-admin-${stamp}@elelevents.local`;
    const fullName = `QA Full Admin ${stamp}`;

    await record("Create admin inquiry through authenticated API", async () => {
      const body = await requestJson(page, "POST", `${BASE_URL}/api/admin/inquiries`, {
        firstName: "QA Full",
        lastName: `Admin ${stamp}`,
        email,
        phone: "4045559090",
        eventType: "Wedding",
        eventDate: "2026-12-12",
        guestCount: 175,
        services: ["Full Event Decoration", "Chair Rental"],
        budgetRange: "$5,000 – $8,000",
        consultationPreference: "Phone Call",
        inspirationNotes: "Full admin journey regression.",
        additionalInfo: "Created by admin full journey QA.",
        referralSource: "manual_admin_entry",
        preferredContactMethod: "phone",
      });

      created.inquiryId = body.inquiry.id;
      const inquiry = await queryOne(
        "event_inquiries",
        "id, client_id, email, guest_count",
        "id",
        created.inquiryId
      );
      created.clientId = inquiry.client_id;
      if (inquiry.email !== email || inquiry.guest_count !== 175) {
        throw new Error(`Inquiry persisted incorrectly: ${JSON.stringify(inquiry)}`);
      }
      return created.inquiryId;
    });

    await record("Inquiry detail loads created record", async () => {
      await page.goto(`${BASE_URL}/admin/inquiries/${created.inquiryId}`, { waitUntil: "networkidle" });
      await page.getByText(fullName, { exact: false }).first().waitFor({ timeout: 15000 });
      return page.url();
    });

    await record("Customer hub exposes command center", async () => {
      const project = await queryOne("event_projects", "id, status", "inquiry_id", created.inquiryId);
      created.projectId = project?.id ?? null;
      await page.goto(`${BASE_URL}/admin/crm-analytics/customers/${created.clientId}`, { waitUntil: "networkidle" });
      await page.getByText("Next step", { exact: true }).waitFor({ timeout: 15000 });
      await page.getByLabel("Update status").waitFor({ state: "visible", timeout: 15000 });
      return page.url();
    });

    await record("Project hub exposes command center", async () => {
      await page.goto(`${BASE_URL}/admin/events/projects/${created.projectId || created.inquiryId}`, { waitUntil: "networkidle" });
      await page.getByText("Event and ownership summary", { exact: true }).waitFor({ timeout: 15000 });
      await page.getByText("Next step", { exact: true }).waitFor({ timeout: 15000 });
      return page.url();
    });

    let quoteId = null;
    await record("Create quote document linked to inquiry/project", async () => {
      const body = await requestJson(page, "POST", `${BASE_URL}/api/admin/documents`, {
        inquiry_id: created.inquiryId,
        document_type: "quote",
        document_number: `QA-QT-${stamp}`,
        status: "draft",
        issue_date: "2026-05-23",
        customer_name: fullName,
        customer_email: email,
        customer_phone: "4045559090",
        event_type: "Wedding",
        event_date: "2026-12-12",
        guest_count: 175,
        venue_name: "QA Event Hall",
        notes: "QA quote.",
        line_items: [
          {
            title: "Full event decoration",
            description: "QA line item",
            quantity: 1,
            unit_price: 3500,
          },
        ],
        delivery_fee: 0,
        setup_fee: 0,
        discount_amount: 0,
        tax_amount: 0,
        deposit_required: 1000,
        amount_paid: 0,
      });

      quoteId = body.document.id;
      created.documentIds.push(quoteId);
      const project = await queryOne("event_projects", "id, status", "inquiry_id", created.inquiryId);
      created.projectId = project?.id ?? created.projectId;
      if (project?.status !== "quote_drafted") {
        throw new Error(`Expected project status quote_drafted, got ${project?.status}`);
      }
      return quoteId;
    });

    let invoiceId = null;
    await record("Convert quote to invoice", async () => {
      const body = await requestJson(
        page,
        "POST",
        `${BASE_URL}/api/admin/documents/${quoteId}/convert`,
        { target_type: "invoice" }
      );
      invoiceId = body.document.id;
      created.documentIds.push(invoiceId);
      return invoiceId;
    });

    await record("Invoice payment screen opens from document URL", async () => {
      await page.goto(`${BASE_URL}/admin/documents/${invoiceId}?openPayment=1&paymentMethod=cash`, {
        waitUntil: "networkidle",
      });
      await page.getByText("Pay invoice", { exact: true }).waitFor({ timeout: 15000 });
      await page.getByText("Record customer payment", { exact: true }).waitFor({ timeout: 15000 });
      await page.getByText("Remaining balance", { exact: true }).waitFor({ timeout: 15000 });
      await page.getByText("Partial payment amount", { exact: true }).waitFor({ timeout: 15000 });
      await page.getByRole("button", { name: "Use full balance" }).waitFor({ timeout: 15000 });
      return page.url();
    });

    await record("Record partial invoice payment", async () => {
      const body = await requestJson(
        page,
        "POST",
        `${BASE_URL}/api/admin/documents/${invoiceId}/payments`,
        {
          amount: 1000,
          payment_date: "2026-05-23",
          payment_method: "cash",
          reference_number: null,
          notes: "QA partial payment.",
        }
      );
      if (body.receipt?.id) created.documentIds.push(body.receipt.id);
      const invoice = await queryOne("client_documents", "id, status, amount_paid, balance_due", "id", invoiceId);
      if (
        invoice.status !== "partially_paid" ||
        Number(invoice.amount_paid) !== 1000 ||
        Number(invoice.balance_due) !== 2500
      ) {
        throw new Error(`Invoice partial payment did not update balance correctly: ${JSON.stringify(invoice)}`);
      }
      return body.receipt?.id;
    });

    await record("Record remaining invoice balance and receipt", async () => {
      const body = await requestJson(
        page,
        "POST",
        `${BASE_URL}/api/admin/documents/${invoiceId}/payments`,
        {
          amount: 2500,
          payment_date: "2026-05-23",
          payment_method: "cash",
          reference_number: null,
          notes: "QA remaining balance payment.",
        }
      );
      if (body.receipt?.id) created.documentIds.push(body.receipt.id);
      const invoice = await queryOne("client_documents", "id, status, amount_paid, balance_due", "id", invoiceId);
      if (invoice.status !== "paid" || Number(invoice.amount_paid) !== 3500 || Number(invoice.balance_due) !== 0) {
        throw new Error(`Invoice remaining payment did not settle invoice: ${JSON.stringify(invoice)}`);
      }
      return body.receipt?.id;
    });

    await record("Documents action menus expose sales workflow", async () => {
      await page.goto(`${BASE_URL}/admin/documents?type=invoice`, { waitUntil: "networkidle" });
      await page.locator("tbody tr").filter({ hasText: fullName }).first().getByRole("button", { name: "Actions" }).click();
      await page.getByText("Pay / Record Payment", { exact: true }).waitFor({ timeout: 12000 });
      await page.getByText("Generate Receipt", { exact: true }).waitFor({ timeout: 12000 });
      return "Invoice row actions visible.";
    });

    await record("Update project lifecycle status from project hub", async () => {
      await page.goto(`${BASE_URL}/admin/events/projects/${created.projectId}`, { waitUntil: "networkidle" });
      await page.getByLabel("Update status").selectOption("planning_in_progress");
      await page.getByRole("button", { name: "Update" }).click();
      await page.getByText("Status updated.").waitFor({ timeout: 15000 });
      const project = await queryOne("event_projects", "id, status", "id", created.projectId);
      if (project.status !== "planning_in_progress") {
        throw new Error(`Project status not updated: ${JSON.stringify(project)}`);
      }
      return "Project lifecycle updated to planning_in_progress.";
    });

    await record("Admin route smoke after lifecycle work", async () => {
      const routes = [
        "/admin/crm-analytics",
        "/admin/crm-analytics/leads",
        "/admin/crm-analytics/customers",
        "/admin/documents?type=quote",
        "/admin/documents?type=invoice",
        "/admin/documents?type=receipt",
        "/admin/contracts",
        "/admin/finance",
        "/admin/calendar",
        "/admin/rentals",
        "/admin/gallery",
        "/admin/settings?tab=workspace",
      ];

      for (const route of routes) {
        const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
        if (!response || response.status() >= 400) {
          throw new Error(`${route} failed with ${response?.status()}`);
        }
      }

      return "Core admin routes loaded after workflow mutations.";
    });

    const browserLogResult =
      consoleErrors.length || pageErrors.length || requestFailures.length ? "FAIL" : "PASS";
    push(
      "Browser console/network",
      browserLogResult,
      JSON.stringify({ consoleErrors, pageErrors, requestFailures }, null, 2)
    );

    if (browserLogResult === "FAIL") {
      throw new Error("Browser console/network failures were detected.");
    }

    console.log(JSON.stringify({ result: "PASS", results }, null, 2));
  } finally {
    await cleanup(created);
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
