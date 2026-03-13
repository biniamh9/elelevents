export default function ContractStatusBadge({
    status,
  }: {
    status: string;
  }) {
    const styles: Record<string, string> = {
      draft: "#6b7280",
      sent: "#3b82f6",
      signed: "#8b5cf6",
      deposit_paid: "#16a34a",
      closed: "#111827",
    };
  
    const color = styles[status] || "#6b7280";
  
    return (
      <span
        style={{
          background: color,
          color: "white",
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: 600,
          display: "inline-block",
        }}
      >
        {status}
      </span>
    );
  }