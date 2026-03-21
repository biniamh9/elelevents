import Link from "next/link";
import InquiryRecordActions from "@/components/forms/admin/inquiry-record-actions";
import { humanizeBookingStage } from "@/lib/booking-lifecycle";
import StatusBadge from "@/components/forms/admin/status-badge";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function buildShare(count: number | null | undefined, total: number | null | undefined) {
  if (!count || !total) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

function humanizeLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizePage(pageValue?: string) {
  const page = Number(pageValue ?? 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getPaymentState(contract: {
  deposit_paid?: boolean | null;
  balance_due?: number | null;
  contract_status?: string | null;
} | null) {
  if (!contract) {
    return "No contract";
  }

  if (!contract.deposit_paid) {
    return "Deposit pending";
  }

  if (Number(contract.balance_due ?? 0) > 0) {
    return "Balance due";
  }

  return "Paid";
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    event_type?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const status = params.status || "";
  const eventType = params.event_type || "";
  const queryText = params.q?.trim() || "";
  const sort = params.sort || "newest";
  const page = normalizePage(params.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  ).toISOString();

  let query = supabaseAdmin
    .from("event_inquiries")
    .select(
      "id, created_at, first_name, last_name, email, phone, event_type, event_date, guest_count, venue_name, status, booking_stage, estimated_price, consultation_status, consultation_at, quote_response_status",
      { count: "exact" }
    )
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  if (queryText) {
    const safeQuery = queryText.replace(/,/g, " ");
    query = query.or(
      `first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%,phone.ilike.%${safeQuery}%,venue_name.ilike.%${safeQuery}%`
    );
  }

  if (sort === "event_date") {
    query = query.order("event_date", { ascending: true, nullsFirst: false });
  } else if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count: filteredCount } = await query;
  const inquiryIds = (data ?? []).map((item) => item.id);

  const { data: pageContracts } = inquiryIds.length
    ? await supabaseAdmin
        .from("contracts")
        .select("id, inquiry_id, contract_status, deposit_paid, balance_due")
        .in("inquiry_id", inquiryIds)
    : {
        data: [] as Array<{
          id: string;
          inquiry_id: string;
          contract_status: string | null;
          deposit_paid: boolean | null;
          balance_due: number | null;
        }>,
      };

  const contractMap = new Map((pageContracts ?? []).map((item) => [item.inquiry_id, item]));

  const { count: totalCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true });

  const { count: pendingCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .in("status", ["new", "contacted"]);

  const { count: quotedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "quoted");

  const { count: bookedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "booked");

  const { count: underReviewCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("consultation_status", "under_review");

  const { count: scheduledConsultationCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .not("consultation_at", "is", null);

  const { count: reservedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("booking_stage", "reserved");

  const { count: outstandingFinalPayments } = await supabaseAdmin
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .gt("balance_due", 0);

  const { data: pipelineRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("estimated_price, status")
    .in("status", ["new", "contacted", "quoted", "booked"]);

  const pipelineValue =
    pipelineRows?.reduce((sum, row) => sum + Number(row.estimated_price ?? 0), 0) ?? 0;

  const { count: inquiriesThisMonth } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const { count: bookedThisMonth } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "booked")
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const conversionRate =
    inquiriesThisMonth && inquiriesThisMonth > 0
      ? ((bookedThisMonth ?? 0) / inquiriesThisMonth) * 100
      : 0;

  const { data: bookedRevenueRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("estimated_price")
    .eq("status", "booked")
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const bookedRevenueThisMonth =
    bookedRevenueRows?.reduce((sum, row) => sum + Number(row.estimated_price ?? 0), 0) ??
    0;

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  const upcomingWindow = new Date(tomorrow);
  upcomingWindow.setDate(upcomingWindow.getDate() + 14);

  const { data: upcomingConsultations } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, first_name, last_name, event_type, event_date, consultation_at, consultation_type, consultation_location")
    .not("consultation_at", "is", null)
    .gte("consultation_at", tomorrow.toISOString())
    .lt("consultation_at", upcomingWindow.toISOString())
    .order("consultation_at", { ascending: true })
    .limit(6);

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .split("T")[0];

  const { data: monthEvents } = await supabaseAdmin
    .from("event_inquiries")
    .select("event_date")
    .gte("event_date", currentMonthStart)
    .lt("event_date", currentMonthEnd)
    .order("event_date", { ascending: true });

  const loadByDate = new Map<string, number>();
  for (const item of monthEvents ?? []) {
    if (!item.event_date) continue;
    loadByDate.set(item.event_date, (loadByDate.get(item.event_date) ?? 0) + 1);
  }

  const busiestDates = Array.from(loadByDate.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5);

  const alerts: Array<{ tone: "warning" | "attention" | "info"; label: string; detail: string }> = [];

  if ((upcomingConsultations ?? []).some((item) => item.consultation_type === "in_person" && !item.consultation_location)) {
    alerts.push({
      tone: "warning",
      label: "Missing meeting location",
      detail: "At least one upcoming in-person consultation is missing a location.",
    });
  }

  if (busiestDates.some(([, count]) => count >= 2)) {
    alerts.push({
      tone: "attention",
      label: "Overlapping event dates",
      detail: "Some upcoming dates already carry multiple events. Review calendar load before confirming more bookings.",
    });
  }

  if ((quotedCount ?? 0) > 0) {
    alerts.push({
      tone: "info",
      label: "Pending quote follow-up",
      detail: `${quotedCount} quoted request${quotedCount === 1 ? "" : "s"} still need movement toward contract.`,
    });
  }

  if ((outstandingFinalPayments ?? 0) > 0) {
    alerts.push({
      tone: "warning",
      label: "Outstanding payments",
      detail: `${outstandingFinalPayments} contract${outstandingFinalPayments === 1 ? "" : "s"} still have remaining balance due.`,
    });
  }

  const statuses = ["new", "contacted", "quoted", "booked", "closed_lost"];
  const eventTypes = [
    "Wedding",
    "Traditional (Melsi)",
    "Birthday",
    "Baby Shower",
    "Bridal Shower",
    "Corporate Event",
    "Graduation",
    "Anniversary",
  ];

  const reportCards = [
    {
      label: "New Requests",
      value: String(pendingCount ?? 0),
      note: `${buildShare(pendingCount, totalCount)}% of all inquiries`,
      tone: "amber",
    },
    {
      label: "Under Review",
      value: String(underReviewCount ?? 0),
      note: "Consultations waiting on approval",
      tone: "blue",
    },
    {
      label: "Consultations Scheduled",
      value: String(scheduledConsultationCount ?? 0),
      note: "Meetings currently on the calendar",
      tone: "violet",
    },
    {
      label: "Reserved Dates",
      value: String(reservedCount ?? 0),
      note: `${bookedCount ?? 0} booked • ${conversionRate.toFixed(1)}% conversion this month`,
      tone: "green",
    },
    {
      label: "Outstanding Final Payments",
      value: String(outstandingFinalPayments ?? 0),
      note: `Revenue this month: $${formatMoney(bookedRevenueThisMonth)} • Pipeline: $${formatMoney(pipelineValue)}`,
      tone: "red",
    },
  ];

  const totalPages = Math.max(1, Math.ceil((filteredCount ?? 0) / PAGE_SIZE));
  const previousPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  function buildPageHref(nextPageValue: number) {
    const nextParams = new URLSearchParams();
    if (status) nextParams.set("status", status);
    if (eventType) nextParams.set("event_type", eventType);
    if (queryText) nextParams.set("q", queryText);
    if (sort) nextParams.set("sort", sort);
    if (nextPageValue > 1) nextParams.set("page", String(nextPageValue));
    const queryString = nextParams.toString();
    return queryString ? `/admin/inquiries?${queryString}` : "/admin/inquiries";
  }

  return (
    <main className="section admin-page">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Operations dashboard</p>
          <h1>Inquiries</h1>
          <p className="lead">
            Track new requests, consultation load, reserved dates, quotes, and payments from one operations view.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Showing: {filteredCount ?? 0}</span>
          <span className="admin-head-pill">Pipeline: ${formatMoney(pipelineValue)}</span>
          <span className="admin-head-pill">{conversionRate.toFixed(1)}% conversion</span>
        </div>
      </div>

      <section className="admin-mini-report">
        <div className="admin-section-title">
          <h3>Summary</h3>
          <p className="muted">Top-line numbers for the parts of the booking lifecycle that need attention first.</p>
        </div>
        <div className="admin-kpi-grid">
          {reportCards.map((card) => (
            <div key={card.label} className={`card metric-card metric-card--${card.tone}`}>
              <p className="muted">{card.label}</p>
              <strong>{card.value}</strong>
              <span>{card.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-dashboard-grid">
        <div className="card admin-panel admin-panel--wide">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Schedule focus</p>
              <h3>Consultations and reserved dates</h3>
            </div>
            <div className="admin-inline-actions">
              <Link href="/admin/calendar" className="admin-topbar-pill">
                Calendar View
              </Link>
              <Link href="/admin/inquiries?sort=event_date" className="admin-topbar-pill">
                List View
              </Link>
            </div>
          </div>

          <div className="admin-schedule-board">
            <div className="admin-schedule-column">
              <strong className="admin-schedule-heading">Upcoming consultations</strong>
              {(upcomingConsultations ?? []).length ? (
                <div className="admin-schedule-list">
                  {upcomingConsultations?.map((item) => (
                    <Link key={item.id} href={`/admin/inquiries/${item.id}`} className="admin-schedule-item">
                      <div>
                        <strong>{item.first_name} {item.last_name}</strong>
                        <p>{item.event_type || "Event"} {item.event_date ? `• ${new Date(item.event_date).toLocaleDateString()}` : ""}</p>
                      </div>
                      <span>{formatDateTime(item.consultation_at)}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="muted">No consultations scheduled in the next two weeks.</p>
              )}
            </div>

            <div className="admin-schedule-column">
              <strong className="admin-schedule-heading">Busiest reserved dates this month</strong>
              {busiestDates.length ? (
                <div className="admin-date-load-list">
                  {busiestDates.map(([date, count]) => (
                    <div key={date} className={`admin-date-load admin-date-load--${count >= 3 ? "high" : count === 2 ? "medium" : "low"}`}>
                      <div>
                        <strong>{new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong>
                        <p>{count} booking{count === 1 ? "" : "s"} on the calendar</p>
                      </div>
                      <span>{count >= 3 ? "High Load" : count === 2 ? "Double Booking" : "Reserved"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No reserved dates are carrying visible load this month.</p>
              )}
            </div>
          </div>
        </div>

        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Alerts</p>
              <h3>What needs attention now</h3>
            </div>
          </div>

          <div className="admin-alert-stack">
            {alerts.length ? (
              alerts.map((alert) => (
                <div key={alert.label} className={`admin-alert-card admin-alert-card--${alert.tone}`}>
                  <strong>{alert.label}</strong>
                  <p>{alert.detail}</p>
                </div>
              ))
            ) : (
              <div className="admin-alert-card admin-alert-card--success">
                <strong>Operations look clear</strong>
                <p>No immediate consultation, booking-load, or payment alerts are blocking the workflow right now.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="card admin-table-card admin-records-table-card">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Inquiry Records</p>
            <h3>Manage the existing records</h3>
          </div>
        </div>

        <form method="GET" className="admin-filters admin-filters--records">
          <div className="field">
            <label className="label">Search</label>
            <input
              name="q"
              defaultValue={queryText}
              className="input"
              placeholder="Client, email, phone, or venue"
            />
          </div>

          <div className="field">
            <label className="label">Status</label>
            <select name="status" defaultValue={status} className="input">
              <option value="">All</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {humanizeLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Event Type</label>
            <select name="event_type" defaultValue={eventType} className="input">
              <option value="">All</option>
              {eventTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Sort By</label>
            <select name="sort" defaultValue={sort} className="input">
              <option value="newest">Created date: newest</option>
              <option value="oldest">Created date: oldest</option>
              <option value="event_date">Event date</option>
            </select>
          </div>

          <div className="admin-filter-actions">
            <button type="submit" className="btn">
              Apply
            </button>
            <Link href="/admin/inquiries" className="btn secondary">
              Reset
            </Link>
          </div>
        </form>

        {error ? <p className="error">Failed to load inquiries: {error.message}</p> : null}

        <div className="table-wrap admin-records-table-wrap">
          <table className="admin-records-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Event Type</th>
                <th>Event Date</th>
                <th>Consultation Date</th>
                <th>Status</th>
                <th>Quote</th>
                <th>Payment</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.length ? (
                data.map((row) => {
                  const contract = contractMap.get(row.id) ?? null;

                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="admin-record-main">
                          <strong>
                            {row.first_name} {row.last_name}
                          </strong>
                          <span>{row.email}</span>
                          <span>{row.phone}</span>
                        </div>
                      </td>
                      <td>{row.event_type}</td>
                      <td>{row.event_date ? new Date(row.event_date).toLocaleDateString() : "—"}</td>
                      <td>{formatDateTime(row.consultation_at)}</td>
                      <td>
                        <div className="admin-record-status-stack">
                          <StatusBadge status={row.status ?? "new"} />
                          <span className="admin-record-substatus">
                            {humanizeBookingStage(row.booking_stage)} • {humanizeLabel(row.consultation_status ?? "not_scheduled")}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-record-main">
                          <strong>${formatMoney(Number(row.estimated_price ?? 0))}</strong>
                          <span>{row.quote_response_status ? humanizeLabel(row.quote_response_status) : "Not sent"}</span>
                          <span>{row.venue_name ?? "Venue not added"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-record-main">
                          <strong>{getPaymentState(contract)}</strong>
                          <span>{contract?.contract_status ? humanizeLabel(contract.contract_status) : "Contract not created"}</span>
                        </div>
                      </td>
                      <td>{new Date(row.created_at).toLocaleDateString()}</td>
                      <td>
                        <InquiryRecordActions
                          inquiryId={row.id}
                          contractId={contract?.id ?? null}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="admin-records-empty">
                    No inquiry records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-mobile-records">
          {data?.map((row) => {
            const contract = contractMap.get(row.id) ?? null;

            return (
              <div key={row.id} className="admin-mobile-record">
                <div className="admin-mobile-record-head">
                  <div>
                    <strong>{row.first_name} {row.last_name}</strong>
                    <span>{row.event_type}</span>
                  </div>
                  <StatusBadge status={row.status ?? "new"} />
                </div>

                <div className="admin-mobile-record-grid">
                  <p>
                    <span>Event date</span>
                    {row.event_date ? new Date(row.event_date).toLocaleDateString() : "—"}
                  </p>
                  <p>
                    <span>Consultation</span>
                    {formatDateTime(row.consultation_at)}
                  </p>
                  <p>
                    <span>Booking</span>
                    {humanizeBookingStage(row.booking_stage)}
                  </p>
                  <p>
                    <span>Quote</span>
                    ${formatMoney(Number(row.estimated_price ?? 0))}
                  </p>
                  <p>
                    <span>Payment</span>
                    {getPaymentState(contract)}
                  </p>
                  <p>
                    <span>Created</span>
                    {new Date(row.created_at).toLocaleDateString()}
                  </p>
                </div>

                <InquiryRecordActions
                  inquiryId={row.id}
                  contractId={contract?.id ?? null}
                />
              </div>
            );
          })}
        </div>

        <div className="admin-table-pagination">
          <p className="muted">
            Page {page} of {totalPages}
          </p>
          <div className="admin-package-actions">
            {previousPage ? (
              <Link href={buildPageHref(previousPage)} className="btn secondary">
                Previous
              </Link>
            ) : null}
            {nextPage ? (
              <Link href={buildPageHref(nextPage)} className="btn secondary">
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
