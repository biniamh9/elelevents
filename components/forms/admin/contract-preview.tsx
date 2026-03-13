import type { ContractDetails } from "@/lib/contracts";

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

export default function ContractPreview({
  contract,
  details,
}: {
  contract: any;
  details: ContractDetails;
}) {
  const coverageLabel =
    details.event_coverage.includes_reception && details.event_coverage.includes_melsi
      ? "Reception and Melsi"
      : details.event_coverage.includes_melsi
        ? "Melsi"
        : "Reception";

  return (
    <section className="card contract-agreement-preview">
      <p className="eyebrow">Preview Before Sending</p>
      <h3>Decorating Session Agreement</h3>

      <div className="contract-preview-copy">
        <p>
          <strong>Date:</strong> {formatDate(details.agreement_date)}
        </p>
        <p>
          This signed agreement represents an order for decorating and event
          planning services between <strong>{contract.client_name}</strong> and
          <strong> Elel Event and Design</strong>.
        </p>

        <h4>1. Decorating Session Order</h4>
        <p>
          This contract formalizes the Client&apos;s request for decorating
          services and supersedes oral agreements.
        </p>

        <h4>2. Decorating Fees</h4>
        <p>
          The decorating fee is based on guest count, services requested, and
          required materials. Current contract total:{" "}
          <strong>${formatMoney(contract.contract_total)}</strong>.
        </p>

        <h4>3. Decorating Arrangements</h4>
        <p>
          The client is responsible for venue coordination, required tables and
          chairs, and a minimum setup window of{" "}
          <strong>{details.logistics.setup_window_hours ?? 8} hours</strong>.
          A minimum teardown window of{" "}
          <strong>{details.logistics.teardown_window_hours ?? 2} hours</strong>{" "}
          is required.
        </p>
        <p>
          <strong>Venue:</strong> {details.event_coverage.venue_name ?? "________________"}
          {details.event_coverage.venue_address
            ? `, ${details.event_coverage.venue_address}`
            : ""}
        </p>
        <p>
          <strong>Access notes:</strong>{" "}
          {details.logistics.venue_access_notes ??
            "Tables must be bussed and cleared before teardown begins."}
        </p>

        <h4>4. Damage to Property</h4>
        <p>
          Once setup is complete, decor items remain under the client&apos;s
          responsibility. Missing or damaged items may be charged at replacement
          cost.
        </p>

        <h4>5. Limit of Liability</h4>
        <p>
          Liability does not exceed the total contract price and may be reduced
          by circumstances outside the decorator&apos;s control.
        </p>

        <h4>6. Ownership of Decorations</h4>
        <p>
          Decorator inventory remains the property of Elel Event and Design.
          Rented items are expected back by noon the following day unless another
          arrangement is documented.
        </p>

        <h4>7. Reservation Deposit and Payment Schedule</h4>
        <p>
          A 50% deposit of{" "}
          <strong>${formatMoney(contract.deposit_amount)}</strong> is due upon
          signing. The remaining balance of{" "}
          <strong>
            $
            {formatMoney(
              details.payment_record.remaining_balance_amount ?? contract.balance_due
            )}
          </strong>{" "}
          is due by <strong>{formatDate(contract.balance_due_date)}</strong>.
        </p>
        <p>
          <strong>Deposit received:</strong> $
          {formatMoney(details.payment_record.deposit_received_amount)} on{" "}
          {formatDate(details.payment_record.deposit_received_date)}
        </p>
        <p>
          <strong>Payment method:</strong>{" "}
          {details.payment_record.payment_method ?? "________________"}
          {details.payment_record.payment_method_details
            ? ` (${details.payment_record.payment_method_details})`
            : ""}
        </p>

        <h4>8. Materials and Colors</h4>
        <p>{details.materials_and_colors ?? "To be finalized after the consultation."}</p>

        <h4>Event Coverage</h4>
        <p>
          For your <strong>{coverageLabel}</strong> at{" "}
          <strong>{details.event_coverage.venue_name ?? "________________"}</strong>{" "}
          on the specified event date(s):
        </p>
        <p>
          <strong>Reception date:</strong>{" "}
          {formatDate(details.event_coverage.reception_date)}
        </p>
        <p>
          <strong>Melsi date:</strong> {formatDate(details.event_coverage.melsi_date)}
        </p>
        <p>
          <strong>Number of guests:</strong>{" "}
          {details.counts.guest_count ?? contract.guest_count ?? "________________"}
        </p>
        <p>
          <strong>Bridal party:</strong>{" "}
          {details.counts.bridal_party_count ?? "________________"}
        </p>

        <h4>Decoration Details</h4>
        <div className="contract-preview-list">
          {details.decor_items.map((item, index) => (
            <div key={`${item.name}-${index}`} className="contract-preview-item">
              <strong>{item.name}</strong>
              <p>{item.details || "To be finalized after the consultation."}</p>
            </div>
          ))}
        </div>

        {details.custom_clauses ? (
          <>
            <h4>Custom Clauses</h4>
            <p>{details.custom_clauses}</p>
          </>
        ) : null}

        <h4>Signature Block</h4>
        <p>Customer Signature: _____________________________ Date: ____________</p>
        <p>Customer Signature: _____________________________ Date: ____________</p>
        <p>
          Elel Event and Design Representative: __________________ Date: ____________
        </p>
      </div>
    </section>
  );
}
