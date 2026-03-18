"use client";

import { useState } from "react";
import {
  BOOKING_STAGES,
  getBookingWarningLabel,
  humanizeBookingStage,
} from "@/lib/booking-lifecycle";

export default function BookingLifecycleForm({
  inquiryId,
  initialBookingStage,
  initialFloorPlanReceived,
  initialWalkthroughCompleted,
  eventDate,
  otherEventsOnDate,
}: {
  inquiryId: string;
  initialBookingStage: string | null;
  initialFloorPlanReceived: boolean;
  initialWalkthroughCompleted: boolean;
  eventDate: string | null;
  otherEventsOnDate: number;
}) {
  const [bookingStage, setBookingStage] = useState(initialBookingStage || "inquiry");
  const [floorPlanReceived, setFloorPlanReceived] = useState(initialFloorPlanReceived);
  const [walkthroughCompleted, setWalkthroughCompleted] = useState(
    initialWalkthroughCompleted
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const warningLabel = getBookingWarningLabel(otherEventsOnDate);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_stage: bookingStage,
        floor_plan_received: floorPlanReceived,
        walkthrough_completed: walkthroughCompleted,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to save booking lifecycle.");
      return;
    }

    setMessage("Booking lifecycle saved.");
  }

  return (
    <div className="booking-lifecycle-panel">
      <div className="booking-lifecycle-head">
        <div>
          <p className="eyebrow">Booking lifecycle</p>
          <h4>Track the event from inquiry to teardown</h4>
        </div>
        {warningLabel && eventDate ? (
          <div className="booking-warning-card">
            <strong>{warningLabel}</strong>
            <span>
              {otherEventsOnDate} other event{otherEventsOnDate === 1 ? "" : "s"} on{" "}
              {new Date(eventDate).toLocaleDateString()}
            </span>
          </div>
        ) : null}
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label">Booking Status</label>
          <select
            className="input"
            value={bookingStage}
            onChange={(e) => setBookingStage(e.target.value)}
          >
            {BOOKING_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {humanizeBookingStage(stage)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="booking-prep-grid">
        <label className="checkline">
          <input
            type="checkbox"
            checked={floorPlanReceived}
            onChange={(e) => setFloorPlanReceived(e.target.checked)}
          />
          <span>Floor plan received</span>
        </label>

        <label className="checkline">
          <input
            type="checkbox"
            checked={walkthroughCompleted}
            onChange={(e) => setWalkthroughCompleted(e.target.checked)}
          />
          <span>Walkthrough completed</span>
        </label>
      </div>

      <button
        type="button"
        className="btn secondary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Lifecycle"}
      </button>

      {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
    </div>
  );
}
