import Link from "next/link";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import {
  buildCrmCustomerDetailHref,
  buildCrmWorkspaceHref,
  buildEventProjectDetailHref,
} from "@/lib/admin-navigation";
import { requireAdminPage } from "@/lib/auth/admin";
import { getLiveCrmMetrics } from "@/lib/crm-live";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { getEventProjectSupport } from "@/lib/event-projects";

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return `$${value.toLocaleString()}`;
}

function formatDateOrFallback(value?: string | null) {
  if (!value) return "Date not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date not set";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminCrmCustomersRoute() {
  await requireAdminPage("crm");

  const crmMetrics = await getLiveCrmMetrics(supabaseAdmin);
  const inquiryIds = crmMetrics.leads.map((lead) => lead.id);
  const projectSupport = await getEventProjectSupport(supabaseAdmin);
  const eventProjects =
    projectSupport.projectsTable && inquiryIds.length
      ? (
          await supabaseAdmin
            .from("event_projects")
            .select("id, inquiry_id, project_name")
            .in("inquiry_id", inquiryIds)
        ).data ?? []
      : [];
  const projectByInquiryId = new Map(
    eventProjects
      .filter((project) => project.inquiry_id)
      .map((project) => [project.inquiry_id as string, project])
  );

  const customerRoster = Array.from(
    crmMetrics.leads.reduce((map, lead) => {
      const customerKey = lead.clientId || lead.email.toLowerCase() || lead.id;
      const current = map.get(customerKey);

      if (current) {
        current.opportunities.push(lead);
        current.outstandingBalance += Number(lead.outstandingBalance ?? 0);
        if (lead.stage === "booked") current.bookedCount += 1;
        if (!["booked", "lost"].includes(lead.stage)) current.activeCount += 1;
        if (!current.latestEventDate || new Date(lead.eventDate) > new Date(current.latestEventDate)) {
          current.latestEventDate = lead.eventDate;
          current.primaryLead = lead;
        }
        return map;
      }

      map.set(customerKey, {
        key: customerKey,
        clientName: lead.clientName,
        email: lead.email,
        phone: lead.phone,
        owner: lead.owner,
        nextAction: lead.nextAction || "Not set",
        nextActionDueAt: lead.nextActionDueAt ?? null,
        latestEventDate: lead.eventDate,
        outstandingBalance: Number(lead.outstandingBalance ?? 0),
        bookedCount: lead.stage === "booked" ? 1 : 0,
        activeCount: ["booked", "lost"].includes(lead.stage) ? 0 : 1,
        primaryLead: lead,
        opportunities: [lead],
      });
      return map;
    }, new Map())
  )
    .map(([, value]) => value)
    .sort((a, b) => {
      if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
      return new Date(b.latestEventDate).getTime() - new Date(a.latestEventDate).getTime();
    });

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>CRM Customers</h1>
          <p>Use customers as the durable relationship center across opportunities, projects, documents, payments, and account history.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href={buildCrmWorkspaceHref("pipeline")} className="admin-head-pill">Open pipeline</Link>
          <Link href={buildCrmWorkspaceHref("leads")} className="admin-head-pill">Open leads</Link>
          <Link href={buildCrmWorkspaceHref("tasks")} className="admin-head-pill">Open tasks</Link>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Customers are the relationship center. The latest opportunity and project record remain linked, but the account stays durable across repeat events and financial history.
        </p>
      </section>

      <section className="card admin-section-card admin-panel admin-panel--wide">
        <AdminSectionHeader
          eyebrow="Customer center"
          title="Customer and event portfolio"
          description="Group active opportunities, booked work, and outstanding balances around the customer rather than treating every inquiry as an isolated record."
        />
        <div className="crm-customer-grid">
          {customerRoster.map((customer: {
            key: string;
            clientName: string;
            email: string;
            phone: string;
            owner: string;
            nextAction: string;
            nextActionDueAt: string | null;
            latestEventDate: string;
            outstandingBalance: number;
            bookedCount: number;
            activeCount: number;
            primaryLead: {
              clientId?: string | null;
              id: string;
              eventType: string;
            };
          }) => (
            <Link
              key={customer.key}
              href={
                customer.primaryLead.clientId
                  ? buildCrmCustomerDetailHref(customer.primaryLead.clientId)
                  : buildEventProjectDetailHref(
                      projectByInquiryId.get(customer.primaryLead.id)?.id || customer.primaryLead.id
                    )
              }
              className="crm-customer-card"
            >
              <strong>{customer.clientName}</strong>
              <span>
                {customer.activeCount} active · {customer.bookedCount} booked · {formatMoney(Math.round(customer.outstandingBalance))} open
              </span>
              <small>
                {customer.primaryLead.eventType} · {formatDateOrFallback(customer.latestEventDate)} · {customer.owner}
              </small>
              <small>
                Next: {customer.nextAction}
                {customer.nextActionDueAt ? ` · due ${formatDateOrFallback(customer.nextActionDueAt)}` : ""}
              </small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
