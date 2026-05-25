const { createClient } = require("@supabase/supabase-js");
const { createServerClient } = require("@supabase/ssr");

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3001";
const QA_EMAIL = process.env.QA_ADMIN_EMAIL || "qa-admin@elelevents.local";
const QA_PASSWORD = process.env.QA_ADMIN_PASSWORD || "QA-Admin-2026!";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAdminCookieHeader() {
  const cookies = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookies;
        },
        setAll(nextCookies) {
          for (const cookie of nextCookies) {
            const index = cookies.findIndex((item) => item.name === cookie.name);
            if (index >= 0) cookies[index] = cookie;
            else cookies.push(cookie);
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: QA_EMAIL,
    password: QA_PASSWORD,
  });

  if (error || !data.user) {
    throw new Error(`Admin sign-in failed: ${error?.message || "No user"}`);
  }

  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

async function run() {
  const cookieHeader = await getAdminCookieHeader();
  const pageResponse = await fetch(`${BASE_URL}/admin/documents/new?type=invoice&mode=manual`, {
    headers: { cookie: cookieHeader },
  });
  const pageBody = await pageResponse.text();

  if (!pageResponse.ok) {
    throw new Error(`Manual invoice page failed: ${pageResponse.status}`);
  }

  for (const label of ["Create in-person invoice", "Use this for walk-in"]) {
    if (!pageBody.includes(label)) {
      throw new Error(`Manual invoice page missing expected label: ${label}`);
    }
  }

  const documentNumber = `INV-QA-${Date.now()}`;
  const createResponse = await fetch(`${BASE_URL}/api/admin/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify({
      document_type: "invoice",
      document_number: documentNumber,
      status: "unpaid",
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date().toISOString().slice(0, 10),
      customer_name: "Walk-in QA customer",
      customer_email: null,
      customer_phone: null,
      event_type: "Completed decor work",
      notes: "QA manual no-email invoice.",
      payment_instructions: "Collect in person and record payment in admin.",
      payment_terms: "Due on receipt.",
      setup_fee: 125,
      line_items: [],
    }),
  });
  const payload = await createResponse.json();

  if (!createResponse.ok || !payload.document?.id) {
    throw new Error(`Manual invoice create failed: ${JSON.stringify(payload)}`);
  }

  const documentId = payload.document.id;
  try {
    const { data: document, error } = await supabaseAdmin
      .from("client_documents")
      .select("id, document_type, status, customer_name, customer_email, total_amount, balance_due")
      .eq("id", documentId)
      .single();

    if (error || !document) {
      throw new Error(`Could not verify created manual invoice: ${error?.message || "missing"}`);
    }

    if (
      document.document_type !== "invoice" ||
      document.status !== "unpaid" ||
      document.customer_email !== null ||
      Number(document.total_amount) !== 125 ||
      Number(document.balance_due) !== 125
    ) {
      throw new Error(`Manual invoice values incorrect: ${JSON.stringify(document)}`);
    }

    console.log(
      JSON.stringify(
        {
          result: "PASS",
          document_id: documentId,
          document_number: documentNumber,
          customer_email: document.customer_email,
          total_amount: document.total_amount,
        },
        null,
        2
      )
    );
  } finally {
    await supabaseAdmin.from("client_document_line_items").delete().eq("document_id", documentId);
    await supabaseAdmin.from("activity_log").delete().eq("entity_type", "document").eq("entity_id", documentId);
    await supabaseAdmin.from("client_documents").delete().eq("id", documentId);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
