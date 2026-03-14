"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VENDOR_APPROVAL_STATUSES, VENDOR_MEMBERSHIP_STATUSES } from "@/lib/vendors";

type VendorItem = {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  service_categories: string[] | null;
  approval_status: string;
  membership_status: string;
  default_referral_fee: number | null;
  city: string | null;
  state: string | null;
  service_area: string | null;
  is_active: boolean;
  admin_notes: string | null;
};

function VendorRow({ item }: { item: VendorItem }) {
  const router = useRouter();
  const [approvalStatus, setApprovalStatus] = useState(item.approval_status);
  const [membershipStatus, setMembershipStatus] = useState(item.membership_status);
  const [defaultFee, setDefaultFee] = useState(String(item.default_referral_fee ?? 0));
  const [isActive, setIsActive] = useState(item.is_active);
  const [adminNotes, setAdminNotes] = useState(item.admin_notes ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveVendor() {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/vendors/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approval_status: approvalStatus,
        membership_status: membershipStatus,
        default_referral_fee: Number(defaultFee || 0),
        is_active: isActive,
        admin_notes: adminNotes,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to update vendor.");
      return;
    }

    setMessage("Vendor updated.");
    router.refresh();
  }

  return (
    <div className="card">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Vendor account</p>
          <h3>{item.business_name}</h3>
          <p className="muted">
            {item.contact_name} • {item.email}
          </p>
        </div>
        <div className="summary-pills">
          <span className="summary-chip">{item.approval_status}</span>
          <span className="summary-chip">{item.membership_status}</span>
        </div>
      </div>

      <p className="muted">
        {(item.service_categories ?? []).join(", ") || "No categories"} {item.service_area ? `• ${item.service_area}` : ""}
      </p>

      <div className="form-grid">
        <div className="field">
          <label className="label">Approval Status</label>
          <select className="input" value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)}>
            {VENDOR_APPROVAL_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Membership Status</label>
          <select className="input" value={membershipStatus} onChange={(e) => setMembershipStatus(e.target.value)}>
            {VENDOR_MEMBERSHIP_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Default Referral Fee</label>
          <input className="input" type="number" min="0" step="0.01" value={defaultFee} onChange={(e) => setDefaultFee(e.target.value)} />
        </div>

        <div className="field" style={{ display: "grid", alignContent: "end" }}>
          <label className="checkline">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Active vendor account</span>
          </label>
        </div>
      </div>

      <div className="field">
        <label className="label">Admin Notes</label>
        <textarea className="textarea" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
      </div>

      <button type="button" className="btn secondary" onClick={saveVendor} disabled={saving}>
        {saving ? "Saving..." : "Save Vendor"}
      </button>

      {message ? <p className={message.includes("updated") ? "success" : "error"}>{message}</p> : null}
    </div>
  );
}

export default function VendorManagement({ items }: { items: VendorItem[] }) {
  return (
    <div style={{ display: "grid", gap: "18px" }}>
      {items.length ? items.map((item) => <VendorRow key={item.id} item={item} />) : (
        <div className="card">
          <h3>No vendor accounts yet</h3>
          <p className="muted">New vendor applications will appear here for approval.</p>
        </div>
      )}
    </div>
  );
}
