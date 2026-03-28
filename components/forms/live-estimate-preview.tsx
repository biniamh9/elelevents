"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LiveEstimatePreviewProps = {
  selectedItems: string[];
  guestCount: number | null;
  tableCount: number | null;
  eventType: string;
  venueMultiplier: number;
};

type EstimateRange = {
  low: number;
  high: number;
};

type RpcEstimateResponse =
  | {
      estimate_low?: number | string | null;
      estimate_high?: number | string | null;
      min_estimate?: number | string | null;
      max_estimate?: number | string | null;
      low_estimate?: number | string | null;
      high_estimate?: number | string | null;
      range_min?: number | string | null;
      range_max?: number | string | null;
      low?: number | string | null;
      high?: number | string | null;
    }
  | null
  | undefined;

function coerceEstimateRange(payload: RpcEstimateResponse | RpcEstimateResponse[]): EstimateRange | null {
  const row = Array.isArray(payload) ? payload[0] : payload;

  if (!row || typeof row !== "object") {
    return null;
  }

  const low =
    row.estimate_low ??
    row.min_estimate ??
    row.low_estimate ??
    row.range_min ??
    row.low ??
    null;
  const high =
    row.estimate_high ??
    row.max_estimate ??
    row.high_estimate ??
    row.range_max ??
    row.high ??
    null;

  const parsedLow = typeof low === "number" ? low : typeof low === "string" ? Number(low) : NaN;
  const parsedHigh = typeof high === "number" ? high : typeof high === "string" ? Number(high) : NaN;

  if (Number.isNaN(parsedLow) || Number.isNaN(parsedHigh)) {
    return null;
  }

  return {
    low: parsedLow,
    high: parsedHigh,
  };
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function LiveEstimatePreview({
  selectedItems,
  guestCount,
  tableCount,
  eventType,
  venueMultiplier,
}: LiveEstimatePreviewProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [estimate, setEstimate] = useState<EstimateRange | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const shouldFetch = selectedItems.length > 0 || Boolean(guestCount) || Boolean(tableCount);
  const luxurySignal =
    selectedItems.length >= 4 ||
    (guestCount ?? 0) >= 150 ||
    venueMultiplier >= 1.12 ||
    eventType === "Wedding" ||
    eventType === "Traditional (Melsi)";

  useEffect(() => {
    if (!shouldFetch) {
      setEstimate(null);
      setLoading(false);
      setError("");
      return;
    }

    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      const { data, error: rpcError } = await supabase.rpc("calculate_ai_estimate", {
        p_items: selectedItems,
        p_guest_count: guestCount,
        p_table_count: tableCount,
        p_event_type: eventType || "Other",
        p_venue_complexity_multiplier: venueMultiplier,
      });

      if (requestIdRef.current !== nextRequestId) {
        return;
      }

      if (rpcError) {
        setError("Custom quote refined during consultation");
        setLoading(false);
        return;
      }

      const nextEstimate = coerceEstimateRange(data);

      if (!nextEstimate) {
        setError("Custom quote refined during consultation");
        setLoading(false);
        return;
      }

      setEstimate(nextEstimate);
      setLoading(false);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [eventType, guestCount, selectedItems, shouldFetch, supabase, tableCount, venueMultiplier]);

  const estimateLabel = estimate
    ? `${formatUsd(estimate.low)} – ${formatUsd(estimate.high)}`
    : "Custom quote";

  return (
    <section className={`live-estimate-card ${loading ? "is-loading" : ""}`}>
      <div className="live-estimate-head">
        <small>Estimated Starting Investment</small>
        <span>{loading ? "Refreshing" : "Live pricing intelligence"}</span>
      </div>

      <div className="live-estimate-figure" aria-live="polite">
        {estimateLabel}
      </div>

      <p className="live-estimate-subcopy">Based on your dream selections so far</p>

      <div className="live-estimate-note">
        {luxurySignal
          ? "Your selections indicate a signature luxury setup"
          : "A beautiful elegant setup in an intimate range"}
      </div>

      <p className="live-estimate-footer">
        {error || "Your custom quote will be refined during consultation"}
      </p>
    </section>
  );
}
