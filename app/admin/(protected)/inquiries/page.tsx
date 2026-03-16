import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import StatusBadge from "@/components/forms/admin/status-badge";

export const dynamic = "force-dynamic";

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

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; event_type?: string }>;
}) {
  const params = await searchParams;
  const status = params.status || "";
  const eventType = params.event_type || "";
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  ).toISOString();
  const nowIso = new Date().toISOString();
  const nextSevenDaysIso = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  let query = supabaseAdmin
    .from("event_inquiries")
    .select(
      "id, created_at, first_name, last_name, email, phone, event_type, event_date, guest_count, venue_name, status, estimated_price, consultation_status, consultation_at, follow_up_at, quote_response_status"
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  const { data, error } = await query;

  const { count: totalCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true });

  const { count: newCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  const { count: contactedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "contacted");

  const { count: quotedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "quoted");

  const { count: bookedCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "booked");

  const { count: lostCount } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "closed_lost");

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

  const { data: avgInquiryRows } = await supabaseAdmin
    .from("event_inquiries")
    .select("estimated_price")
    .gte("created_at", startOfMonth)
    .lt("created_at", startOfNextMonth);

  const averageInquiryValue =
    avgInquiryRows && avgInquiryRows.length > 0
      ? avgInquiryRows.reduce(
          (sum, row) => sum + Number(row.estimated_price ?? 0),
          0
        ) / avgInquiryRows.length
      : 0;

  const { count: scheduledConsultations } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("consultation_status", "scheduled");

  const { count: followUpsDue } = await supabaseAdmin
    .from("event_inquiries")
    .select("*", { count: "exact", head: true })
    .not("follow_up_at", "is", null)
    .lte("follow_up_at", nextSevenDaysIso);

  const { data: upcomingConsultations } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, first_name, last_name, event_type, consultation_type, consultation_at")
    .eq("consultation_status", "scheduled")
    .not("consultation_at", "is", null)
    .gte("consultation_at", nowIso)
    .order("consultation_at", { ascending: true })
    .limit(5);

  const { data: followUpItems } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, first_name, last_name, event_type, follow_up_at, quote_response_status")
    .not("follow_up_at", "is", null)
    .lte("follow_up_at", nextSevenDaysIso)
    .order("follow_up_at", { ascending: true })
    .limit(5);

  const { data: recentInquiries } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, created_at, first_name, last_name, event_type, status, estimated_price")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentQuoted } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, created_at, first_name, last_name, event_type, estimated_price")
    .eq("status", "quoted")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentBooked } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, created_at, first_name, last_name, event_type, estimated_price")
    .eq("status", "booked")
    .order("created_at", { ascending: false })
    .limit(5);

  const statuses = ["new", "contacted", "quoted", "booked", "closed_lost"];
  const eventTypes = [
    "Wedding",
    "Traditional (Melsi)",
    "Birthday",
    "Baby Shower",
    "Corporate Event",
    "Graduation",
  ];

  const reportCards = [
    {
      label: "Open pipeline",
      value: `$${formatMoney(pipelineValue)}`,
      note: "Potential value across active leads",
    },
    {
      label: "Consultations",
      value: String(scheduledConsultations ?? 0),
      note: "Meetings currently scheduled",
    },
    {
      label: "Follow-ups",
      value: String(followUpsDue ?? 0),
      note: "Need attention in the next 7 days",
    },
    {
      label: "Booked this month",
      value: String(bookedThisMonth ?? 0),
      note: `${conversionRate.toFixed(1)}% conversion this month`,
    },
  ];

  const stageCards = [
    { label: "New", value: newCount ?? 0, share: buildShare(newCount, totalCount) },
    {
      label: "Contacted",
      value: contactedCount ?? 0,
      share: buildShare(contactedCount, totalCount),
    },
    { label: "Quoted", value: quotedCount ?? 0, share: buildShare(quotedCount, totalCount) },
    { label: "Booked", value: bookedCount ?? 0, share: buildShare(bookedCount, totalCount) },
    { label: "Lost", value: lostCount ?? 0, share: buildShare(lostCount, totalCount) },
  ];
  const boardStages = [
    { key: "new", label: "New", items: (data ?? []).filter((item) => item.status === "new") },
    {
      key: "contacted",
      label: "Contacted",
      items: (data ?? []).filter((item) => item.status === "contacted"),
    },
    {
      key: "quoted",
      label: "Quoted",
      items: (data ?? []).filter((item) => item.status === "quoted"),
    },
    {
      key: "booked",
      label: "Booked",
      items: (data ?? []).filter((item) => item.status === "booked"),
    },
  ];

  return (
    <main className="section admin-page">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Sales dashboard</p>
          <h1>Inquiries overview</h1>
          <p className="lead">
            Review new leads, consultation workload, quote progress, and booked
            business in one cleaner workspace.
          </p>
        </div>
        <div className="admin-page-head-aside">
          <span className="admin-head-pill">Total inquiries: {totalCount ?? 0}</span>
          <span className="admin-head-pill">Pipeline: ${formatMoney(pipelineValue)}</span>
          <span className="admin-head-pill">{conversionRate.toFixed(1)}% conversion</span>
        </div>
      </div>

      <section className="admin-mini-report">
        <div className="admin-section-title">
          <h3>Mini Report</h3>
          <p className="muted">The most useful numbers for today’s workflow.</p>
        </div>
        <div className="admin-kpi-grid admin-kpi-grid--compact">
          {reportCards.map((card) => (
            <div key={card.label} className="card metric-card metric-card--neutral">
              <p className="muted">{card.label}</p>
              <strong>{card.value}</strong>
              <span>{card.note}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="admin-dashboard-grid">
        <section className="card admin-panel admin-panel--wide">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Pipeline Overview</p>
              <h3>Where current leads are sitting</h3>
            </div>
          </div>

          <div className="admin-stage-grid">
            {stageCards.map((card) => (
              <div key={card.label} className="admin-stage-card">
                <div className="admin-stage-top">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
                <div className="admin-stage-bar">
                  <div style={{ width: `${card.share}%` }} />
                </div>
                <small>{card.share}% of all inquiries</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Performance</p>
              <h3>Revenue and conversion</h3>
            </div>
          </div>
          <div className="admin-list">
            <div className="admin-list-item">
              <strong>${formatMoney(bookedRevenueThisMonth)}</strong>
              <span>Booked revenue this month</span>
              <small>Confirmed business only</small>
            </div>
            <div className="admin-list-item">
              <strong>${formatMoney(averageInquiryValue)}</strong>
              <span>Average inquiry value</span>
              <small>Across this month’s incoming leads</small>
            </div>
            <div className="admin-list-item">
              <strong>{bookedCount ?? 0}</strong>
              <span>Total booked events</span>
              <small>{bookedThisMonth ?? 0} booked this month</small>
            </div>
          </div>
        </section>
      </div>

      <section className="admin-board-shell">
        <div className="admin-section-title">
          <h3>Lead Board</h3>
          <p className="muted">A faster way to see who needs attention next.</p>
        </div>
        <div className="admin-kanban-grid">
          {boardStages.map((stage) => (
            <div key={stage.key} className="card admin-kanban-column">
              <div className="admin-kanban-head">
                <div>
                  <p className="eyebrow">{stage.label}</p>
                  <h4>{stage.items.length} leads</h4>
                </div>
              </div>
              <div className="admin-kanban-list">
                {stage.items.length ? (
                  stage.items.slice(0, 5).map((item) => (
                    <Link
                      key={item.id}
                      href={`/admin/inquiries/${item.id}`}
                      className="admin-kanban-card"
                    >
                      <strong>
                        {item.first_name} {item.last_name}
                      </strong>
                      <span>{item.event_type}</span>
                      <small>
                        {item.event_date ?? "No event date"} · $
                        {formatMoney(Number(item.estimated_price ?? 0))}
                      </small>
                      <div className="summary-pills">
                        <span className="summary-chip">
                          {humanizeLabel(item.consultation_status ?? "not_scheduled")}
                        </span>
                        {item.follow_up_at ? (
                          <span className="summary-chip">
                            Follow-up {new Date(item.follow_up_at).toLocaleDateString()}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="muted">No leads in this stage.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="admin-board-grid">
        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Priority Queue</p>
              <h3>Upcoming consultations</h3>
            </div>
          </div>
          <div className="admin-list">
            {upcomingConsultations?.length ? (
              upcomingConsultations.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/inquiries/${item.id}`}
                  className="admin-list-item"
                >
                  <strong>{item.first_name} {item.last_name}</strong>
                  <span>{item.event_type}</span>
                  <small>
                    {item.consultation_type ?? "consultation"} ·{" "}
                    {item.consultation_at
                      ? new Date(item.consultation_at).toLocaleString()
                      : "No date"}
                  </small>
                </Link>
              ))
            ) : (
              <p className="muted">No upcoming consultations.</p>
            )}
          </div>
        </div>

        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Priority Queue</p>
              <h3>Follow-ups due soon</h3>
            </div>
          </div>
          <div className="admin-list">
            {followUpItems?.length ? (
              followUpItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/inquiries/${item.id}`}
                  className="admin-list-item"
                >
                  <strong>{item.first_name} {item.last_name}</strong>
                  <span>{item.event_type}</span>
                  <small>
                    {item.follow_up_at
                      ? new Date(item.follow_up_at).toLocaleString()
                      : "No follow-up"}{" "}
                    · {item.quote_response_status ?? "not_sent"}
                  </small>
                </Link>
              ))
            ) : (
              <p className="muted">No follow-ups due soon.</p>
            )}
          </div>
        </div>

        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Recent Activity</p>
              <h3>Newest inquiries</h3>
            </div>
          </div>
          <div className="admin-list">
            {recentInquiries?.length ? (
              recentInquiries.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/inquiries/${item.id}`}
                  className="admin-list-item"
                >
                  <strong>{item.first_name} {item.last_name}</strong>
                  <span>{item.event_type}</span>
                  <small>
                    {new Date(item.created_at).toLocaleDateString()} · $
                    {formatMoney(Number(item.estimated_price ?? 0))}
                  </small>
                </Link>
              ))
            ) : (
              <p className="muted">No recent inquiries.</p>
            )}
          </div>
        </div>

        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Recent Activity</p>
              <h3>Recently quoted</h3>
            </div>
          </div>
          <div className="admin-list">
            {recentQuoted?.length ? (
              recentQuoted.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/inquiries/${item.id}`}
                  className="admin-list-item"
                >
                  <strong>{item.first_name} {item.last_name}</strong>
                  <span>{item.event_type}</span>
                  <small>
                    {new Date(item.created_at).toLocaleDateString()} · $
                    {formatMoney(Number(item.estimated_price ?? 0))}
                  </small>
                </Link>
              ))
            ) : (
              <p className="muted">No quoted inquiries yet.</p>
            )}
          </div>
        </div>

        <div className="card admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Recent Activity</p>
              <h3>Recently booked</h3>
            </div>
          </div>
          <div className="admin-list">
            {recentBooked?.length ? (
              recentBooked.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/inquiries/${item.id}`}
                  className="admin-list-item"
                >
                  <strong>{item.first_name} {item.last_name}</strong>
                  <span>{item.event_type}</span>
                  <small>
                    {new Date(item.created_at).toLocaleDateString()} · $
                    {formatMoney(Number(item.estimated_price ?? 0))}
                  </small>
                </Link>
              ))
            ) : (
              <p className="muted">No booked inquiries yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card admin-table-card">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Lead Table</p>
            <h3>All inquiries</h3>
          </div>
        </div>

        <form method="GET" className="admin-filters">
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue={status} className="input">
              <option value="">All</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
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

          <button type="submit" className="btn">
            Filter
          </button>

          <Link href="/admin/inquiries" className="btn secondary">
            Reset
          </Link>
        </form>

        {error ? <p className="error">Failed to load inquiries: {error.message}</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Event Type</th>
                <th>Event Date</th>
                <th>Venue</th>
                <th>Status</th>
                <th>Consultation</th>
                <th>Follow-Up</th>
                <th>Estimate</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link
                      href={`/admin/inquiries/${row.id}`}
                      style={{ color: "#a74471", fontWeight: 600 }}
                    >
                      {row.first_name} {row.last_name}
                    </Link>
                    <div className="muted">{row.email}</div>
                    <div className="muted">{row.phone}</div>
                  </td>
                  <td>{row.event_type}</td>
                  <td>{row.event_date ?? "—"}</td>
                  <td>{row.venue_name ?? "—"}</td>
                  <td>
                    <StatusBadge status={row.status ?? "new"} />
                  </td>
                  <td>{row.consultation_status ?? "not_scheduled"}</td>
                  <td>
                    {row.follow_up_at
                      ? new Date(row.follow_up_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>${formatMoney(Number(row.estimated_price ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-mobile-records">
          {data?.map((row) => (
            <Link
              key={row.id}
              href={`/admin/inquiries/${row.id}`}
              className="admin-mobile-record"
            >
              <div className="admin-mobile-record-head">
                <div>
                  <strong>{row.first_name} {row.last_name}</strong>
                  <span>{row.event_type}</span>
                </div>
                <StatusBadge status={row.status ?? "new"} />
              </div>

              <div className="admin-mobile-record-grid">
                <p>
                  <span>Date</span>
                  {new Date(row.created_at).toLocaleDateString()}
                </p>
                <p>
                  <span>Event</span>
                  {row.event_date ?? "—"}
                </p>
                <p>
                  <span>Venue</span>
                  {row.venue_name ?? "—"}
                </p>
                <p>
                  <span>Estimate</span>${formatMoney(Number(row.estimated_price ?? 0))}
                </p>
                <p>
                  <span>Consultation</span>
                  {row.consultation_status ?? "not_scheduled"}
                </p>
                <p>
                  <span>Follow-up</span>
                  {row.follow_up_at
                    ? new Date(row.follow_up_at).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
