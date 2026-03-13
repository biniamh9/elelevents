type DecorLineItem = {
  name: string;
  details: string;
};

export type ContractDetails = {
  agreement_date: string | null;
  event_coverage: {
    includes_reception: boolean;
    includes_melsi: boolean;
    reception_date: string | null;
    melsi_date: string | null;
    venue_name: string | null;
    venue_address: string | null;
    coverage_notes: string | null;
  };
  logistics: {
    setup_window_hours: number | null;
    teardown_window_hours: number | null;
    early_access_requested: boolean;
    venue_access_notes: string | null;
  };
  counts: {
    guest_count: number | null;
    bridal_party_count: number | null;
  };
  decor_items: DecorLineItem[];
  materials_and_colors: string | null;
  payment_record: {
    deposit_received_amount: number | null;
    deposit_received_date: string | null;
    payment_method: string | null;
    payment_method_details: string | null;
    remaining_balance_amount: number | null;
    remaining_balance_due_date: string | null;
  };
  custom_clauses: string | null;
};

type ContractSeed = {
  client_name?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  guest_count?: number | null;
  contract_total?: number | null;
  deposit_amount?: number | null;
  balance_due?: number | null;
  balance_due_date?: string | null;
  deposit_paid?: boolean | null;
  deposit_paid_at?: string | null;
  created_at?: string | null;
  scope_json?: {
    services?: string[];
    colors_theme?: string | null;
  } | null;
};

const COMMON_DECOR_ITEMS = [
  "Head table",
  "Backdrop",
  "Bride and groom table",
  "Guest tables",
  "Chairs",
  "Tablecloths",
  "Napkins",
  "Plate chargers",
  "Entrance decor",
  "Buffet table",
  "Ceiling drape",
];

function toDateInput(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.includes("T") ? value.split("T")[0] : value;
}

function toNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function inferCoverage(eventType?: string | null) {
  const label = (eventType ?? "").toLowerCase();

  return {
    includes_reception:
      label.includes("reception") ||
      label.includes("wedding") ||
      (!label.includes("melsi") && !label.includes("traditional")),
    includes_melsi: label.includes("melsi") || label.includes("traditional"),
  };
}

function normalizeDecorItems(
  value: unknown,
  fallbackServices: string[] = []
): DecorLineItem[] {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const record = item as Record<string, unknown>;

        return {
          name: typeof record.name === "string" ? record.name.trim() : "",
          details:
            typeof record.details === "string" ? record.details.trim() : "",
        };
      })
      .filter((item): item is DecorLineItem => Boolean(item?.name));

    if (normalized.length > 0) {
      return normalized;
    }
  }

  const seen = new Set<string>();
  const seeded = [...fallbackServices, ...COMMON_DECOR_ITEMS].filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return seeded.map((name) => ({ name, details: "" }));
}

function escapeHtml(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "________________";
  }

  return new Date(value).toLocaleDateString();
}

export function buildContractDetailsFromInquiry(inquiry: Record<string, any>) {
  const total = toNullableNumber(inquiry.estimated_price) ?? 0;
  const deposit = total > 0 ? total / 2 : 0;
  const eventDate = toDateInput(inquiry.event_date);
  const coverage = inferCoverage(inquiry.event_type);
  const services = Array.isArray(inquiry.services) ? inquiry.services : [];

  return normalizeContractDetails(
    {
      agreement_date: new Date().toISOString().split("T")[0],
      event_coverage: {
        includes_reception: coverage.includes_reception,
        includes_melsi: coverage.includes_melsi,
        reception_date: coverage.includes_reception ? eventDate : null,
        melsi_date: coverage.includes_melsi ? eventDate : null,
        venue_name: inquiry.venue_name ?? null,
        venue_address: inquiry.venue_address ?? null,
      },
      counts: {
        guest_count: inquiry.guest_count ?? null,
      },
      decor_items: normalizeDecorItems(null, services),
      materials_and_colors: inquiry.colors_theme ?? null,
      payment_record: {
        remaining_balance_amount: total - deposit,
      },
    },
    {
      event_type: inquiry.event_type,
      event_date: inquiry.event_date,
      venue_name: inquiry.venue_name,
      venue_address: inquiry.venue_address,
      guest_count: inquiry.guest_count,
      contract_total: total,
      deposit_amount: deposit,
      balance_due: total - deposit,
      scope_json: {
        services,
        colors_theme: inquiry.colors_theme,
      },
    }
  );
}

export function normalizeContractDetails(
  value: unknown,
  contract: ContractSeed = {}
): ContractDetails {
  const record =
    value && typeof value === "object" ? (value as Record<string, any>) : {};
  const scope = contract.scope_json ?? {};
  const services = Array.isArray(scope.services) ? scope.services : [];
  const coverage = inferCoverage(contract.event_type);
  const eventCoverage =
    record.event_coverage && typeof record.event_coverage === "object"
      ? (record.event_coverage as Record<string, unknown>)
      : {};
  const logistics =
    record.logistics && typeof record.logistics === "object"
      ? (record.logistics as Record<string, unknown>)
      : {};
  const counts =
    record.counts && typeof record.counts === "object"
      ? (record.counts as Record<string, unknown>)
      : {};
  const paymentRecord =
    record.payment_record && typeof record.payment_record === "object"
      ? (record.payment_record as Record<string, unknown>)
      : {};

  return {
    agreement_date:
      toDateInput(toNullableString(record.agreement_date)) ??
      toDateInput(contract.created_at) ??
      new Date().toISOString().split("T")[0],
    event_coverage: {
      includes_reception: toBoolean(
        eventCoverage.includes_reception,
        coverage.includes_reception
      ),
      includes_melsi: toBoolean(
        eventCoverage.includes_melsi,
        coverage.includes_melsi
      ),
      reception_date:
        toDateInput(toNullableString(eventCoverage.reception_date)) ??
        (coverage.includes_reception ? toDateInput(contract.event_date) : null),
      melsi_date:
        toDateInput(toNullableString(eventCoverage.melsi_date)) ??
        (coverage.includes_melsi ? toDateInput(contract.event_date) : null),
      venue_name:
        toNullableString(eventCoverage.venue_name) ??
        toNullableString(contract.venue_name),
      venue_address:
        toNullableString(eventCoverage.venue_address) ??
        toNullableString(contract.venue_address),
      coverage_notes: toNullableString(eventCoverage.coverage_notes),
    },
    logistics: {
      setup_window_hours: toNullableNumber(logistics.setup_window_hours) ?? 8,
      teardown_window_hours: toNullableNumber(logistics.teardown_window_hours) ?? 2,
      early_access_requested: toBoolean(logistics.early_access_requested, false),
      venue_access_notes: toNullableString(logistics.venue_access_notes),
    },
    counts: {
      guest_count:
        toNullableNumber(counts.guest_count) ??
        toNullableNumber(contract.guest_count),
      bridal_party_count: toNullableNumber(counts.bridal_party_count),
    },
    decor_items: normalizeDecorItems(record.decor_items, services),
    materials_and_colors:
      toNullableString(record.materials_and_colors) ??
      toNullableString(scope.colors_theme),
    payment_record: {
      deposit_received_amount:
        toNullableNumber(paymentRecord.deposit_received_amount) ??
        (contract.deposit_paid ? toNullableNumber(contract.deposit_amount) : null),
      deposit_received_date:
        toDateInput(toNullableString(paymentRecord.deposit_received_date)) ??
        (contract.deposit_paid ? toDateInput(contract.deposit_paid_at) : null),
      payment_method: toNullableString(paymentRecord.payment_method),
      payment_method_details: toNullableString(paymentRecord.payment_method_details),
      remaining_balance_amount:
        toNullableNumber(paymentRecord.remaining_balance_amount) ??
        toNullableNumber(contract.balance_due),
      remaining_balance_due_date:
        toDateInput(toNullableString(paymentRecord.remaining_balance_due_date)) ??
        toDateInput(contract.balance_due_date),
    },
    custom_clauses: toNullableString(record.custom_clauses),
  };
}

export function renderContractHtml(
  contract: Record<string, any>,
  details: ContractDetails
) {
  const coverageLabel =
    details.event_coverage.includes_reception && details.event_coverage.includes_melsi
      ? "Reception and Melsi"
      : details.event_coverage.includes_melsi
        ? "Melsi"
        : "Reception";

  const decorRows = details.decor_items
    .map(
      (item) => `
        <div class="decor-row">
          <strong>${escapeHtml(item.name)}</strong>
          <p>${escapeHtml(item.details || "To be finalized after the consultation.")}</p>
        </div>
      `
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Decorating Session Agreement</title>
    <style>
      body { font-family: Georgia, "Times New Roman", serif; color: #21151a; padding: 36px; line-height: 1.6; }
      h1 { margin: 0 0 12px; font-size: 28px; }
      h2 { margin: 24px 0 8px; font-size: 18px; }
      p { margin: 8px 0; }
      .muted { color: #6b5a61; }
      .box { border: 1px solid #d8c1ca; border-radius: 12px; padding: 14px 16px; margin: 12px 0; }
      .decor-row { border: 1px solid #e7d4db; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
      .decor-row p { margin: 6px 0 0; }
      .signature-block { margin-top: 24px; }
      .signature-line { margin: 20px 0; }
    </style>
  </head>
  <body>
    <p><strong>Date:</strong> ${formatDate(details.agreement_date)}</p>
    <h1>Decorating Session Agreement</h1>
    <p>
      This signed agreement represents an order for decorating and event planning
      services between <strong>${escapeHtml(contract.client_name)}</strong> (the "Client")
      and <strong>Elel Event and Design</strong> (the "Decorator").
    </p>

    <h2>1. Decorating Session Order</h2>
    <p>
      This contract formalizes the Client's request for decorating services and
      supersedes any oral agreements.
    </p>

    <h2>2. Decorating Fees</h2>
    <p>
      The decorating fees are based on anticipated guest count, requested services,
      and materials required. The current contract total is
      <strong>$${formatMoney(contract.contract_total)}</strong>.
    </p>

    <h2>3. Decorating Arrangements</h2>
    <p>
      The Client is responsible for venue coordination, required tables and chairs,
      and a minimum setup window of
      <strong>${details.logistics.setup_window_hours ?? 8} hours</strong>.
      A minimum teardown window of
      <strong>${details.logistics.teardown_window_hours ?? 2} hours</strong>
      is required.
    </p>
    <p>
      <strong>Venue:</strong> ${escapeHtml(details.event_coverage.venue_name ?? "________________")}
      ${details.event_coverage.venue_address ? `, ${escapeHtml(details.event_coverage.venue_address)}` : ""}
    </p>
    <p>
      <strong>Venue access notes:</strong>
      ${escapeHtml(details.logistics.venue_access_notes ?? "Tables must be bussed and cleared before teardown begins.")}
    </p>

    <h2>4. Damage to Property</h2>
    <p>
      Once setup is complete, all decorator-provided items remain under the Client's
      liability. Missing or damaged items may be charged at replacement cost.
    </p>

    <h2>5. Limit of Liability</h2>
    <p>
      The Decorator is not liable for losses caused by events beyond reasonable
      control, and liability will not exceed the total contract price.
    </p>

    <h2>6. Ownership of Decorations</h2>
    <p>
      Decorator inventory remains the property of Elel Event and Design. Rented
      items are expected back by noon the following day unless another arrangement
      is documented.
    </p>

    <h2>7. Reservation Deposit and Payment Schedule</h2>
    <p>
      A 50% deposit of <strong>$${formatMoney(contract.deposit_amount)}</strong> is due
      upon signing. The remaining balance of
      <strong>$${formatMoney(details.payment_record.remaining_balance_amount ?? contract.balance_due)}</strong>
      is due by <strong>${formatDate(contract.balance_due_date)}</strong>.
    </p>
    <p>
      <strong>Deposit received:</strong>
      $${formatMoney(details.payment_record.deposit_received_amount)} on
      ${formatDate(details.payment_record.deposit_received_date)}
    </p>
    <p>
      <strong>Payment method:</strong>
      ${escapeHtml(details.payment_record.payment_method ?? "________________")}
      ${details.payment_record.payment_method_details ? `(${escapeHtml(details.payment_record.payment_method_details)})` : ""}
    </p>

    <h2>8. Materials and Colors</h2>
    <p>${escapeHtml(details.materials_and_colors ?? "To be finalized after the consultation.")}</p>

    <div class="box">
      <p><strong>Event coverage:</strong> ${coverageLabel}</p>
      <p><strong>Reception date:</strong> ${formatDate(details.event_coverage.reception_date)}</p>
      <p><strong>Melsi date:</strong> ${formatDate(details.event_coverage.melsi_date)}</p>
      <p><strong>Number of guests:</strong> ${details.counts.guest_count ?? contract.guest_count ?? "________________"}</p>
      <p><strong>Bridal party:</strong> ${details.counts.bridal_party_count ?? "________________"}</p>
      <p><strong>Coverage notes:</strong> ${escapeHtml(details.event_coverage.coverage_notes ?? "________________")}</p>
    </div>

    <h2>Decoration Details</h2>
    ${decorRows}

    ${
      details.custom_clauses
        ? `<h2>Custom Clauses</h2><p>${escapeHtml(details.custom_clauses)}</p>`
        : ""
    }

    <div class="signature-block">
      <div class="signature-line">
        <p>Customer Signature: [[CLIENT_SIGN_1]]</p>
        <p>Date: [[CLIENT_DATE_1]]</p>
      </div>
      <div class="signature-line">
        <p>Customer Signature: [[CLIENT_SIGN_2]]</p>
        <p>Date: [[CLIENT_DATE_2]]</p>
      </div>
      <div class="signature-line">
        <p>Elel Event and Design Representative: ____________________________</p>
        <p>Date: ____________________________</p>
      </div>
    </div>
  </body>
</html>`;
}
