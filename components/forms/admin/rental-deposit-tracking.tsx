"use client";

import { useMemo, useState } from "react";

import AdminActionRow from "@/components/admin/admin-action-row";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import {
  calculateDepositRefundAmount,
  formatMoney,
  type RentalDepositRecord,
  type RentalDepositStatus,
  type RentalInspectionStatus,
  type RentalRefundStatus,
} from "@/lib/rental-shared";

function sortRecords(records: RentalDepositRecord[]) {
  return [...records].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default function RentalDepositTracking({
  rentalItemId,
  initialRecords,
}: {
  rentalItemId: string;
  initialRecords: RentalDepositRecord[];
}) {
  const [records, setRecords] = useState(() => sortRecords(initialRecords));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [referenceLabel, setReferenceLabel] = useState("");
  const [depositCollectedAmount, setDepositCollectedAmount] = useState("0");
  const [depositStatus, setDepositStatus] = useState<RentalDepositStatus>("pending");
  const [inspectionStatus, setInspectionStatus] = useState<RentalInspectionStatus>("pending");
  const [damageDeductionAmount, setDamageDeductionAmount] = useState("0");
  const [refundStatus, setRefundStatus] = useState<RentalRefundStatus>("not_started");
  const [refundDate, setRefundDate] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const computedRefundAmount = useMemo(() => {
    return calculateDepositRefundAmount(
      Number(depositCollectedAmount || 0),
      Number(damageDeductionAmount || 0)
    );
  }, [depositCollectedAmount, damageDeductionAmount]);

  function resetForm() {
    setEditingId(null);
    setReferenceLabel("");
    setDepositCollectedAmount("0");
    setDepositStatus("pending");
    setInspectionStatus("pending");
    setDamageDeductionAmount("0");
    setRefundStatus("not_started");
    setRefundDate("");
    setDamageNotes("");
    setMessage("");
  }

  function startEditing(record: RentalDepositRecord) {
    setEditingId(record.id);
    setReferenceLabel(record.reference_label ?? "");
    setDepositCollectedAmount(String(record.deposit_collected_amount ?? 0));
    setDepositStatus(record.deposit_status);
    setInspectionStatus(record.inspection_status);
    setDamageDeductionAmount(String(record.damage_deduction_amount ?? 0));
    setRefundStatus(record.refund_status);
    setRefundDate(record.refund_date ? record.refund_date.slice(0, 10) : "");
    setDamageNotes(record.damage_notes ?? "");
    setMessage("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const formData = new FormData();
    formData.set("reference_label", referenceLabel);
    formData.set("deposit_collected_amount", depositCollectedAmount);
    formData.set("deposit_status", depositStatus);
    formData.set("inspection_status", inspectionStatus);
    formData.set("damage_deduction_amount", damageDeductionAmount);
    formData.set("refund_amount", String(computedRefundAmount));
    formData.set("refund_status", refundStatus);
    formData.set("refund_date", refundDate);
    formData.set("damage_notes", damageNotes);

    const endpoint = editingId
      ? `/api/admin/rental-deposit-records/${editingId}`
      : `/api/admin/rentals/${rentalItemId}/deposit-records`;
    const method = editingId ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      body: formData,
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error || "Failed to save deposit record.");
      return;
    }

    const nextRecord = data.record as RentalDepositRecord;
    setRecords((current) =>
      sortRecords(
        editingId
          ? current.map((record) => (record.id === editingId ? nextRecord : record))
          : [nextRecord, ...current]
      )
    );
    resetForm();
  }

  async function handleDelete(recordId: string) {
    const confirmed = window.confirm("Delete this deposit record?");
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage("");
    const response = await fetch(`/api/admin/rental-deposit-records/${recordId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    setDeleting(false);

    if (!response.ok) {
      setMessage(data.error || "Failed to delete deposit record.");
      return;
    }

    setRecords((current) => current.filter((record) => record.id !== recordId));
    if (editingId === recordId) {
      resetForm();
    }
  }

  return (
    <div className="card admin-table-card rental-editor-card">
      <AdminSectionHeader
        eyebrow="Deposit Tracking"
        title="Refundable security deposit records"
        description="Track collected deposits, inspections, deductions, and refunds separately from the rental catalog item."
      />

      <div className="admin-stack">
        {records.length ? (
          <div className="admin-record-list">
            {records.map((record) => (
              <div key={record.id} className="admin-record-card">
                <div className="admin-record-card__main">
                  <div className="admin-record-card__title-row">
                    <strong>{record.reference_label || "Manual deposit record"}</strong>
                    <span className="admin-inline-note">
                      {new Date(record.created_at).toLocaleDateString("en-US")}
                    </span>
                  </div>
                  <div className="admin-record-card__meta">
                    <span>Collected: {formatMoney(record.deposit_collected_amount)}</span>
                    <span>Status: {record.deposit_status.replace(/_/g, " ")}</span>
                    <span>Inspection: {record.inspection_status}</span>
                    <span>Deduction: {formatMoney(record.damage_deduction_amount)}</span>
                    <span>Refund: {formatMoney(record.refund_amount)}</span>
                  </div>
                </div>
                <div className="admin-record-card__actions">
                  <button type="button" className="btn secondary" onClick={() => startEditing(record)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => handleDelete(record.id)}
                    disabled={deleting}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            No deposit records yet. Add a record once a refundable security deposit is collected for a rental order.
          </p>
        )}

        <form className="admin-stack" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label className="label">Reference label</label>
              <input
                className="input"
                value={referenceLabel}
                onChange={(event) => setReferenceLabel(event.target.value)}
                placeholder="Client name, date, or order reference"
              />
            </div>
            <div className="field">
              <label className="label">Deposit collected</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={depositCollectedAmount}
                onChange={(event) => setDepositCollectedAmount(event.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Deposit status</label>
              <select className="input" value={depositStatus} onChange={(event) => setDepositStatus(event.target.value as RentalDepositStatus)}>
                <option value="not_required">Not required</option>
                <option value="pending">Pending</option>
                <option value="collected">Collected</option>
                <option value="partially_refunded">Partially refunded</option>
                <option value="refunded">Refunded</option>
                <option value="forfeited">Forfeited</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Inspection status</label>
              <select className="input" value={inspectionStatus} onChange={(event) => setInspectionStatus(event.target.value as RentalInspectionStatus)}>
                <option value="pending">Pending</option>
                <option value="returned">Returned</option>
                <option value="inspected">Inspected</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Damage deduction</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={damageDeductionAmount}
                onChange={(event) => setDamageDeductionAmount(event.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Refund status</label>
              <select className="input" value={refundStatus} onChange={(event) => setRefundStatus(event.target.value as RentalRefundStatus)}>
                <option value="not_started">Not started</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Refund date</label>
              <input className="input" type="date" value={refundDate} onChange={(event) => setRefundDate(event.target.value)} />
            </div>
            <div className="field">
              <label className="label">Calculated refund amount</label>
              <input className="input" value={formatMoney(computedRefundAmount)} readOnly />
            </div>
          </div>

          <div className="field">
            <label className="label">Damage notes</label>
            <textarea
              className="textarea"
              rows={4}
              value={damageNotes}
              onChange={(event) => setDamageNotes(event.target.value)}
              placeholder="Document damage, missing pieces, excessive soiling, or inspection notes."
            />
          </div>

          <AdminActionRow
            secondary={
              editingId ? (
                <button type="button" className="btn secondary" onClick={resetForm}>
                  Cancel edit
                </button>
              ) : null
            }
            primary={
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update deposit record" : "Add deposit record"}
              </button>
            }
          />
          {message ? <p className="error">{message}</p> : null}
        </form>
      </div>
    </div>
  );
}
