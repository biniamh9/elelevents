const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const QA_EMAIL = "qa-admin@elelevents.local";
const QA_PASSWORD = "QA-Admin-2026!";
const RESULTS_PATH = path.join(process.cwd(), "tests/e2e/contract-deposit-flow-results.json");

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

async function createTempInquiryAndContract() {
  const stamp = Date.now();
  const email = `qa-deposit-${stamp}@elelevents.local`;
  const clientName = `QA Deposit ${stamp}`;

  const { data: inquiry, error: inquiryError } = await supabase
    .from("event_inquiries")
    .insert({
      first_name: "QA",
      last_name: `Deposit ${stamp}`,
      email,
      phone: "4045557788",
      event_type: "Wedding",
      event_date: "2026-11-20",
      guest_count: 180,
      status: "quoted",
      estimated_price: 4800,
      consultation_status: "completed",
      quote_response_status: "awaiting_response",
      booking_stage: "contract_sent",
    })
    .select("id")
    .single();

  if (inquiryError || !inquiry) {
    throw new Error(`Temp inquiry creation failed: ${inquiryError?.message || "unknown"}`);
  }

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      inquiry_id: inquiry.id,
      client_name: clientName,
      client_email: email,
      client_phone: "4045557788",
      event_type: "Wedding",
      event_date: "2026-11-20",
      venue_name: "QA Ballroom",
      guest_count: 180,
      contract_total: 4800,
      deposit_amount: 1800,
      balance_due: 3000,
      balance_due_date: "2026-11-01",
      contract_status: "signed",
      deposit_paid: false,
    })
    .select("id, client_name")
    .single();

  if (contractError || !contract) {
    throw new Error(`Temp contract creation failed: ${contractError?.message || "unknown"}`);
  }

  const { error: paymentError } = await supabase
    .from("contract_payments")
    .insert({
      contract_id: contract.id,
      payment_kind: "deposit",
      amount: 1800,
      due_date: new Date().toISOString().split("T")[0],
      status: "pending",
    });

  if (paymentError) {
    throw new Error(`Temp deposit payment creation failed: ${paymentError.message}`);
  }

  return { inquiryId: inquiry.id, contractId: contract.id, clientName };
}

async function waitForDepositState(contractId, expectedPaid, expectedPaymentStatus, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("deposit_paid, deposit_paid_at")
      .eq("id", contractId)
      .maybeSingle();

    const { data: payment, error: paymentError } = await supabase
      .from("contract_payments")
      .select("status, paid_at")
      .eq("contract_id", contractId)
      .eq("payment_kind", "deposit")
      .maybeSingle();

    if (contractError) {
      throw new Error(`Contract state lookup failed: ${contractError.message}`);
    }
    if (paymentError) {
      throw new Error(`Deposit payment lookup failed: ${paymentError.message}`);
    }

    if (
      contract?.deposit_paid === expectedPaid &&
      payment?.status === expectedPaymentStatus
    ) {
      return { contract, payment };
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Deposit state did not reach paid=${expectedPaid} payment=${expectedPaymentStatus}.`);
}

async function cleanup(contractId, inquiryId) {
  await supabase.from("contract_payments").delete().eq("contract_id", contractId);
  await supabase.from("contracts").delete().eq("id", contractId);
  await supabase.from("event_inquiries").delete().eq("id", inquiryId);
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

  const temp = await createTempInquiryAndContract();

  try {
    await record("Admin login", async () => {
      await login(page);
      return page.url();
    });

    await record("Finance can record deposit", async () => {
      await page.goto(`${BASE_URL}/admin/finance?tab=income`, { waitUntil: "networkidle" });
      const row = page.locator("tr").filter({ hasText: temp.clientName }).first();
      await row.waitFor({ state: "visible", timeout: 15000 });
      await row.getByRole("button", { name: "Record Deposit" }).click();
      await waitForDepositState(temp.contractId, true, "paid");
      await page.getByText("Deposit recorded.").last().waitFor({ timeout: 10000 });
      return "Finance action marked deposit paid.";
    });

    await record("Contract detail reflects paid deposit", async () => {
      await page.goto(`${BASE_URL}/admin/contracts/${temp.contractId}`, {
        waitUntil: "networkidle",
      });
      await page.getByText("Deposit recorded.").waitFor({ timeout: 10000 }).catch(() => null);
      await page.getByText("Paid").first().waitFor();
      await page.getByRole("button", { name: "Reopen Deposit" }).waitFor();
      return "Contract detail shows paid deposit state.";
    });

    await record("Contract detail can reopen deposit", async () => {
      await page.getByRole("button", { name: "Reopen Deposit" }).click();
      await waitForDepositState(temp.contractId, false, "pending");
      await page.getByText("Deposit reopened.").waitFor({ timeout: 10000 });
      return "Contract action reopened deposit.";
    });

    await record("Contract detail can record deposit again", async () => {
      await page.getByRole("button", { name: "Record Deposit" }).click();
      await waitForDepositState(temp.contractId, true, "paid");
      await page.getByText("Deposit recorded.").waitFor({ timeout: 10000 });
      return "Contract action recorded deposit again.";
    });

    const browserLogResult =
      consoleErrors.length || pageErrors.length || requestFailures.length ? "FAIL" : "PASS";
    push(
      "Browser console/network",
      browserLogResult,
      JSON.stringify({ consoleErrors, pageErrors, requestFailures }, null, 2)
    );
  } finally {
    await cleanup(temp.contractId, temp.inquiryId);
    await browser.close();
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  }
}

run().catch((error) => {
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  console.error(error);
  process.exit(1);
});
