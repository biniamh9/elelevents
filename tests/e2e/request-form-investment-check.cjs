const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const adminEmail = process.env.QA_ADMIN_EMAIL || "qa-admin@elelevents.local";
const adminPassword = process.env.QA_ADMIN_PASSWORD || "QA-Admin-2026!";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function collectIssues(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });

  page.on("requestfailed", (request) => {
    requestFailures.push(
      `${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? "failed"}`
    );
  });

  return { consoleErrors, pageErrors, requestFailures };
}

async function verifyViewport(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(`${baseUrl}/request`, { waitUntil: "networkidle", timeout: 60000 });
  const overflowX = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  });
  assert(!overflowX, `Horizontal overflow at ${width}x${height}`);
  await page.getByRole("button", { name: /check availability/i }).scrollIntoViewIfNeeded();
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  const issues = await collectIssues(page);
  const uniqueEmail = `qa-investment-${Date.now()}@elelevents.local`;

  try {
    for (const viewport of [
      [1440, 1400],
      [1024, 1366],
      [430, 1200],
      [390, 1200],
    ]) {
      await verifyViewport(page, viewport[0], viewport[1]);
    }

    await page.setViewportSize({ width: 1440, height: 1400 });
    await page.goto(`${baseUrl}/request`, { waitUntil: "networkidle", timeout: 60000 });

    await page.getByRole("button", { name: /check availability/i }).click();
    await page.waitForTimeout(150);
    await page.getByText("Please enter the estimated number of guests.").waitFor();
    await page.getByText("Please select your investment range.").waitFor();
    await page.getByText("Please select a consultation preference.").waitFor();

    await page.getByPlaceholder("Estimated guest count").fill("0");
    await page.getByRole("button", { name: /check availability/i }).click();
    await page.getByText("Guest count must be at least 1.").waitFor();

    await page.getByPlaceholder("Estimated guest count").fill("-5");
    await page.getByRole("button", { name: /check availability/i }).click();
    await page.getByText("Guest count must be at least 1.").waitFor();

    await page.getByRole("button", { name: "Less than $2,500" }).click();
    await page.getByRole("button", { name: "Phone Call" }).click();
    await page.getByPlaceholder("Estimated guest count").fill("350");
    await page.getByText(
      "We cleared the previously selected investment range because events over 300 guests need a higher starting range."
    ).waitFor();
    await page.getByText(
      "For events over 300 guests, we recommend a higher investment range to support full decor, staffing, setup, and event complexity."
    ).waitFor();
    await expectDisabledBudgetCards(page);

    await page.getByRole("button", { name: "$8,000 – $12,000" }).click();
    await page.getByRole("button", { name: "Video Call" }).click();
    await page.getByRole("button", { name: "Full Event Decoration" }).click();
    await page.getByRole("button", { name: "Floral Design" }).click();
    await page.getByLabel("Event Type").selectOption("Wedding");
    await page.getByLabel("Event Date").fill("2026-11-15");
    await page.getByLabel("Name").fill("QA Investment");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Phone").fill("5555555555");

    await Promise.all([
      page.waitForURL(/\/request\/follow-up\?/, { timeout: 60000 }),
      page.getByRole("button", { name: /check availability/i }).click(),
    ]);

    const { data: inserted, error } = await supabase
      .from("event_inquiries")
      .select("id, event_type, guest_count, preferred_contact_method, additional_info, event_date")
      .eq("email", uniqueEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    assert(inserted, "Expected inserted inquiry row.");
    assert(inserted.event_type === "Wedding", "Expected saved event type.");
    assert(inserted.guest_count === 350, "Expected saved guest_count 350.");
    assert(
      inserted.preferred_contact_method === "Video Call",
      "Expected saved consultation preference."
    );
    assert(
      inserted.additional_info?.includes("Investment range: $8,000 – $12,000"),
      "Expected saved investment range in additional_info."
    );

    await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle", timeout: 60000 });
    await page.locator("input[type='email']").fill(adminEmail);
    await page.locator("input[type='password']").fill(adminPassword);
    await Promise.all([
      page.waitForURL(/\/admin\/(?!login)/, { timeout: 60000 }),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);

    await page.goto(`${baseUrl}/admin/inquiries/${inserted.id}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForURL(new RegExp(`/admin/inquiries/${inserted.id}$`), {
      timeout: 60000,
    });
    await page.getByText(/Guest count:\s*350/i).first().waitFor();
    await page.getByText(/Investment range:\s*\$8,000 – \$12,000/i).first().waitFor();
    await page.getByText(/Consultation preference:\s*Video Call/i).first().waitFor();

    assert(issues.consoleErrors.length === 0, `Console errors: ${issues.consoleErrors.join("\n")}`);
    assert(issues.pageErrors.length === 0, `Page errors: ${issues.pageErrors.join("\n")}`);

    console.log(
      JSON.stringify(
        {
          result: "PASS",
          email: uniqueEmail,
          insertedId: inserted.id,
          consoleErrors: issues.consoleErrors,
          pageErrors: issues.pageErrors,
          requestFailures: issues.requestFailures,
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
}

async function expectDisabledBudgetCards(page) {
  const lowBudget = page.getByRole("button", { name: /Less than \$2,500/i });
  const midBudget = page.getByRole("button", { name: /\$2,500 – \$5,000/i });

  await lowBudget.waitFor();
  await midBudget.waitFor();

  assert(await lowBudget.isDisabled(), "Expected Less than $2,500 to be disabled.");
  assert(await midBudget.isDisabled(), "Expected $2,500 – $5,000 to be disabled.");
  await page.getByText("Not recommended for 300+ guests").first().waitFor();
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        result: "FAIL",
        error: String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});
