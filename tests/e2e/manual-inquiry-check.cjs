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
    timeout: 20000,
  });
}

async function cleanup(inquiryId, email) {
  if (inquiryId) {
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
    await supabase.from("event_inquiries").delete().eq("id", inquiryId);
  }

  if (email) {
    await supabase.from("clients").delete().eq("email", email);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const email = `qa-manual-${Date.now()}@elelevents.local`;
  let inquiryId = null;

  try {
    await login(page);

    const response = await page.request.post(`${BASE_URL}/api/admin/inquiries`, {
      data: {
        firstName: "QA Manual",
        lastName: "Inquiry",
        email,
        phone: "4028020464",
        eventType: "Wedding",
        eventDate: "2026-06-06",
        guestCount: 250,
        services: [],
        budgetRange: "Not provided",
        consultationPreference: "Admin entered",
        inspirationNotes: "Manual form payload regression check.",
        additionalInfo: "Manual admin intake.\nGuest count: 250",
        referralSource: "manual_admin_entry",
        preferredContactMethod: "phone",
        needsDeliverySetup: false,
      },
    });

    const body = await response.json();
    if (!response.ok() || !body?.inquiry?.id) {
      throw new Error(`Manual inquiry create failed: ${response.status()} ${JSON.stringify(body)}`);
    }

    inquiryId = body.inquiry.id;
    const { data, error } = await supabase
      .from("event_inquiries")
      .select("id, email, guest_count, referral_source")
      .eq("id", inquiryId)
      .single();

    if (error || !data) {
      throw new Error(`Created inquiry lookup failed: ${error?.message || "missing row"}`);
    }

    if (data.email !== email || data.guest_count !== 250 || data.referral_source !== "manual_admin_entry") {
      throw new Error(`Created inquiry fields were not persisted correctly: ${JSON.stringify(data)}`);
    }

    console.log(JSON.stringify({ result: "PASS", inquiryId }, null, 2));
  } finally {
    await cleanup(inquiryId, email);
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
