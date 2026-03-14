"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VENDOR_SERVICE_CATEGORIES } from "@/lib/vendors";

type VendorOption = {
  id: string;
  business_name: string;
  service_categories: string[] | null;
  default_referral_fee: number | null;
};

type ExistingReferral = {
  id: string;
  category: string;
  status: string;
  fee_amount: number | null;
  created_at: string;
  vendor: {
    business_name: string | null;
  } | {
    business_name: string | null;
  }[] | null;
};

export default function VendorReferralForm({
  inquiryId,
  initialRequestedCategories,
  initialVendorRequestNotes,
  vendors,
  existingReferrals,
}: {
  inquiryId: string;
  initialRequestedCategories: string[];
  initialVendorRequestNotes: string | null;
  vendors: VendorOption[];
  existingReferrals: ExistingReferral[];
}) {
  const router = useRouter();
  const [requestedCategories, setRequestedCategories] = useState(initialRequestedCategories);
  const [vendorRequestNotes, setVendorRequestNotes] = useState(initialVendorRequestNotes ?? "");
  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id ?? "");
  const [category, setCategory] = useState(initialRequestedCategories[0] ?? VENDOR_SERVICE_CATEGORIES[0]);
  const [introMessage, setIntroMessage] = useState("");
  const [feeAmount, setFeeAmount] = useState(String(vendors[0]?.default_referral_fee ?? 0));
  const [message, setMessage] = useState("");
  const [savingRequest, setSavingRequest] = useState(false);
  const [sendingReferral, setSendingReferral] = useState(false);

  function toggleRequestedCategory(item: string) {
    setRequestedCategories((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  function handleVendorChange(nextVendorId: string) {
    setSelectedVendorId(nextVendorId);
    const nextVendor = vendors.find((item) => item.id === nextVendorId);
    setFeeAmount(String(nextVendor?.default_referral_fee ?? 0));
  }

  async function saveRequestDetails() {
    setSavingRequest(true);
    setMessage("");

    const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requested_vendor_categories: requestedCategories,
        vendor_request_notes: vendorRequestNotes || null,
      }),
    });

    const data = await res.json();
    setSavingRequest(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to save vendor request details.");
      return;
    }

    setMessage("Vendor request details saved.");
    router.refresh();
  }

  async function sendReferral() {
    setSendingReferral(true);
    setMessage("");

    const res = await fetch(`/api/admin/inquiries/${inquiryId}/vendor-referrals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_id: selectedVendorId,
        category,
        intro_message: introMessage || null,
        fee_amount: Number(feeAmount || 0),
      }),
    });

    const data = await res.json();
    setSendingReferral(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to send referral.");
      return;
    }

    setMessage("Referral sent to vendor.");
    setIntroMessage("");
    router.refresh();
  }

  return (
    <div className="card">
      <h3>Vendor Referrals</h3>
      <p className="muted">
        Track what partner categories the client asked for, then send curated referrals.
      </p>

      <div className="field">
        <label className="label">Requested Vendor Categories</label>
        <div className="option-pills">
          {VENDOR_SERVICE_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              className={`pill ${requestedCategories.includes(item) ? "selected" : ""}`}
              onClick={() => toggleRequestedCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="label">Vendor Request Notes</label>
        <textarea
          className="textarea"
          value={vendorRequestNotes}
          onChange={(e) => setVendorRequestNotes(e.target.value)}
          placeholder="What kind of partner does the client need? Style, budget, location, timing, etc."
        />
      </div>

      <button type="button" className="btn secondary" onClick={saveRequestDetails} disabled={savingRequest}>
        {savingRequest ? "Saving..." : "Save Vendor Request"}
      </button>

      <div style={{ height: "1px", background: "var(--border)", margin: "24px 0" }} />

      <div className="form-grid">
        <div className="field">
          <label className="label">Vendor</label>
          <select className="input" value={selectedVendorId} onChange={(e) => handleVendorChange(e.target.value)}>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.business_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {VENDOR_SERVICE_CATEGORIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label">Referral Fee</label>
          <input className="input" type="number" min="0" step="0.01" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label className="label">Intro Message</label>
        <textarea
          className="textarea"
          value={introMessage}
          onChange={(e) => setIntroMessage(e.target.value)}
          placeholder="Explain the event briefly so the vendor knows whether to accept."
        />
      </div>

      <button type="button" className="btn" onClick={sendReferral} disabled={sendingReferral || !selectedVendorId}>
        {sendingReferral ? "Sending..." : "Send Referral"}
      </button>

      {message ? <p className={message.includes("saved") || message.includes("sent") ? "success" : "error"}>{message}</p> : null}

      <div style={{ marginTop: "22px", display: "grid", gap: "12px" }}>
        <h4>Sent Referrals</h4>
        {existingReferrals.length ? existingReferrals.map((item) => (
          <div key={item.id} className="review-card">
            <strong>
              {(Array.isArray(item.vendor) ? item.vendor[0]?.business_name : item.vendor?.business_name) ?? "Vendor"}
            </strong>
            <p className="muted">
              {item.category} • {item.status} • ${Number(item.fee_amount ?? 0).toLocaleString()}
            </p>
            <p className="muted">
              Sent {new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>
        )) : (
          <p className="muted">No vendor referrals sent yet.</p>
        )}
      </div>
    </div>
  );
}
