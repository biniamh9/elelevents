import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import {
  CRM_STAGE_LABELS,
  filterCrmLeads,
  getAverageEventValue,
  getBookedRevenue,
  getConversionRate,
  getForecastedRevenue,
  getLikelyRevenue,
  getLostReasonMetrics,
  getPipelineStageCounts,
  getPipelineValue,
  getSourceMetrics,
} from "@/lib/crm-analytics";
import { buildRevenueTrend, getLiveCrmMetrics } from "@/lib/crm-live";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

type ExportTab = "dashboard" | "reports" | "leads" | "customers" | "revenue" | "tasks";

function escapeCsv(value: unknown) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return "No data available\n";
  }

  const columns = Object.keys(rows[0]);
  const lines = [
    columns.map(escapeCsv).join(","),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(",")),
  ];
  return lines.join("\n");
}

function normalizeTab(value: string | null): ExportTab {
  return ["dashboard", "reports", "leads", "customers", "revenue", "tasks"].includes(value ?? "")
    ? (value as ExportTab)
    : "dashboard";
}

export async function GET(request: Request) {
  const auth = await requireAdminApi("crm");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const tab = normalizeTab(searchParams.get("tab"));
  const filters = {
    q: searchParams.get("q") ?? undefined,
    stage: searchParams.get("stage") ?? undefined,
    eventType: searchParams.get("eventType") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    owner: searchParams.get("owner") ?? undefined,
    nextAction: searchParams.get("nextAction") ?? undefined,
    dateRange: searchParams.get("dateRange") ?? undefined,
    followUp: searchParams.get("followUp") ?? undefined,
  };

  const crmMetrics = await getLiveCrmMetrics(supabaseAdmin);
  const filteredLeads = filterCrmLeads(crmMetrics.leads, filters);
  const filteredLeadIds = new Set(filteredLeads.map((lead) => lead.id));
  const filteredTasks = crmMetrics.tasks.filter((task) => filteredLeadIds.has(task.leadId));
  const filteredInteractions = crmMetrics.interactions.filter((item) => filteredLeadIds.has(item.leadId));
  const revenueTrend = buildRevenueTrend(filteredLeads);
  const outstandingBalances = filteredLeads.reduce(
    (sum, lead) => sum + Number(lead.outstandingBalance ?? 0),
    0
  );

  let rows: Array<Record<string, unknown>> = [];

  switch (tab) {
    case "leads":
      rows = filteredLeads.map((lead) => ({
        Client: lead.clientName,
        Email: lead.email,
        Phone: lead.phone,
        "Event Type": lead.eventType,
        "Event Date": lead.eventDate,
        Venue: lead.venue,
        Stage: CRM_STAGE_LABELS[lead.stage],
        "Estimated Value": lead.estimatedValue,
        "Last Contact": lead.lastContact,
        "Next Follow-up": lead.nextFollowUp,
        Owner: lead.owner,
        "Next Action": lead.nextAction ?? "",
        "Next Action Due": lead.nextActionDueAt ?? "",
        Source: lead.source,
        "Budget Range": lead.budgetRange,
        "Quote Summary": lead.quoteSummary,
        "Payment Summary": lead.paymentSummary,
        "Contract Status": lead.contractStatus ?? "",
        "Payment Status": lead.paymentStatus ?? "",
        "Decor Status": lead.decorStatus ?? "",
      }));
      break;
    case "customers":
      rows = filteredLeads.map((lead) => ({
        Client: lead.clientName,
        "Event Type": lead.eventType,
        "Event Date": lead.eventDate,
        Venue: lead.venue,
        Owner: lead.owner,
        "Next Action": lead.nextAction ?? "",
        "Next Action Due": lead.nextActionDueAt ?? "",
        Stage: CRM_STAGE_LABELS[lead.stage],
        "Quote Summary": lead.quoteSummary,
        "Payment Summary": lead.paymentSummary,
        Notes: lead.notes.join(" | "),
      }));
      break;
    case "revenue":
      rows = revenueTrend.map((point) => ({
        Month: point.month,
        "Booked Revenue": point.value,
      }));
      rows.push({});
      rows.push({
        Summary: "Pipeline Value",
        Value: getPipelineValue(filteredLeads),
      });
      rows.push({
        Summary: "Forecasted Revenue",
        Value: getForecastedRevenue(filteredLeads),
      });
      rows.push({
        Summary: "Likely Revenue",
        Value: getLikelyRevenue(filteredLeads),
      });
      rows.push({
        Summary: "Booked Revenue",
        Value: getBookedRevenue(filteredLeads),
      });
      rows.push({
        Summary: "Outstanding Payments",
        Value: Math.round(outstandingBalances),
      });
      break;
    case "tasks":
      rows = filteredTasks.map((task) => {
        const lead = crmMetrics.leads.find((item) => item.id === task.leadId);
        return {
          Task: task.title,
          Status: task.status,
          "Due Label": task.dueLabel,
          Client: lead?.clientName ?? "",
          "Event Type": lead?.eventType ?? "",
          Owner: lead?.owner ?? "",
          Stage: lead ? CRM_STAGE_LABELS[lead.stage] : "",
        };
      });
      break;
    case "reports":
      rows = [
        ...getPipelineStageCounts(filteredLeads).map((item) => ({
          Section: "Pipeline Funnel",
          Label: item.label,
          Value: item.count,
        })),
        ...getSourceMetrics(filteredLeads).map((item) => ({
          Section: "Lead Source Performance",
          Label: item.source,
          Leads: item.leads,
          Booked: item.booked,
          Conversion: `${item.rate}%`,
        })),
        ...getLostReasonMetrics(filteredLeads).map((item) => ({
          Section: "Lost Lead Reasons",
          Label: item.reason,
          Value: item.count,
        })),
      ];
      break;
    case "dashboard":
    default:
      rows = [
        {
          Metric: "Active Leads",
          Value: filteredLeads.filter((lead) => lead.stage !== "lost").length,
          Detail: "Open relationships across inquiry to booking",
        },
        {
          Metric: "Hot Leads",
          Value: filteredLeads.filter((lead) =>
            ["consultation_scheduled", "consultation_completed", "quote_sent", "awaiting_deposit"].includes(lead.stage)
          ).length,
          Detail: "Needs timely follow-up this week",
        },
        {
          Metric: "Quotes Sent",
          Value: filteredLeads.filter((lead) => lead.stage === "quote_sent").length,
          Detail: "Currently under client review",
        },
        {
          Metric: "Conversion Rate",
          Value: `${getConversionRate(filteredLeads)}%`,
          Detail: "Inquiry to booked this cycle",
        },
        {
          Metric: "Pipeline Value",
          Value: getPipelineValue(filteredLeads),
          Detail: "Open opportunity value across active stages",
        },
        {
          Metric: "Forecasted Revenue",
          Value: getForecastedRevenue(filteredLeads),
          Detail: "Weighted projection based on lead temperature",
        },
        {
          Metric: "Booked Revenue",
          Value: getBookedRevenue(filteredLeads),
          Detail: "Confirmed event value associated with booked leads",
        },
        {
          Metric: "Outstanding Payments",
          Value: Math.round(outstandingBalances),
          Detail: "Deposits or balances still open",
        },
        {
          Metric: "Average Event Value",
          Value: getAverageEventValue(filteredLeads),
          Detail: "Average value of active opportunities",
        },
        {
          Metric: "Recent Interactions",
          Value: filteredInteractions.length,
          Detail: "Rolling CRM activity entries",
        },
      ];
      break;
  }

  const csv = toCsv(rows);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `crm-${tab}-report-${today}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
