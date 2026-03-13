"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateContractButton({
  inquiryId,
}: {
  inquiryId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreate() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/admin/contracts/from-inquiry/${inquiryId}`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to create contract.");
        setLoading(false);
        return;
      }

      router.push(`/admin/contracts/${data.contract.id}`);
    } catch (error) {
      setMessage("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: "16px" }}>
      <button
        type="button"
        className="btn"
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Contract from Inquiry"}
      </button>

      {message ? <p style={{ marginTop: "12px" }}>{message}</p> : null}
    </div>
  );
}