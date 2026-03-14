"use client";

import { useState } from "react";
import { VENDOR_SERVICE_CATEGORIES } from "@/lib/vendors";

type VendorApplicationState = {
  businessName: string;
  contactName: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  state: string;
  serviceArea: string;
  instagramHandle: string;
  websiteUrl: string;
  bio: string;
  pricingTier: string;
  serviceCategories: string[];
};

const initialState: VendorApplicationState = {
  businessName: "",
  contactName: "",
  email: "",
  password: "",
  phone: "",
  city: "",
  state: "",
  serviceArea: "",
  instagramHandle: "",
  websiteUrl: "",
  bio: "",
  pricingTier: "",
  serviceCategories: [],
};

export default function VendorApplicationForm() {
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof VendorApplicationState>(
    key: K,
    value: VendorApplicationState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(category: string) {
    setForm((prev) => ({
      ...prev,
      serviceCategories: prev.serviceCategories.includes(category)
        ? prev.serviceCategories.filter((item) => item !== category)
        : [...prev.serviceCategories, category],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/vendors/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to submit vendor application.");
      return;
    }

    setMessage("Vendor application submitted. Once approved, you can sign in to view referrals.");
    setForm(initialState);
  }

  return (
    <div className="card form-card" style={{ maxWidth: "860px", margin: "0 auto" }}>
      <h2>Apply as a Vendor Partner</h2>
      <p className="muted">
        This is for curated referral partners only. Low-quality lead farming is trash and
        will not be approved.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label className="label">Business Name</label>
            <input className="input" value={form.businessName} onChange={(e) => updateField("businessName", e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Contact Name</label>
            <input className="input" value={form.contactName} onChange={(e) => updateField("contactName", e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" minLength={8} value={form.password} onChange={(e) => updateField("password", e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Pricing Tier</label>
            <input className="input" value={form.pricingTier} onChange={(e) => updateField("pricingTier", e.target.value)} placeholder="Budget, mid-range, premium" />
          </div>
          <div className="field">
            <label className="label">City</label>
            <input className="input" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
          </div>
          <div className="field">
            <label className="label">State</label>
            <input className="input" value={form.state} onChange={(e) => updateField("state", e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Service Area</label>
            <input className="input" value={form.serviceArea} onChange={(e) => updateField("serviceArea", e.target.value)} placeholder="Twin Cities, Minnesota, etc." />
          </div>
          <div className="field">
            <label className="label">Instagram Handle</label>
            <input className="input" value={form.instagramHandle} onChange={(e) => updateField("instagramHandle", e.target.value)} placeholder="@yourbrand" />
          </div>
        </div>

        <div className="field">
          <label className="label">Website URL</label>
          <input className="input" value={form.websiteUrl} onChange={(e) => updateField("websiteUrl", e.target.value)} placeholder="https://..." />
        </div>

        <div className="field">
          <label className="label">Service Categories</label>
          <div className="option-pills">
            {VENDOR_SERVICE_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={`pill ${form.serviceCategories.includes(category) ? "selected" : ""}`}
                onClick={() => toggleCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">Short Bio</label>
          <textarea
            className="textarea"
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder="Explain what you do, your style, and why you are a strong referral partner."
          />
        </div>

        {message ? (
          <p className={message.includes("submitted") ? "success" : "error"}>{message}</p>
        ) : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Apply as Vendor"}
        </button>
      </form>
    </div>
  );
}
