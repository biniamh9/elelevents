export type InquiryWorkspaceTab = "overview" | "pipeline" | "schedule" | "inquiries";

export type InquiryWorkspaceState = {
  status?: string;
  eventType?: string;
  followUp?: string;
  q?: string;
  sort?: string;
  page?: string | number;
};

export function buildInquiryWorkspaceHref({
  tab,
  state,
  nextStatus,
  nextFollowUp,
  preservePage = false,
}: {
  tab: InquiryWorkspaceTab;
  state?: InquiryWorkspaceState;
  nextStatus?: string;
  nextFollowUp?: string;
  preservePage?: boolean;
}) {
  const params = new URLSearchParams();
  params.set("tab", tab);

  if (tab === "inquiries") {
    if (state?.q) params.set("q", state.q);
    if (state?.eventType) params.set("event_type", state.eventType);
    if (state?.sort) params.set("sort", state.sort);
    if (nextStatus) params.set("status", nextStatus);
    if (nextFollowUp) params.set("follow_up", nextFollowUp);

    if (preservePage && state?.page) {
      const page = Number(state.page);
      if (Number.isFinite(page) && page > 1) {
        params.set("page", String(Math.floor(page)));
      }
    }
  }

  return `/admin/inquiries?${params.toString()}`;
}

export type CrmLeadsState = {
  q?: string;
  stage?: string;
  eventType?: string;
  source?: string;
  owner?: string;
  dateRange?: string;
  followUp?: string;
};

export function buildCrmLeadsHref({
  state,
  nextFollowUp,
}: {
  state?: CrmLeadsState;
  nextFollowUp?: string;
}) {
  const params = new URLSearchParams();
  params.set("tab", "leads");
  if (state?.q) params.set("q", state.q);
  if (state?.stage) params.set("stage", state.stage);
  if (state?.eventType) params.set("eventType", state.eventType);
  if (state?.source) params.set("source", state.source);
  if (state?.owner) params.set("owner", state.owner);
  if (state?.dateRange) params.set("dateRange", state.dateRange);
  if (nextFollowUp) params.set("followUp", nextFollowUp);
  return `/admin/crm-analytics?${params.toString()}`;
}

export type RentalWorkspaceTab = "requests" | "inventory";

export type RentalWorkspaceState = {
  tab?: RentalWorkspaceTab | string;
  status?: string;
};

export function buildRentalWorkspaceHref({
  state,
  nextTab,
  nextStatus,
}: {
  state?: RentalWorkspaceState;
  nextTab?: RentalWorkspaceTab;
  nextStatus?: string;
}) {
  const tab = nextTab ?? ((state?.tab as RentalWorkspaceTab | undefined) || "requests");
  const params = new URLSearchParams();

  if (tab !== "requests") {
    params.set("tab", tab);
  }

  if (tab === "requests" && nextStatus && nextStatus !== "all") {
    params.set("status", nextStatus);
  }

  const query = params.toString();
  return query ? `/admin/rentals?${query}` : "/admin/rentals";
}
