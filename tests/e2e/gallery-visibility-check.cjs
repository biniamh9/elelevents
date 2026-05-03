const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const RESULTS_PATH = path.join(process.cwd(), "tests/e2e/gallery-visibility-results.json");
const SHOT_PATH = path.join(process.cwd(), "tests/e2e/gallery-visibility.png");

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    requestFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? "failed"}`);
  });

  await page.goto(`${BASE_URL}/gallery`, { waitUntil: "networkidle" });
  await page.screenshot({ path: SHOT_PATH, fullPage: true });

  const result = await page.evaluate(() => {
    const gridItems = Array.from(document.querySelectorAll(".gallery-grid .gallery-item"));
    const visibleGridItems = gridItems.filter((item) => {
      const style = window.getComputedStyle(item);
      const rect = item.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    });

    const section = document.querySelector(".gallery-browser-shell");
    const sectionStyle = section ? window.getComputedStyle(section) : null;

    return {
      title: document.title,
      galleryItems: gridItems.length,
      visibleGalleryItems: visibleGridItems.length,
      sectionOpacity: sectionStyle?.opacity ?? null,
      bodyText: document.body.innerText.slice(0, 1000),
    };
  });

  const payload = {
    baseUrl: BASE_URL,
    result,
    consoleErrors,
    pageErrors,
    requestFailures,
    screenshot: SHOT_PATH,
  };

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(payload, null, 2));
  await browser.close();
}

run().catch((error) => {
  fs.writeFileSync(
    RESULTS_PATH,
    JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2)
  );
  console.error(error);
  process.exit(1);
});
