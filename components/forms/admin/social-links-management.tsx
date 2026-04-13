"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSocialLinks } from "@/lib/social-links";

export default function SocialLinksManagement({
  initialLinks,
}: {
  initialLinks: SiteSocialLinks;
}) {
  const router = useRouter();
  const [instagramUrl, setInstagramUrl] = useState(initialLinks.instagramUrl);
  const [facebookUrl, setFacebookUrl] = useState(initialLinks.facebookUrl);
  const [tiktokUrl, setTiktokUrl] = useState(initialLinks.tiktokUrl);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveLinks() {
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/social-links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instagramUrl,
        facebookUrl,
        tiktokUrl,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to update social links.");
      return;
    }

    setMessage("Social links updated.");
    router.refresh();
  }

  return (
    <section className="admin-page section">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Social links</p>
          <h1>Manage website social sharing links</h1>
          <p className="lead">
            These links power the social buttons shown on the booking confirmation screen.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Instagram: {instagramUrl ? "Connected" : "Not set"}</span>
          <span className="admin-head-pill">Facebook: {facebookUrl ? "Connected" : "Not set"}</span>
          <span className="admin-head-pill">TikTok: {tiktokUrl ? "Connected" : "Not set"}</span>
        </div>
      </div>

      <section className="admin-mini-report">
        <div className="admin-section-title">
          <h3>Summary</h3>
          <p className="muted">Keep public sharing destinations current so clients always land on the right channels.</p>
        </div>
      </section>

      <div className="card admin-package-editor">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Booking Success Sharing</p>
            <h3>Instagram, Facebook, and TikTok</h3>
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="label">Instagram URL</label>
            <input
              className="input"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/elelevents"
            />
          </div>
          <div className="field">
            <label className="label">Facebook URL</label>
            <input
              className="input"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/elelevents"
            />
          </div>
          <div className="field">
            <label className="label">TikTok URL</label>
            <input
              className="input"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="https://tiktok.com/@elelevents"
            />
          </div>
        </div>

        <p className="muted" style={{ marginTop: "12px" }}>
          Add full profile links. If a link is empty, that platform will be hidden from the booking success screen.
        </p>

        <div className="admin-package-actions">
          <button type="button" className="btn secondary" onClick={saveLinks} disabled={saving}>
            {saving ? "Saving..." : "Save Social Links"}
          </button>
        </div>

        {message ? <p className={message.includes("updated") ? "success" : "error"}>{message}</p> : null}
      </div>
    </section>
  );
}
