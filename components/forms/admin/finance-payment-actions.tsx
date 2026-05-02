"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FinancePaymentActionsProps = {
  contractId: string | null;
  contractHref: string | null;
  paymentKind: string;
  status: string;
  amount: number;
};

function humanizePaymentKind(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function FinancePaymentActions({
  contractId,
  contractHref,
  paymentKind,
  status,
  amount,
}: FinancePaymentActionsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isDeposit = paymentKind === "deposit";
  const isBalance = paymentKind === "balance";
  const isPaid = status === "paid";
  const canRecord = Boolean(contractId) && !isPaid && amount > 0 && (isDeposit || isBalance);

  async function recordPayment() {
    if (!contractId || !canRecord) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isDeposit
            ? { deposit_paid: true }
            : { balance_paid: true }
        ),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || `Failed to record ${humanizePaymentKind(paymentKind)}.`);
        setSaving(false);
        return;
      }

      setMessage(`${humanizePaymentKind(paymentKind)} recorded.`);
      router.refresh();
    } catch {
      setMessage(`Failed to record ${humanizePaymentKind(paymentKind)}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-finance-payment-actions">
      {canRecord ? (
        <button
          type="button"
          className="btn"
          onClick={recordPayment}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : isDeposit
              ? "Record Deposit"
              : "Record Final Payment"}
        </button>
      ) : null}
      {contractHref ? (
        <a href={contractHref} className="btn secondary">
          View Contract
        </a>
      ) : null}
      {message ? <p className="admin-finance-payment-actions-message">{message}</p> : null}
    </div>
  );
}
