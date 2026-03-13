export default function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
      new: "#f59e0b",
      contacted: "#3b82f6",
      quoted: "#8b5cf6",
      booked: "#16a34a",
      closed_lost: "#ef4444",
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
        }}
      >
        {status}
      </span>
    );
  }