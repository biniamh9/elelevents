import { redirect } from "next/navigation";
import { buildCrmWorkspaceHref } from "@/lib/admin-navigation";
import { CrmPipelinePage } from "./crm-workspace-page";

export const dynamic = "force-dynamic";

export default async function AdminCrmAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    stage?: string;
    eventType?: string;
    source?: string;
    owner?: string;
    nextAction?: string;
    dateRange?: string;
    followUp?: string;
  }>;
}) {
  const params = await searchParams;
  const nextTab = params.tab === "dashboard" ? "pipeline" : params.tab || "pipeline";
  const pathname =
    nextTab === "leads"
      ? buildCrmWorkspaceHref("leads")
      : nextTab === "customers"
        ? buildCrmWorkspaceHref("customers")
        : nextTab === "tasks"
          ? buildCrmWorkspaceHref("tasks")
          : nextTab === "reports" || nextTab === "revenue"
            ? buildCrmWorkspaceHref("reports")
            : buildCrmWorkspaceHref("pipeline");

  const nextParams = new URLSearchParams();
  if (params.q) nextParams.set("q", params.q);
  if (params.stage) nextParams.set("stage", params.stage);
  if (params.eventType) nextParams.set("eventType", params.eventType);
  if (params.source) nextParams.set("source", params.source);
  if (params.owner) nextParams.set("owner", params.owner);
  if (params.nextAction) nextParams.set("nextAction", params.nextAction);
  if (params.dateRange) nextParams.set("dateRange", params.dateRange);
  if (params.followUp) nextParams.set("followUp", params.followUp);

  const query = nextParams.toString();
  if (params.tab && nextTab !== "pipeline") {
    redirect(query ? `${pathname}?${query}` : pathname);
  }

  return CrmPipelinePage();
}
