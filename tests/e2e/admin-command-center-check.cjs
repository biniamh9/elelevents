const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const QA_EMAIL = "qa-admin@elelevents.local";
const QA_PASSWORD = "QA-Admin-2026!";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function login(page) {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle" });
  await page.locator("input[type='email']").fill(QA_EMAIL);
  await page.locator("input[type='password']").fill(QA_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/admin\/(inquiries|crm-analytics|documents|contracts|finance|calendar|rentals|settings)/, {
    timeout: 60000,
    waitUntil: "commit",
  });
}

async function getSample(table, columns, filters = []) {
  let query = supabase.from(table).select(columns).order("created_at", { ascending: false }).limit(1);
  for (const [column, value] of filters) {
    query = query.eq(column, value);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`${table} sample failed: ${error.message}`);
  return data;
}

async function assertVisible(page, text) {
  await page.getByText(text, { exact: true }).waitFor({ state: "visible", timeout: 12000 });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const results = [];

  try {
    await login(page);

    const invoice = await getSample("client_documents", "id", [["document_type", "invoice"]]);
    if (invoice?.id) {
      await page.goto(`${BASE_URL}/admin/documents?type=invoice`, { waitUntil: "networkidle" });
      await page.locator("tbody tr").first().getByRole("button", { name: "Actions" }).click();
      await assertVisible(page, "Email Invoice to Customer");
      await assertVisible(page, "Pay / Record Payment");
      await assertVisible(page, "Generate Receipt");
      results.push("Invoice Actions exposes Email Invoice to Customer, Pay / Record Payment, and Generate Receipt");
    } else {
      results.push("Skipped invoice Actions check: no invoice document available");
    }

    const quote = await getSample("client_documents", "id", [["document_type", "quote"]]);
    if (quote?.id) {
      await page.goto(`${BASE_URL}/admin/documents?type=quote`, { waitUntil: "networkidle" });
      await page.locator("tbody tr").first().getByRole("button", { name: "Actions" }).click();
      await assertVisible(page, "Create Invoice");
      results.push("Quote Actions exposes Create Invoice");
    } else {
      results.push("Skipped quote Actions check: no quote document available");
    }

    const customer = await getSample("clients", "id");
    if (customer?.id) {
      await page.goto(`${BASE_URL}/admin/crm-analytics/customers/${customer.id}`, { waitUntil: "networkidle" });
      await assertVisible(page, "Next step");
      await page.getByLabel("Update status").waitFor({ state: "visible", timeout: 12000 });
      results.push("Customer hub exposes Next step command center and status updater");
    } else {
      results.push("Skipped customer command center check: no customer available");
    }

    const project = await getSample("event_projects", "id");
    if (project?.id) {
      await page.goto(`${BASE_URL}/admin/events/projects/${project.id}`, { waitUntil: "networkidle" });
      await assertVisible(page, "Next step");
      await page.getByLabel("Update status").waitFor({ state: "visible", timeout: 12000 });
      results.push("Project hub exposes Next step command center and status updater");
    } else {
      results.push("Skipped project command center check: no event project available");
    }

    console.log(JSON.stringify({ result: "PASS", results }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
