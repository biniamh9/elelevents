"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VendorReferralResponseForm({
  referralId,
  currentStatus,
}: {
  referralId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"accepted" | "declined" | null>(null);

  async function updateStatus(nextStatus: "accepted" | "declined") {
    setLoading(nextStatus);
    setMessage("");

    const res = await fetch(`/api/vendors/referrals/${referralId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    const data = await res.json();
    setLoading(null);

    if (!res.ok) {
      setMessage(data.error || "Failed to update referral.");
      return;
    }

    setMessage(nextStatus === "accepted" ? "Referral accepted." : "Referral declined.");
    router.refresh();
  }

  if (currentStatus === "accepted" || currentStatus === "charged") {
    return <p className="success">Referral already accepted.</p>;
  }

  if (currentStatus === "declined") {
    return <p className="muted">This referral was declined.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <div className="btn-row">
        <button
          type="button"
          className="btn"
          onClick={() => updateStatus("accepted")}
          disabled={loading !== null}
        >
          {loading === "accepted" ? "Accepting..." : "Accept Lead"}
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => updateStatus("declined")}
          disabled={loading !== null}
        >
          {loading === "declined" ? "Declining..." : "Decline"}
        </button>
      </div>

      {message ? <p className={message.includes("accepted") ? "success" : "error"}>{message}</p> : null}
    </div>
  );
}
