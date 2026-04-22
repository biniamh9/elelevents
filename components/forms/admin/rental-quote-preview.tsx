"use client";

import { useMemo, useState } from "react";

import {
  calculateRentalQuoteTotals,
  formatMoney,
  formatRentalPrice,
  type RentalDepositType,
  type RentalPriceType,
} from "@/lib/rental-shared";

export default function RentalQuotePreview({
  baseRentalPrice,
  priceType,
  minimumOrderQuantity,
  deliveryAvailable,
  setupAvailable,
  breakdownAvailable,
  defaultDeliveryFee,
  defaultSetupFee,
  defaultBreakdownFee,
  depositRequired,
  depositType,
  depositAmount,
}: {
  baseRentalPrice: number;
  priceType: RentalPriceType;
  minimumOrderQuantity: number;
  deliveryAvailable: boolean;
  setupAvailable: boolean;
  breakdownAvailable: boolean;
  defaultDeliveryFee: number;
  defaultSetupFee: number;
  defaultBreakdownFee: number;
  depositRequired: boolean;
  depositType: RentalDepositType;
  depositAmount: number;
}) {
  const [quantity, setQuantity] = useState(minimumOrderQuantity || 1);
  const [includeDelivery, setIncludeDelivery] = useState(deliveryAvailable);
  const [includeSetup, setIncludeSetup] = useState(setupAvailable);
  const [includeBreakdown, setIncludeBreakdown] = useState(breakdownAvailable);

  const totals = useMemo(
    () =>
      calculateRentalQuoteTotals({
        quantity,
        baseRentalPrice,
        priceType,
        includeDelivery,
        includeSetup,
        includeBreakdown,
        deliveryFee: defaultDeliveryFee,
        setupFee: defaultSetupFee,
        breakdownFee: defaultBreakdownFee,
        depositRequired,
        depositType,
        depositAmount,
      }),
    [
      quantity,
      baseRentalPrice,
      priceType,
      includeDelivery,
      includeSetup,
      includeBreakdown,
      defaultDeliveryFee,
      defaultSetupFee,
      defaultBreakdownFee,
      depositRequired,
      depositType,
      depositAmount,
    ]
  );

  return (
    <div className="card rental-quote-preview">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Preview</p>
          <h3>Rental quote helper</h3>
          <p className="muted">
            Reusable calculation for item subtotal, logistics fees, and refundable security deposit.
          </p>
        </div>
      </div>

      <div className="field">
        <label className="label">Preview quantity</label>
        <input
          className="input"
          type="number"
          min={minimumOrderQuantity || 1}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(Number(event.target.value || 1), minimumOrderQuantity || 1))}
        />
      </div>

      <div className="rental-quote-preview-price">
        <span>Base pricing</span>
        <strong>{formatRentalPrice(baseRentalPrice, priceType)}</strong>
      </div>

      {depositRequired ? (
        <div className="rental-quote-preview-price">
          <span>Refundable deposit</span>
          <strong>
            {depositType === "percent"
              ? `${depositAmount}% of rental subtotal`
              : depositType === "per_item"
                ? `${formatMoney(depositAmount)} per item`
                : formatMoney(depositAmount)}
          </strong>
        </div>
      ) : null}

      <div className="rental-quote-preview-options">
        {deliveryAvailable ? (
          <label className="checkline">
            <input
              type="checkbox"
              checked={includeDelivery}
              onChange={(event) => setIncludeDelivery(event.target.checked)}
            />
            <span>Include delivery fee ({formatMoney(defaultDeliveryFee)})</span>
          </label>
        ) : null}

        {setupAvailable ? (
          <label className="checkline">
            <input
              type="checkbox"
              checked={includeSetup}
              onChange={(event) => setIncludeSetup(event.target.checked)}
            />
            <span>Include setup fee ({formatMoney(defaultSetupFee)})</span>
          </label>
        ) : null}

        {breakdownAvailable ? (
          <label className="checkline">
            <input
              type="checkbox"
              checked={includeBreakdown}
              onChange={(event) => setIncludeBreakdown(event.target.checked)}
            />
            <span>Include breakdown fee ({formatMoney(defaultBreakdownFee)})</span>
          </label>
        ) : null}
      </div>

      <div className="rental-quote-preview-totals">
        <div><span>Item subtotal</span><strong>{formatMoney(totals.subtotal)}</strong></div>
        <div><span>Delivery</span><strong>{formatMoney(totals.deliveryFee)}</strong></div>
        <div><span>Setup</span><strong>{formatMoney(totals.setupFee)}</strong></div>
        <div><span>Breakdown</span><strong>{formatMoney(totals.breakdownFee)}</strong></div>
        <div><span>Refundable security deposit</span><strong>{formatMoney(totals.securityDeposit)}</strong></div>
        <div><span>Rental + service charges</span><strong>{formatMoney(totals.serviceTotal)}</strong></div>
        <div className="is-total"><span>Total due with deposit</span><strong>{formatMoney(totals.total)}</strong></div>
      </div>
    </div>
  );
}
