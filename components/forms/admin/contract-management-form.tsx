"use client";

import { useState } from "react";
import AdminWorkflowAction from "@/components/admin/admin-workflow-action";
import {
  type ContractDetails,
  normalizeContractDetails,
} from "@/lib/contracts";

const statuses = ["draft", "sent", "signed", "deposit_paid", "closed"];
const sections = [
  { id: "essentials", label: "Overview", description: "Status, totals, due dates, and the agreement date." },
  { id: "coverage", label: "Coverage", description: "What event dates and venue coverage are actually included." },
  { id: "logistics", label: "Logistics", description: "Setup windows, access rules, and guest/style planning." },
  { id: "decor", label: "Decor", description: "The itemized decor scope the client is approving." },
  { id: "payment", label: "Payment", description: "Deposit tracking, remaining balance, and method details." },
  { id: "notes", label: "Signing + Notes", description: "Manual signing fallback, clauses, and internal notes." },
] as const;

function asInputNumber(value: number | null | undefined) {
  return value ?? "";
}

function humanizeLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ContractManagementForm({
  contract,
}: {
  contract: any;
}) {
  const initialDetails = normalizeContractDetails(
    contract.contract_details_json,
    contract
  );

  const [status, setStatus] = useState(contract.contract_status || "draft");
  const [contractTotal, setContractTotal] = useState(
    contract.contract_total ? String(contract.contract_total) : ""
  );
  const [depositAmount, setDepositAmount] = useState(
    contract.deposit_amount ? String(contract.deposit_amount) : ""
  );
  const [balanceDueDate, setBalanceDueDate] = useState(
    contract.balance_due_date || ""
  );
  const [docusignUrl, setDocusignUrl] = useState(contract.docusign_url || "");
  const [notes, setNotes] = useState(contract.notes || "");
  const [depositPaid, setDepositPaid] = useState(!!contract.deposit_paid);
  const [details, setDetails] = useState<ContractDetails>(initialDetails);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeSection, setActiveSection] =
    useState<(typeof sections)[number]["id"]>("essentials");
  const activeSectionIndex = sections.findIndex((item) => item.id === activeSection);
  const activeSectionConfig =
    sections[activeSectionIndex] ?? sections[0];
  const isLastSection = activeSectionIndex === sections.length - 1;

  function updateDetails<K extends keyof ContractDetails>(
    section: K,
    value: ContractDetails[K]
  ) {
    setDetails((current) => ({
      ...current,
      [section]: value,
    }));
  }

  async function handleSave() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/admin/contracts/${contract.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_status: status,
          contract_total: contractTotal ? Number(contractTotal) : 0,
          deposit_amount: depositAmount ? Number(depositAmount) : 0,
          balance_due_date: balanceDueDate || null,
          docusign_url: docusignUrl,
          notes,
          deposit_paid: depositPaid,
          contract_details_json: details,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to save.");
        setLoading(false);
        return;
      }

      const nextDetails = normalizeContractDetails(
        data.contract?.contract_details_json ?? details,
        data.contract ?? contract
      );

      setDetails(nextDetails);
      setContractTotal(String(data.contract?.contract_total ?? contractTotal));
      setDepositAmount(String(data.contract?.deposit_amount ?? depositAmount));
      setBalanceDueDate(data.contract?.balance_due_date || "");
      setMessage("Saved successfully.");
    } catch {
      setMessage("Something went wrong while saving.");
    } finally {
      setLoading(false);
    }
  }

  async function sendContract() {
    setSending(true);
    setMessage("");

    try {
      const res = await fetch(`/api/admin/contracts/${contract.id}/send`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to send contract.");
        setSending(false);
        return;
      }

      setMessage(
        data.mode === "docusign"
          ? "Signature request sent through DocuSign."
          : "Contract email sent using the manual signing link."
      );
      setStatus("sent");
    } catch {
      setMessage("Something went wrong while sending the contract.");
    } finally {
      setSending(false);
    }
  }

  async function syncDocusignStatus() {
    setSyncing(true);
    setMessage("");

    try {
      const res = await fetch(
        `/api/admin/contracts/${contract.id}/sync-docusign`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to sync DocuSign status.");
        setSyncing(false);
        return;
      }

      if (data.contract?.contract_status) {
        setStatus(data.contract.contract_status);
      }

      setMessage(`DocuSign status synced: ${data.envelopeStatus || "unknown"}.`);
    } catch {
      setMessage("Something went wrong while syncing DocuSign.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div style={{ marginTop: "16px" }}>
      <div className="contract-action-bar">
        <div className="contract-action-group">
          <AdminWorkflowAction
            tone="internal"
            label={loading ? "Saving..." : "Save Contract"}
            description="Updates the internal contract record, pricing, and clause details only."
            onClick={handleSave}
            disabled={loading}
          />

          <AdminWorkflowAction
            tone="email"
            label={sending ? "Sending..." : "Send Signature Request"}
            description="Sends the contract to the client by DocuSign or manual signing email."
            onClick={sendContract}
            disabled={sending}
          />

          <AdminWorkflowAction
            tone="sync"
            label={syncing ? "Syncing..." : "Check DocuSign Status"}
            description="Reads the current DocuSign envelope state and updates the internal status."
            onClick={syncDocusignStatus}
            disabled={syncing}
          />
        </div>

        {message ? <p className="contract-inline-message">{message}</p> : null}
      </div>

      <div className="contract-section-tabs">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`pill ${activeSection === section.id ? "selected" : ""}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="contract-section-intro">
        <p className="eyebrow">
          Section {activeSectionIndex + 1} of {sections.length}
        </p>
        <h4>{activeSectionConfig.label}</h4>
        <p className="muted">{activeSectionConfig.description}</p>
        {activeSection === "decor" ? (
          <p className="muted contract-section-note">
            Visual reference image fields for head table, centerpiece, and
            Traditional (Melsi) are at the bottom of this section.
          </p>
        ) : null}
      </div>

      <div className="contract-form-grid contract-form-grid--single">
        {activeSection === "essentials" ? (
        <div className="card contract-section-card">
          <h4>Contract Basics</h4>

          <div className="field">
            <label className="label">Contract Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {humanizeLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Agreement Date</label>
            <input
              className="input"
              type="date"
              value={details.agreement_date || ""}
              onChange={(e) =>
                setDetails((current) => ({
                  ...current,
                  agreement_date: e.target.value || null,
                }))
              }
            />
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="label">Contract Total</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={contractTotal}
                onChange={(e) => setContractTotal(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Deposit Amount</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Balance Due Date</label>
            <input
              className="input"
              type="date"
              value={balanceDueDate}
              onChange={(e) => setBalanceDueDate(e.target.value)}
            />
          </div>
        </div>
        ) : null}

        {activeSection === "coverage" ? (
        <div className="card contract-section-card">
          <h4>Event Coverage</h4>

          <div className="checkbox-grid">
            <label className="checkline">
              <input
                type="checkbox"
                checked={details.event_coverage.includes_reception}
                onChange={(e) =>
                  updateDetails("event_coverage", {
                    ...details.event_coverage,
                    includes_reception: e.target.checked,
                  })
                }
              />
              <span>Reception included</span>
            </label>

            <label className="checkline">
              <input
                type="checkbox"
                checked={details.event_coverage.includes_melsi}
                onChange={(e) =>
                  updateDetails("event_coverage", {
                    ...details.event_coverage,
                    includes_melsi: e.target.checked,
                  })
                }
              />
              <span>Traditional (Melsi) included</span>
            </label>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="label">Reception Date</label>
              <input
                className="input"
                type="date"
                value={details.event_coverage.reception_date || ""}
                onChange={(e) =>
                  updateDetails("event_coverage", {
                    ...details.event_coverage,
                    reception_date: e.target.value || null,
                  })
                }
              />
            </div>

            <div className="field">
              <label className="label">Melsi Date</label>
              <input
                className="input"
                type="date"
                value={details.event_coverage.melsi_date || ""}
                onChange={(e) =>
                  updateDetails("event_coverage", {
                    ...details.event_coverage,
                    melsi_date: e.target.value || null,
                  })
                }
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Venue Name</label>
            <input
              className="input"
              value={details.event_coverage.venue_name || ""}
              onChange={(e) =>
                updateDetails("event_coverage", {
                  ...details.event_coverage,
                  venue_name: e.target.value || null,
                })
              }
            />
          </div>

          <div className="field">
            <label className="label">Venue Address</label>
            <textarea
              className="textarea"
              value={details.event_coverage.venue_address || ""}
              onChange={(e) =>
                updateDetails("event_coverage", {
                  ...details.event_coverage,
                  venue_address: e.target.value || null,
                })
              }
            />
          </div>

          <div className="field">
            <label className="label">Coverage Notes</label>
            <textarea
              className="textarea"
              value={details.event_coverage.coverage_notes || ""}
              onChange={(e) =>
                updateDetails("event_coverage", {
                  ...details.event_coverage,
                  coverage_notes: e.target.value || null,
                })
              }
            />
          </div>
        </div>
        ) : null}

        {activeSection === "logistics" ? (
        <div className="card contract-section-card">
          <h4>Setup and Logistics</h4>

          <div className="form-grid">
            <div className="field">
              <label className="label">Setup Window (Hours)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={asInputNumber(details.logistics.setup_window_hours)}
                onChange={(e) =>
                  updateDetails("logistics", {
                    ...details.logistics,
                    setup_window_hours: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </div>

            <div className="field">
              <label className="label">Teardown Window (Hours)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={asInputNumber(details.logistics.teardown_window_hours)}
                onChange={(e) =>
                  updateDetails("logistics", {
                    ...details.logistics,
                    teardown_window_hours: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </div>
          </div>

          <label className="checkline">
            <input
              type="checkbox"
              checked={details.logistics.early_access_requested}
              onChange={(e) =>
                updateDetails("logistics", {
                  ...details.logistics,
                  early_access_requested: e.target.checked,
                })
              }
            />
            <span>Venue allows or requires early access</span>
          </label>

          <div className="field" style={{ marginTop: "14px" }}>
            <label className="label">Venue Access Notes</label>
            <textarea
              className="textarea"
              value={details.logistics.venue_access_notes || ""}
              onChange={(e) =>
                updateDetails("logistics", {
                  ...details.logistics,
                  venue_access_notes: e.target.value || null,
                })
              }
              placeholder="Setup window rules, teardown expectations, table clearing notes, vendor coordination."
            />
          </div>
        </div>
        ) : null}

        {activeSection === "logistics" ? (
        <div className="card contract-section-card">
          <h4>Guest Counts and Style</h4>

          <div className="form-grid">
            <div className="field">
              <label className="label">Guest Count</label>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={asInputNumber(details.counts.guest_count)}
                onChange={(e) =>
                  updateDetails("counts", {
                    ...details.counts,
                    guest_count: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="field">
              <label className="label">Bridal Party Count</label>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={asInputNumber(details.counts.bridal_party_count)}
                onChange={(e) =>
                  updateDetails("counts", {
                    ...details.counts,
                    bridal_party_count: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Materials and Colors</label>
            <textarea
              className="textarea"
              value={details.materials_and_colors || ""}
              onChange={(e) =>
                setDetails((current) => ({
                  ...current,
                  materials_and_colors: e.target.value || null,
                }))
              }
              placeholder="Color palette, linens, charger finishes, floral direction, fabric notes."
            />
          </div>
        </div>
        ) : null}

        {activeSection === "decor" ? (
        <div className="card contract-section-card contract-section-card--wide">
          <div className="contract-line-header">
            <h4>Decoration Details</h4>
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                setDetails((current) => ({
                  ...current,
                  decor_items: [
                    ...current.decor_items,
                    { name: "", details: "" },
                  ],
                }))
              }
            >
              Add Decor Item
            </button>
          </div>

          <div className="contract-line-list">
            {details.decor_items.map((item, index) => (
              <div key={`${item.name}-${index}`} className="contract-line-item">
                <div className="field">
                  <label className="label">Item Name</label>
                  <input
                    className="input"
                    value={item.name}
                    onChange={(e) =>
                      setDetails((current) => ({
                        ...current,
                        decor_items: current.decor_items.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, name: e.target.value }
                            : entry
                        ),
                      }))
                    }
                  />
                </div>

                <div className="field">
                  <label className="label">Details</label>
                  <textarea
                    className="textarea"
                    value={item.details}
                    onChange={(e) =>
                      setDetails((current) => ({
                        ...current,
                        decor_items: current.decor_items.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, details: e.target.value }
                            : entry
                        ),
                      }))
                    }
                    placeholder="Colors, quantity notes, placement, optional items."
                  />
                </div>

                <button
                  type="button"
                  className="btn secondary"
                  onClick={() =>
                    setDetails((current) => ({
                      ...current,
                      decor_items: current.decor_items.filter(
                        (_, entryIndex) => entryIndex !== index
                      ),
                    }))
                  }
                >
                  Remove Item
                </button>
              </div>
            ))}
          </div>

          <div className="contract-reference-grid">
            <div className="field">
              <label className="label">Head Table Reference Image</label>
              <input
                className="input"
                value={details.visual_references.head_table_image_url || ""}
                onChange={(e) =>
                  updateDetails("visual_references", {
                    ...details.visual_references,
                    head_table_image_url: e.target.value || null,
                  })
                }
                placeholder="Paste an image URL the client should see in the contract"
              />
            </div>

            <div className="field">
              <label className="label">Centerpiece Reference Image</label>
              <input
                className="input"
                value={details.visual_references.centerpiece_image_url || ""}
                onChange={(e) =>
                  updateDetails("visual_references", {
                    ...details.visual_references,
                    centerpiece_image_url: e.target.value || null,
                  })
                }
                placeholder="Paste an image URL for centerpiece expectations"
              />
            </div>

            <div className="field">
              <label className="label">Traditional (Melsi) Reference Image</label>
              <input
                className="input"
                value={details.visual_references.melsi_image_url || ""}
                onChange={(e) =>
                  updateDetails("visual_references", {
                    ...details.visual_references,
                    melsi_image_url: e.target.value || null,
                  })
                }
                placeholder="Paste an image URL for the Melsi setup"
              />
            </div>
          </div>
        </div>
        ) : null}

        {activeSection === "payment" ? (
        <div className="card contract-section-card">
          <h4>Payment Record</h4>

          <div className="form-grid">
            <div className="field">
              <label className="label">Deposit Received</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={asInputNumber(
                  details.payment_record.deposit_received_amount
                )}
                onChange={(e) =>
                  updateDetails("payment_record", {
                    ...details.payment_record,
                    deposit_received_amount: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </div>

            <div className="field">
              <label className="label">Deposit Received Date</label>
              <input
                className="input"
                type="date"
                value={details.payment_record.deposit_received_date || ""}
                onChange={(e) =>
                  updateDetails("payment_record", {
                    ...details.payment_record,
                    deposit_received_date: e.target.value || null,
                  })
                }
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Payment Method</label>
            <input
              className="input"
              value={details.payment_record.payment_method || ""}
              onChange={(e) =>
                updateDetails("payment_record", {
                  ...details.payment_record,
                  payment_method: e.target.value || null,
                })
              }
              placeholder="Zelle, cash, bank transfer, check"
            />
          </div>

          <div className="field">
            <label className="label">Payment Method Details</label>
            <textarea
              className="textarea"
              value={details.payment_record.payment_method_details || ""}
              onChange={(e) =>
                updateDetails("payment_record", {
                  ...details.payment_record,
                  payment_method_details: e.target.value || null,
                })
              }
              placeholder="Recipient name, phone number, memo instructions."
            />
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="label">Remaining Balance</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={asInputNumber(
                  details.payment_record.remaining_balance_amount
                )}
                onChange={(e) =>
                  updateDetails("payment_record", {
                    ...details.payment_record,
                    remaining_balance_amount: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </div>

            <div className="field">
              <label className="label">Remaining Balance Due Date</label>
              <input
                className="input"
                type="date"
                value={details.payment_record.remaining_balance_due_date || ""}
                onChange={(e) =>
                  updateDetails("payment_record", {
                    ...details.payment_record,
                    remaining_balance_due_date: e.target.value || null,
                  })
                }
              />
            </div>
          </div>

          <div className="field">
            <label className="checkline">
              <input
                type="checkbox"
                checked={depositPaid}
                onChange={(e) => setDepositPaid(e.target.checked)}
              />
              <span>Record deposit as paid</span>
            </label>
            <p className="muted contract-inline-note">
              This updates the internal payment record and booking workflow. It does not charge the client automatically.
            </p>
          </div>
        </div>
        ) : null}

        {activeSection === "notes" ? (
        <div className="card contract-section-card">
          <h4>Links and Internal Notes</h4>

          <div className="field">
            <label className="label">Manual Signing Link (Temporary)</label>
            <input
              className="input"
              value={docusignUrl}
              onChange={(e) => setDocusignUrl(e.target.value)}
              placeholder="Paste the client signing link only if you created the DocuSign envelope manually"
            />
          </div>

          <p className="muted" style={{ marginTop: "-4px", marginBottom: "16px" }}>
            Leave this blank for now if you are not creating the DocuSign envelope
            manually yet. The proper end state is direct DocuSign integration, not
            pasting links.
          </p>

          <p className="muted" style={{ marginTop: "-4px", marginBottom: "16px" }}>
            Saved envelope: {contract.docusign_envelope_id || "Not sent yet"}
            {contract.docusign_envelope_status
              ? ` (${contract.docusign_envelope_status})`
              : ""}
          </p>

          <p className="muted" style={{ marginTop: "-4px", marginBottom: "16px" }}>
            If your DocuSign webhook is configured with a public URL, signed status
            updates and internal notifications happen automatically. Otherwise use
            manual sync.
          </p>

          <div className="field">
            <label className="label">Custom Clauses</label>
            <textarea
              className="textarea"
              value={details.custom_clauses || ""}
              onChange={(e) =>
                setDetails((current) => ({
                  ...current,
                  custom_clauses: e.target.value || null,
                }))
              }
              placeholder="Anything custom for this client beyond the base template."
            />
          </div>

          <div className="field">
            <label className="label">Internal Notes</label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal contract notes"
            />
          </div>
        </div>
        ) : null}
      </div>

      <div className="contract-section-footer">
        <button
          type="button"
          className="btn secondary"
          disabled={activeSectionIndex === 0}
          onClick={() =>
            setActiveSection(
              sections[
                Math.max(
                  0,
                  activeSectionIndex - 1
                )
              ].id
            )
          }
        >
          Previous Section
        </button>

        {isLastSection ? (
          <div className="contract-section-footer-actions">
            <AdminWorkflowAction
              tone="internal"
              label={loading ? "Saving..." : "Save Contract"}
              description="Save the final contract details before sending the signature request."
              onClick={handleSave}
              disabled={loading}
            />
            <AdminWorkflowAction
              tone="email"
              label={sending ? "Sending..." : "Send Signature Request"}
              description="Send the finished contract to the client for signing."
              onClick={sendContract}
              disabled={sending}
            />
          </div>
        ) : (
          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              setActiveSection(
                sections[
                  Math.min(
                    sections.length - 1,
                    activeSectionIndex + 1
                  )
                ].id
              )
            }
          >
            Next Section
          </button>
        )}
      </div>
    </div>
  );
}
