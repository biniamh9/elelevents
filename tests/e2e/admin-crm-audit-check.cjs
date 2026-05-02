const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const QA_EMAIL = "qa-admin@elelevents.local";
const QA_PASSWORD = "QA-Admin-2026!";
const RESULTS_PATH = path.join(process.cwd(), "tests/e2e/admin-crm-audit-results.json");

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

async function createTempInquiry() {
  const email = `qa-admin-archive-${Date.now()}@elelevents.local`;
  const { data, error } = await supabase
    .from("event_inquiries")
    .insert({
      first_name: "QA",
      last_name: "Archive",
      email,
      phone: "4045550011",
      event_type: "Wedding",
      event_date: "2026-09-20",
      guest_count: 120,
      status: "new",
      estimated_price: 6500,
      consultation_status: "not_scheduled",
      quote_response_status: "not_sent",
      booking_stage: "inquiry",
    })
    .select("id, email")
    .single();

  if (error || !data) {
    throw new Error(`Temp inquiry creation failed: ${error?.message || "unknown"}`);
  }

  return data;
}

async function getDeleteBlockedInquiry() {
  const { data: contract } = await supabase
    .from("contracts")
    .select("inquiry_id")
    .not("inquiry_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (!contract?.inquiry_id) {
    throw new Error("No inquiry linked to a contract was available for delete-block testing.");
  }

  const { data: inquiry, error } = await supabase
    .from("event_inquiries")
    .select("id, email, first_name, last_name")
    .eq("id", contract.inquiry_id)
    .maybeSingle();

  if (error || !inquiry) {
    throw new Error(`Delete-block inquiry lookup failed: ${error?.message || "unknown"}`);
  }

  return inquiry;
}

async function cleanupTempInquiry(id) {
  await supabase.from("event_inquiries").delete().eq("id", id);
}

async function waitForInquiryStatus(id, expectedStatus, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const { data, error } = await supabase
      .from("event_inquiries")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Inquiry status lookup failed: ${error.message}`);
    }

    if (data?.status === expectedStatus) {
      return data;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const { data, error } = await supabase
    .from("event_inquiries")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Inquiry status lookup failed: ${error.message}`);
  }

  throw new Error(`Expected inquiry status ${expectedStatus} but found ${JSON.stringify(data)}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "failed";
    if (reason !== "net::ERR_ABORTED") {
      requestFailures.push(`${request.method()} ${request.url()} :: ${reason}`);
    }
  });

  const tempInquiry = await createTempInquiry();
  const deleteBlockedInquiry = await getDeleteBlockedInquiry();

  try {
    await record("Admin login", async () => {
      await login(page);
      return page.url();
    });

    await record("Overview loads", async () => {
      await page.goto(`${BASE_URL}/admin/inquiries`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Overview" }).waitFor();
      await page.getByRole("link", { name: "Open CRM Pipeline" }).first().waitFor();
      return "Overview loaded with CRM preview.";
    });

    await record("Sidebar CRM pipeline route", async () => {
      await page.goto(`${BASE_URL}/admin/crm-analytics`, { waitUntil: "networkidle" });
      await page.getByText("Shared workflow from request to booked event").waitFor();
      return "CRM pipeline loaded.";
    });

    await record("CRM leads tab", async () => {
      await page.goto(`${BASE_URL}/admin/crm-analytics?tab=leads`, { waitUntil: "networkidle" });
      await page.getByText("Leads", { exact: false }).first().waitFor();
      const leadLink = page.locator("a[href^='/admin/crm-analytics/']").first();
      await leadLink.waitFor({ state: "visible", timeout: 15000 });
      await leadLink.click();
      await page.waitForURL(/\/admin\/crm-analytics\/.+/, { timeout: 15000 });
      return page.url();
    });

    await record("Sales filtered quote view", async () => {
      await page.goto(`${BASE_URL}/admin/documents?type=quote`, { waitUntil: "networkidle" });
      await page.getByText("Quotes, invoices, and receipts").first().waitFor();
      await page.getByRole("button", { name: "Quote / Proposal" }).waitFor();
      return "Documents quote filter route loaded.";
    });

    await record("Archive inquiry from actions menu", async () => {
      await page.goto(
        `${BASE_URL}/admin/inquiries?tab=inquiries&q=${encodeURIComponent(tempInquiry.email)}`,
        { waitUntil: "networkidle" }
      );
      const dialogPromise = page.waitForEvent("dialog");
      await page.getByRole("button", { name: "Actions" }).first().click();
      await page.getByRole("button", { name: "Archive" }).click();
      const dialog = await dialogPromise;
      await dialog.accept();
      await waitForInquiryStatus(tempInquiry.id, "archived");

      return "Archive action persisted status=archived.";
    });

    await record("Archived inquiry hidden by default", async () => {
      await page.goto(
        `${BASE_URL}/admin/inquiries?tab=inquiries&q=${encodeURIComponent(tempInquiry.email)}`,
        { waitUntil: "networkidle" }
      );
      const tableText = await page.locator(".admin-record-table-shell").textContent();
      if (tableText && tableText.includes(tempInquiry.email)) {
        throw new Error("Archived inquiry still appeared in default inquiry list.");
      }
      return "Archived inquiry was hidden from default list.";
    });

    await record("Archived inquiry can be filtered back in", async () => {
      await page.goto(
        `${BASE_URL}/admin/inquiries?tab=inquiries&status=archived&q=${encodeURIComponent(tempInquiry.email)}`,
        { waitUntil: "networkidle" }
      );
      await page.getByText(tempInquiry.email).waitFor({ timeout: 10000 });
      return "Archived inquiry visible in archived filter.";
    });

    await record("Hard delete is blocked when related records exist", async () => {
      await page.goto(
        `${BASE_URL}/admin/inquiries?tab=inquiries&q=${encodeURIComponent(deleteBlockedInquiry.email)}`,
        { waitUntil: "networkidle" }
      );
      const dialogPromise = page.waitForEvent("dialog");
      await page.getByRole("button", { name: "Actions" }).first().click();
      await page.getByRole("button", { name: "Delete" }).click();
      const dialog = await dialogPromise;
      await dialog.accept();
      await page.getByText("Archive instead, or remove linked records first.").waitFor({
        timeout: 10000,
      });
      return "Delete was blocked with related-record warning.";
    });

    await record("Sidebar route smoke", async () => {
      const routes = [
        "/admin/calendar",
        "/admin/vendors",
        "/admin/contracts",
        "/admin/finance?tab=income",
        "/admin/rentals",
        "/admin/rentals?tab=inventory",
        "/admin/packages",
        "/admin/pricing",
        "/admin/flow",
        "/admin/gallery",
        "/admin/testimonials",
        "/admin/social",
        "/admin/settings?tab=users",
      ];

      for (const route of routes) {
        const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
        if (!response || response.status() >= 400) {
          throw new Error(`${route} failed with ${response?.status()}`);
        }
      }

      return "Sidebar routes returned successful responses.";
    });

    const browserLogResult =
      consoleErrors.length || pageErrors.length || requestFailures.length ? "FAIL" : "PASS";
    push(
      "Browser console/network",
      browserLogResult,
      JSON.stringify({ consoleErrors, pageErrors, requestFailures }, null, 2)
    );
  } finally {
    await cleanupTempInquiry(tempInquiry.id);
    await browser.close();
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  }
}

run().catch((error) => {
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  console.error(error);
  process.exit(1);
});
