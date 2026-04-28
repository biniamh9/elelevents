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
  nextAction?: string;
  dateRange?: string;
  followUp?: string;
};

export function buildCrmLeadsHref({
  state,
  nextFollowUp,
  nextAction,
}: {
  state?: CrmLeadsState;
  nextFollowUp?: string;
  nextAction?: string;
}) {
  const params = new URLSearchParams();
  params.set("tab", "leads");
  if (state?.q) params.set("q", state.q);
  if (state?.stage) params.set("stage", state.stage);
  if (state?.eventType) params.set("eventType", state.eventType);
  if (state?.source) params.set("source", state.source);
  if (state?.owner) params.set("owner", state.owner);
  if (nextAction ?? state?.nextAction) {
    params.set("nextAction", nextAction ?? state?.nextAction ?? "");
  }
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

export type ContractQueue =
  | "all"
  | "draft"
  | "sent"
  | "signed"
  | "unsigned"
  | "deposit_pending";

export function buildContractsWorkspaceHref({
  queue,
}: {
  queue?: ContractQueue;
}) {
  const params = new URLSearchParams();
  if (queue && queue !== "all") {
    params.set("queue", queue);
  }
  const query = params.toString();
  return query ? `/admin/contracts?${query}` : "/admin/contracts";
}

export function buildContractDetailHref(id: string) {
  return `/admin/contracts/${id}`;
}

export function buildInquiryDetailHref(id: string) {
  return `/admin/inquiries/${id}`;
}

export function buildInquiryItemizedDraftHref(id: string) {
  return `/admin/inquiries/${id}/itemized-draft`;
}

export function buildUnmatchedReplyReviewHref({
  status,
  replyId,
}: {
  status?: "pending_review" | "resolved" | "ignored";
  replyId?: string | null;
} = {}) {
  const params = new URLSearchParams();
  if (status && status !== "pending_review") {
    params.set("status", status);
  }
  if (replyId) {
    params.set("reply", replyId);
  }
  const query = params.toString();
  return query ? `/admin/inquiries/reply-review?${query}` : "/admin/inquiries/reply-review";
}

export function buildCrmLeadDetailHref(id: string) {
  return `/admin/crm-analytics/${id}`;
}

export function buildRentalRequestDetailHref(id: string) {
  return `/admin/rentals/requests/${id}`;
}

export function buildRentalItemDetailHref(id: string) {
  return `/admin/rentals/${id}`;
}

export type AdminDocumentType = "quote" | "invoice" | "receipt";

export function buildRentalItemCreateHref() {
  return "/admin/rentals/new";
}

export function buildDocumentCreateHref({
  type,
  inquiryId,
  contractId,
}: {
  type?: AdminDocumentType;
  inquiryId?: string | null;
  contractId?: string | null;
}) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (inquiryId) params.set("inquiryId", inquiryId);
  if (contractId) params.set("contractId", contractId);
  const query = params.toString();
  return query ? `/admin/documents/new?${query}` : "/admin/documents/new";
}

export function buildQuoteCreateHref({
  inquiryId,
}: {
  inquiryId?: string | null;
} = {}) {
  return buildDocumentCreateHref({ type: "quote", inquiryId });
}

export function buildInvoiceCreateHref({
  inquiryId,
  contractId,
}: {
  inquiryId?: string | null;
  contractId?: string | null;
} = {}) {
  return buildDocumentCreateHref({ type: "invoice", inquiryId, contractId });
}
