const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const QA_EMAIL = "qa-admin@elelevents.local";
const QA_PASSWORD = "QA-Admin-2026!";
const RESULTS_PATH = path.join(process.cwd(), "tests/e2e/qa-results.json");
const UPLOAD_FILE = path.join(process.cwd(), "logo.png");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const results = [];

function nowIso() {
  return new Date().toISOString();
}

function pushResult(entry) {
  results.push({
    testedAt: nowIso(),
    ...entry,
  });
}

async function withStep(name, fn, { fatal = true } = {}) {
  try {
    const detail = await fn();
    pushResult({
      type: "step",
      name,
      result: "PASS",
      detail: detail || "",
    });
    return detail;
  } catch (error) {
    pushResult({
      type: "step",
      name,
      result: "FAIL",
      detail: error instanceof Error ? error.message : String(error),
    });
    if (fatal) {
      throw error;
    }
    return null;
  }
}

async function getSample(table, columns, orderColumn = "created_at") {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .order(orderColumn, { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    pushResult({
      type: "sample-query",
      name: `Sample ${table}`,
      result: "FAIL",
      detail: error.message,
    });
    return null;
  }

  pushResult({
    type: "sample-query",
    name: `Sample ${table}`,
    result: data ? "PASS" : "SKIP",
    detail: data ? JSON.stringify(data) : "No row available",
  });

  return data;
}

async function getInquiryByEmail(email) {
  const { data, error } = await supabase
    .from("event_inquiries")
    .select("id, email, first_name, last_name, event_type, follow_up_details_json, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Inquiry lookup failed: ${error.message}`);
  }

  return data;
}

async function attachPageObservers(page, label) {
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "failed";
    if (reason === "net::ERR_ABORTED") {
      return;
    }
    requestFailures.push(`${request.method()} ${request.url()} :: ${reason}`);
  });

  return () => {
    pushResult({
      type: "browser-log",
      name: `Browser logs: ${label}`,
      result: consoleErrors.length || pageErrors.length || requestFailures.length ? "FAIL" : "PASS",
      detail: JSON.stringify({ consoleErrors, pageErrors, requestFailures }, null, 2),
    });
  };
}

async function smokeRoute(page, route, checks = []) {
  const response = await page.goto(`${BASE_URL}${route}`, {
    waitUntil: "domcontentloaded",
  });

  if (!response) {
    throw new Error(`No response returned for ${route}`);
  }

  if (response.status() >= 400) {
    throw new Error(`${route} returned HTTP ${response.status()}`);
  }

  for (const check of checks) {
    if (typeof check === "string") {
      await page.getByText(check, { exact: false }).first().waitFor({ state: "visible", timeout: 15000 });
    } else if (check.role) {
      await page.getByRole(check.role, { name: check.name }).first().waitFor({ state: "visible", timeout: 15000 });
    }
  }
}

async function loginAdmin(page) {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle" });
  await page.getByText("Admin Sign In").waitFor({ state: "visible", timeout: 15000 });
  await page.locator("input[type='email']").fill(QA_EMAIL);
  await page.locator("input[type='password']").fill(QA_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForTimeout(5000);

  const cookies = await page.context().cookies();
  const hasAuthCookie = cookies.some((cookie) =>
    cookie.name.includes("sb-") && cookie.name.includes("auth-token")
  );

  return {
    url: page.url(),
    hasAuthCookie,
  };
}

async function clickRequestSubmit(page) {
  await page.locator(".request-form button[type='submit']").click();
}

async function openRequestPage(page) {
  await page.goto(`${BASE_URL}/request`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
}

async function run() {
  const publicInquiryEmail = `qa+${Date.now()}@elelevents.local`;
  const publicInquiryName = "QA Browser";

  const sampleInquiry = await getSample("event_inquiries", "id");
  const sampleContract = await getSample("contracts", "id");
  const sampleDocument = await getSample("client_documents", "id");
  const sampleRental = await getSample("rental_items", "id, slug");
  const sampleRentalRequest = await getSample("rental_quote_requests", "id");
  const sampleGallery = await getSample("gallery_items", "id");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  const flushPublicLogs = await attachPageObservers(page, "public flow");

  try {
    await withStep("Homepage loads", async () => {
      await smokeRoute(page, "/", ["Check Availability"]);
      return "Homepage rendered and main CTA visible.";
    });

    const publicRouteChecks = [
      { route: "/about", checks: [] },
      { route: "/services", checks: [] },
      { route: "/gallery", checks: [] },
      { route: "/contact", checks: [] },
      { route: "/packages", checks: [] },
      { route: "/rentals", checks: [] },
      { route: "/vendors", checks: [] },
      { route: "/request", checks: ["Start with the essentials."] },
    ];

    for (const item of publicRouteChecks) {
      await withStep(`Smoke ${item.route}`, async () => {
        await smokeRoute(page, item.route, item.checks);
        return `${item.route} loaded successfully.`;
      }, { fatal: false });
    }

    if (sampleGallery?.id) {
      await withStep("Smoke /gallery/[id]", async () => {
        await smokeRoute(page, `/gallery/${sampleGallery.id}`);
        return `Gallery detail ${sampleGallery.id} loaded.`;
      }, { fatal: false });
    }

    if (sampleRental?.slug) {
      await withStep("Smoke /rentals/[slug]", async () => {
        await smokeRoute(page, `/rentals/${sampleRental.slug}`);
        return `Rental detail ${sampleRental.slug} loaded.`;
      }, { fatal: false });
    }

    await withStep("Request form validates single-name submission", async () => {
      await openRequestPage(page);
      await page.getByLabel("Full Name").fill("QA");
      await page.getByLabel("Phone Number").fill("4045551212");
      await page.getByLabel("Email Address").fill(publicInquiryEmail);
      await page.getByLabel("Tell us about your event vision").fill("Testing validation handling.");
      await clickRequestSubmit(page);
      await page.getByText("Please enter your full name.").waitFor({ state: "visible", timeout: 10000 });
      return "Single-name validation message appeared.";
    }, { fatal: false });

    let followUpUrl = "";

    await withStep("Public inquiry submits successfully", async () => {
      await openRequestPage(page);
      await page.getByLabel("Full Name").fill(publicInquiryName);
      await page.getByLabel("Phone Number").fill("4045551212");
      await page.getByLabel("Email Address").fill(publicInquiryEmail);
      await page.getByLabel("Event Type").selectOption("Wedding");
      await page.getByLabel("Event Date").fill("2026-08-15");
      await page.getByLabel("Estimated Guest Count").selectOption("100-150");
      await page.getByLabel("Tell us about your event vision").fill("QA browser run for end-to-end inquiry validation.");
      await page.getByLabel("Budget Range").selectOption("$5,000–$8,000");
      await clickRequestSubmit(page);
      await page.waitForURL(/\/request\/follow-up\?/);
      followUpUrl = page.url();
      return `Redirected to follow-up page: ${followUpUrl}`;
    });

    await withStep("Follow-up inspiration submission succeeds", async () => {
      await page.getByLabel("Upload images").setInputFiles(UPLOAD_FILE);
      await page.getByLabel("Paste links").fill("https://www.pinterest.com/example-board\nhttps://www.instagram.com/example-post");
      await page.getByRole("button", { name: "Modern" }).click();
      await page.getByRole("button", { name: "Save Inspiration" }).click();
      await page.getByText("Thank you. We have your inspiration details.").waitFor({ state: "visible", timeout: 15000 });
      return "Follow-up saved confirmation appeared.";
    });

    const createdInquiry = await withStep("Supabase inquiry record exists", async () => {
      const inquiry = await getInquiryByEmail(publicInquiryEmail);
      if (!inquiry?.id) {
        throw new Error(`No inquiry found for ${publicInquiryEmail}`);
      }
      if (!inquiry.follow_up_details_json) {
        throw new Error("follow_up_details_json was not saved.");
      }
      return inquiry;
    });

    flushPublicLogs();

    const adminPage = await context.newPage();
    const flushAdminLogs = await attachPageObservers(adminPage, "admin flow");

    const loginResult = await withStep("Admin login form redirects into app", async () => {
      const result = await loginAdmin(adminPage);
      if (!result.hasAuthCookie) {
        throw new Error("Supabase auth cookie was not set after sign-in.");
      }
      if (result.url.includes("/admin/login")) {
        throw new Error("Session cookie was set, but the UI remained on /admin/login instead of redirecting into admin.");
      }
      return `Redirected to ${result.url}`;
    }, { fatal: false });

    await withStep("Admin session can open inquiries workspace", async () => {
      if (!loginResult) {
        await adminPage.goto(`${BASE_URL}/admin/inquiries?tab=inquiries`, { waitUntil: "networkidle" });
      } else {
        await adminPage.goto(`${BASE_URL}/admin/inquiries?tab=inquiries`, { waitUntil: "networkidle" });
      }
      await adminPage.getByText("Inquiry Records").first().waitFor({ state: "visible", timeout: 15000 });
      return "Authenticated session reached inquiries workspace.";
    });

    const adminRouteChecks = [
      { route: "/admin/inquiries?tab=overview", checks: ["Work requests through one shared sequence"] },
      { route: "/admin/inquiries?tab=inquiries", checks: ["Inquiry Records"] },
      { route: "/admin/crm-analytics?tab=leads", checks: [] },
      { route: "/admin/documents", checks: ["Documents"] },
      { route: "/admin/contracts", checks: ["Contracts"] },
      { route: "/admin/finance", checks: ["Finance"] },
      { route: "/admin/calendar", checks: [] },
      { route: "/admin/rentals", checks: [] },
      { route: "/admin/settings", checks: [] },
    ];

    for (const item of adminRouteChecks) {
      await withStep(`Smoke ${item.route}`, async () => {
        await smokeRoute(adminPage, item.route, item.checks);
        return `${item.route} loaded successfully.`;
      }, { fatal: false });
    }

    await withStep("Inquiry search finds submitted record", async () => {
      await adminPage.goto(`${BASE_URL}/admin/inquiries?tab=inquiries`, { waitUntil: "domcontentloaded" });
      await adminPage.getByPlaceholder("Client, email, phone, or venue").fill(publicInquiryEmail);
      await adminPage.getByRole("button", { name: "Apply" }).click();
      await adminPage.getByText(publicInquiryEmail).waitFor({ state: "visible", timeout: 15000 });
      return `Found inquiry row for ${publicInquiryEmail}.`;
    });

    await withStep("Inquiry row Actions dropdown renders full menu", async () => {
      const row = adminPage.locator("tbody tr").filter({ hasText: publicInquiryEmail }).first();
      await row.getByRole("button", { name: "Actions" }).click();
      const portal = adminPage.locator(".admin-row-action-dropdown--portal").first();
      await portal.waitFor({ state: "visible", timeout: 10000 });
      await portal.getByText(/Recommended/i).waitFor({ state: "visible", timeout: 10000 });
      await portal.getByText("View details").waitFor({ state: "visible", timeout: 10000 });
      await portal.getByText("Open workflow").waitFor({ state: "visible", timeout: 10000 });
      return "Actions menu displayed recommended and record actions.";
    });

    await withStep("Inquiry detail shows post-submission inspiration", async () => {
      await adminPage.locator(".admin-row-action-dropdown--portal").first().getByText("View details").click();
      await adminPage.waitForURL(new RegExp(`/admin/inquiries/${createdInquiry.id}`));
      await adminPage.getByText("Post-submission inspiration").waitFor({ state: "visible", timeout: 15000 });
      await adminPage.getByText("Modern").waitFor({ state: "visible", timeout: 10000 });
      return `Inquiry detail ${createdInquiry.id} rendered follow-up inspiration.`;
    });

    if (sampleDocument?.id) {
      await withStep("Documents Actions dropdown renders full menu", async () => {
        await adminPage.goto(`${BASE_URL}/admin/documents`, { waitUntil: "domcontentloaded" });
        await adminPage.locator("tbody tr").first().getByRole("button", { name: "Actions" }).click();
        await adminPage.getByText("Open PDF").waitFor({ state: "visible", timeout: 10000 });
        await adminPage.getByText("Download PDF").waitFor({ state: "visible", timeout: 10000 });
        return "Documents action menu displayed output actions.";
      });

      await withStep("Smoke /admin/documents/[id]", async () => {
        await smokeRoute(adminPage, `/admin/documents/${sampleDocument.id}`);
        return `Document detail ${sampleDocument.id} loaded.`;
      }, { fatal: false });

      await withStep("Smoke /admin/document-output/[id]", async () => {
        await smokeRoute(adminPage, `/admin/document-output/${sampleDocument.id}`);
        return `Document output ${sampleDocument.id} loaded.`;
      }, { fatal: false });
    }

    if (sampleInquiry?.id) {
      await withStep("Smoke /admin/inquiries/[id]", async () => {
        await smokeRoute(adminPage, `/admin/inquiries/${sampleInquiry.id}`);
        return `Inquiry detail ${sampleInquiry.id} loaded.`;
      }, { fatal: false });

      await withStep("Smoke /admin/inquiries/[id]/itemized-draft", async () => {
        await smokeRoute(adminPage, `/admin/inquiries/${sampleInquiry.id}/itemized-draft`);
        return `Inquiry itemized draft ${sampleInquiry.id} loaded.`;
      }, { fatal: false });

      await withStep("Smoke /admin/crm-analytics/[leadId]", async () => {
        await smokeRoute(adminPage, `/admin/crm-analytics/${sampleInquiry.id}`);
        return `CRM lead detail ${sampleInquiry.id} loaded.`;
      }, { fatal: false });
    }

    if (sampleContract?.id) {
      await withStep("Smoke /admin/contracts/[id]", async () => {
        await smokeRoute(adminPage, `/admin/contracts/${sampleContract.id}`);
        return `Contract detail ${sampleContract.id} loaded.`;
      }, { fatal: false });
    }

    if (sampleRental?.id) {
      await withStep("Smoke /admin/rentals/[id]", async () => {
        await smokeRoute(adminPage, `/admin/rentals/${sampleRental.id}`);
        return `Rental detail ${sampleRental.id} loaded.`;
      }, { fatal: false });
    }

    if (sampleRentalRequest?.id) {
      await withStep("Smoke /admin/rentals/requests/[id]", async () => {
        await smokeRoute(adminPage, `/admin/rentals/requests/${sampleRentalRequest.id}`);
        return `Rental request detail ${sampleRentalRequest.id} loaded.`;
      }, { fatal: false });
    }

    flushAdminLogs();
  } finally {
    await context.close();
    await browser.close();
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  }
}

run().catch((error) => {
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  console.error(error);
  process.exit(1);
});
