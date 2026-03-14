"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminResetPasswordForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) {
        setReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!ready) {
      setMessage("This reset link is invalid or expired. Request a new one.");
      return;
    }

    if (password.length < 8) {
      setMessage("Use at least 8 characters for the new password.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated. Redirecting to admin login...");
    setLoading(false);

    window.setTimeout(() => {
      router.push("/admin/login");
      router.refresh();
    }, 1200);
  }

  return (
    <div className="card form-card" style={{ maxWidth: "520px", margin: "32px auto" }}>
      <h2>Create New Password</h2>
      <p className="muted">
        {ready
          ? "Enter the new password for your admin account."
          : "Checking your recovery link..."}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">New Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <div className="field">
          <label className="label">Confirm Password</label>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        {message ? (
          <p className={message.includes("updated") ? "success" : "error"}>{message}</p>
        ) : null}

        <button className="btn" type="submit" disabled={loading || !ready}>
          {loading ? "Updating..." : "Save New Password"}
        </button>
      </form>
    </div>
  );
}
