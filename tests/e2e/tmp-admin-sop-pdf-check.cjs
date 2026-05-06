const { chromium } = require("playwright");
const QA_EMAIL = "qa-admin@elelevents.local";
const QA_PASSWORD = "QA-Admin-2026!";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const base = process.env.QA_BASE_URL || "http://127.0.0.1:3002";

  await page.goto(base + "/admin/login", { waitUntil: "networkidle" });
  await page.locator("input[type=email]").fill(QA_EMAIL);
  await page.locator("input[type=password]").fill(QA_PASSWORD);
  await Promise.all([
    page.waitForURL(/\/admin\//),
    page.getByRole("button", { name: /sign in|log in/i }).click(),
  ]);
  await page.waitForTimeout(2000);

  const cookies = await context.cookies(base);
  const cookieHeader = cookies.map((c) => c.name + "=" + c.value).join("; ");
  const response = await fetch(base + "/api/admin/sop/pdf", {
    headers: { cookie: cookieHeader },
  });
  const arrayBuffer = await response.arrayBuffer();

  console.log(JSON.stringify({
    url: page.url(),
    cookies: cookies.map((c) => c.name),
    status: response.status,
    contentType: response.headers.get("content-type"),
    disposition: response.headers.get("content-disposition"),
    byteLength: arrayBuffer.byteLength,
  }, null, 2));

  await browser.close();
})();
