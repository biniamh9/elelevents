const { chromium } = require("playwright");
const QA_EMAIL = "qa-admin@elelevents.local";
const QA_PASSWORD = "QA-Admin-2026!";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const base = process.env.QA_BASE_URL || "http://127.0.0.1:3002";
  const results = { steps: [], consoleErrors: [], pageErrors: [], requestFailures: [] };
  page.on("console", (msg) => { if (msg.type() === "error") results.consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => results.pageErrors.push(String(err)));
  page.on("requestfailed", (req) => {
    const reason = (req.failure() && req.failure().errorText) || "failed";
    if (reason !== "net::ERR_ABORTED") {
      results.requestFailures.push(req.method() + " " + req.url() + " :: " + reason);
    }
  });

  await page.goto(base + "/admin/login", { waitUntil: "networkidle" });
  await page.locator("input[type=email]").fill(QA_EMAIL);
  await page.locator("input[type=password]").fill(QA_PASSWORD);
  await Promise.all([
    page.waitForURL(/\/admin\//),
    page.getByRole("button", { name: /sign in|log in/i }).click(),
  ]);
  results.steps.push({ name: "login", url: page.url() });

  for (const item of [
    { name: "Quotes", path: "/admin/documents?type=quote", expected: "Quote / Proposal" },
    { name: "Invoices", path: "/admin/documents?type=invoice", expected: "Invoice" },
    { name: "Receipts", path: "/admin/documents?type=receipt", expected: "Payment Receipt" },
  ]) {
    await page.goto(base + item.path, { waitUntil: "networkidle" });
    const activeChip = await page.getByRole("button", { name: item.expected, exact: true }).getAttribute("class");
    const tableText = await page.locator("table tbody").textContent();
    results.steps.push({
      name: item.name,
      url: page.url(),
      activeChip,
      tablePreview: (tableText || "").slice(0, 200)
    });
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
