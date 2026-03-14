"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminForgotPasswordForm() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const origin =
      window.location.origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/admin/reset-password`,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password reset email sent. Use the newest email link.");
    setLoading(false);
  }

  return (
    <div className="card form-card" style={{ maxWidth: "520px", margin: "32px auto" }}>
      <h2>Reset Admin Password</h2>
      <p className="muted">
        Enter the admin email and we&apos;ll send a password reset link.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {message ? (
          <p className={message.includes("sent") ? "success" : "error"}>{message}</p>
        ) : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Email"}
        </button>
      </form>
    </div>
  );
}
