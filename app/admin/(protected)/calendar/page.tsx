import Link from "next/link";
import { deriveBookingStage, getBookingWarningLabel, humanizeBookingStage } from "@/lib/booking-lifecycle";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

function getMonthAnchor(value?: string) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return new Date(`${value}-01T00:00:00`);
  }

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function formatMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const monthAnchor = getMonthAnchor(params.month);
  const monthStart = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const monthEnd = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1);

  const { data: inquiries } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, first_name, last_name, event_type, event_date, venue_name, booking_stage, status, consultation_status, quote_response_status, completed_at")
    .gte("event_date", monthStart.toISOString().split("T")[0])
    .lt("event_date", monthEnd.toISOString().split("T")[0])
    .order("event_date", { ascending: true });

  const { data: contracts } = await supabaseAdmin
    .from("contracts")
    .select("inquiry_id, contract_status, deposit_paid")
    .gte("event_date", monthStart.toISOString().split("T")[0])
    .lt("event_date", monthEnd.toISOString().split("T")[0]);

  const contractMap = new Map(
    (contracts ?? []).map((contract) => [contract.inquiry_id, contract])
  );

  const grouped = new Map<string, typeof inquiries>();
  for (const inquiry of inquiries ?? []) {
    const key = inquiry.event_date ?? "";
    const bucket = grouped.get(key) ?? [];
    bucket.push(inquiry);
    grouped.set(key, bucket);
  }

  const days = Array.from(grouped.entries()).map(([date, items]) => ({
    date,
    warning: getBookingWarningLabel(Math.max(items.length - 1, 0)),
    items: items.map((item) => {
      const contract = contractMap.get(item.id);
      return {
        ...item,
        lifecycle: deriveBookingStage({
          bookingStage: item.booking_stage,
          inquiryStatus: item.status,
          consultationStatus: item.consultation_status,
          quoteResponseStatus: item.quote_response_status,
          contractStatus: contract?.contract_status,
          depositPaid: contract?.deposit_paid,
          completedAt: item.completed_at,
        }),
      };
    }),
  }));

  const previousMonth = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1);
  const nextMonth = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1);

  return (
    <main className="section admin-page">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Booking calendar</p>
          <h1>Calendar</h1>
          <p className="lead">Track event dates, booking load, and same-day conflicts at a glance.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href={`/admin/calendar?month=${formatMonthParam(previousMonth)}`} className="admin-topbar-pill">
            Previous Month
          </Link>
          <span className="admin-head-pill">
            {monthAnchor.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </span>
          <Link href={`/admin/calendar?month=${formatMonthParam(nextMonth)}`} className="admin-topbar-pill">
            Next Month
          </Link>
        </div>
      </div>

      <div className="card admin-table-card admin-calendar-card">
        <div className="admin-panel-head">
          <div>
            <p className="eyebrow">Monthly event load</p>
            <h3>All events by day</h3>
          </div>
        </div>

        <div className="admin-calendar-list">
          {days.length ? (
            days.map((day) => (
              <section key={day.date} className="admin-calendar-day">
                <div className="admin-calendar-day-head">
                  <div>
                    <strong>{new Date(`${day.date}T00:00:00`).toLocaleDateString()}</strong>
                    <span>{day.items.length} event{day.items.length === 1 ? "" : "s"}</span>
                  </div>
                  {day.warning ? (
                    <span className="admin-calendar-warning">{day.warning}</span>
                  ) : null}
                </div>

                <div className="admin-calendar-day-list">
                  {day.items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/admin/inquiries/${item.id}`}
                      className="admin-calendar-entry"
                    >
                      <div>
                        <strong>{item.first_name} {item.last_name}</strong>
                        <p>{item.event_type || "Event"}{item.venue_name ? ` • ${item.venue_name}` : ""}</p>
                      </div>
                      <span>{humanizeBookingStage(item.lifecycle)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <p className="muted">No events with dates are scheduled in this month yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
