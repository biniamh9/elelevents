"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function VendorLoginForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/vendors/dashboard");
    router.refresh();
  }

  return (
    <div className="card form-card" style={{ maxWidth: "520px", margin: "32px auto" }}>
      <h2>Vendor Sign In</h2>
      <p className="muted">
        Approved referral partners can review and respond to leads here.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="field">
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <p style={{ marginTop: "-4px", marginBottom: "18px" }}>
          <Link href="/vendors/apply" className="link-inline">
            Need an account? Apply as a vendor partner
          </Link>
        </p>

        {message ? <p className="error">{message}</p> : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
