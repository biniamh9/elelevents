import type { CrmTask } from "@/lib/crm-analytics";
import type { RentalQuoteRequest } from "@/lib/rental-requests";

function formatDueLabel(value: string | null) {
  if (!value) {
    return "Follow-up needed";
  }

  const dueDate = new Date(value);
  const diffDays = Math.round((dueDate.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return `${Math.abs(diffDays)} day overdue`;
  if (diffDays === 0) return "Due today";
  return `Due ${dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function buildRentalFollowUpTasks(
  requests: RentalQuoteRequest[]
): CrmTask[] {
  return requests.flatMap((request) => {
    const href = `/admin/rentals/requests/${request.id}`;
    const baseDetail = `${request.first_name} ${request.last_name} · ${request.occasion_label || "Rental request"}`;

    if (request.status === "requested") {
      return [
        {
          id: `rental-task-review-${request.id}`,
          leadId: request.id,
          entityType: "rental_request",
          href,
          title: "Review rental request",
          status: "today",
          dueLabel: formatDueLabel(request.event_date),
          detail: `${baseDetail} · Confirm inventory and logistics`,
        },
      ];
    }

    if (request.status === "reviewing") {
      return [
        {
          id: `rental-task-quote-${request.id}`,
          leadId: request.id,
          entityType: "rental_request",
          href,
          title: "Prepare rental quote",
          status: "today",
          dueLabel: "Pricing review in progress",
          detail: `${baseDetail} · Build quantity and deposit quote`,
        },
      ];
    }

    if (request.status === "quoted") {
      return [
        {
          id: `rental-task-followup-${request.id}`,
          leadId: request.id,
          entityType: "rental_request",
          href,
          title: "Follow up on rental quote",
          status: "awaiting_reply",
          dueLabel: "Awaiting client reply",
          detail: `${baseDetail} · Quote sent, waiting on approval`,
        },
      ];
    }

    if (request.status === "reserved") {
      return [
        {
          id: `rental-task-fulfillment-${request.id}`,
          leadId: request.id,
          entityType: "rental_request",
          href,
          title: "Confirm rental fulfillment",
          status: "contract",
          dueLabel: formatDueLabel(request.event_date),
          detail: `${baseDetail} · Reserved and awaiting operational handoff`,
        },
      ];
    }

    return [] as CrmTask[];
  });
}
