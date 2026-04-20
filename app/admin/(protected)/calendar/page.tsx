import Link from "next/link";
import {
  deriveBookingStage,
  getBookingWarningLabel,
  humanizeBookingStage,
} from "@/lib/booking-lifecycle";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import AdminSectionHeader from "@/components/admin/admin-section-header";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string }>;
}) {
  const params = await searchParams;
  const monthAnchor = getMonthAnchor(params.month);
  const view = params.view === "list" ? "list" : "calendar";
  const monthStart = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const monthEnd = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1);

  const { data: inquiries } = await supabaseAdmin
    .from("event_inquiries")
    .select(
      "id, first_name, last_name, event_type, event_date, venue_name, booking_stage, status, consultation_status, quote_response_status, completed_at"
    )
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

  const grouped = new Map<
    string,
    Array<{
      id: string;
      first_name: string;
      last_name: string;
      event_type: string | null;
      venue_name: string | null;
      lifecycle: string;
    }>
  >();

  for (const inquiry of inquiries ?? []) {
    if (!inquiry.event_date) {
      continue;
    }

    const contract = contractMap.get(inquiry.id);
    const lifecycle = deriveBookingStage({
      bookingStage: inquiry.booking_stage,
      inquiryStatus: inquiry.status,
      consultationStatus: inquiry.consultation_status,
      quoteResponseStatus: inquiry.quote_response_status,
      contractStatus: contract?.contract_status,
      depositPaid: contract?.deposit_paid,
      completedAt: inquiry.completed_at,
    });

    const bucket = grouped.get(inquiry.event_date) ?? [];
    bucket.push({
      id: inquiry.id,
      first_name: inquiry.first_name,
      last_name: inquiry.last_name,
      event_type: inquiry.event_type,
      venue_name: inquiry.venue_name,
      lifecycle,
    });
    grouped.set(inquiry.event_date, bucket);
  }

  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());

  const calendarEnd = new Date(monthEnd);
  const trailingDays = 6 - calendarEnd.getDay();
  calendarEnd.setDate(calendarEnd.getDate() + trailingDays);

  const days = [];
  for (
    const cursor = new Date(calendarStart);
    cursor <= calendarEnd;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const date = new Date(cursor);
    const key = formatDateKey(date);
    const items = grouped.get(key) ?? [];
    const reservedCount = items.filter((item) =>
      ["reserved", "signed_deposit_paid", "completed"].includes(item.lifecycle)
    ).length;

    days.push({
      key,
      date,
      isCurrentMonth: date.getMonth() === monthAnchor.getMonth(),
      isToday: key === formatDateKey(new Date()),
      warning: getBookingWarningLabel(Math.max(items.length - 1, 0)),
      items,
      reservedCount,
      loadTone:
        items.length >= 3 ? "high" : items.length === 2 ? "medium" : items.length === 1 ? "low" : "empty",
    });
  }

  const previousMonth = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1);
  const nextMonth = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1);
  const todayMonth = new Date();
  const quickMonths = Array.from({ length: 5 }, (_, index) => {
    const offset = index - 2;
    return new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + offset, 1);
  });

  return (
    <main className="section admin-page admin-page--workspace">
      <AdminPageIntro
        title="Calendar"
        description="See event dates on a real monthly calendar and spot reserved days immediately."
        aside={
          <>
            <Link
              href={`/admin/calendar?month=${formatMonthParam(monthAnchor)}&view=calendar`}
              className={`admin-topbar-pill${view === "calendar" ? " is-active" : ""}`}
            >
              Calendar View
            </Link>
            <Link
              href={`/admin/calendar?month=${formatMonthParam(monthAnchor)}&view=list`}
              className={`admin-topbar-pill${view === "list" ? " is-active" : ""}`}
            >
              List View
            </Link>
            <Link
              href={`/admin/calendar?month=${formatMonthParam(previousMonth)}`}
              className="admin-topbar-pill"
            >
              Previous Month
            </Link>
            <span className="admin-head-pill">
              {monthAnchor.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </span>
            <Link
              href={`/admin/calendar?month=${formatMonthParam(nextMonth)}`}
              className="admin-topbar-pill"
            >
              Next Month
            </Link>
            <Link
              href={`/admin/calendar?month=${formatMonthParam(todayMonth)}`}
              className="admin-topbar-pill"
            >
              This Month
            </Link>
          </>
        }
      />

      <div className="card admin-table-card admin-calendar-card">
        <AdminSectionHeader
          eyebrow="Monthly view"
          title="Reserved dates and event load"
          actions={
            <form method="GET" className="admin-calendar-jump">
              <label className="label" htmlFor="calendar-month">
                Jump to month
              </label>
              <div className="admin-calendar-jump-controls">
                <input
                  id="calendar-month"
                  name="month"
                  type="month"
                  defaultValue={formatMonthParam(monthAnchor)}
                  className="input"
                />
                <button type="submit" className="btn secondary">
                  Go
                </button>
              </div>
            </form>
          }
        />

        <div className="admin-calendar-quick-strip">
          {quickMonths.map((date) => {
            const key = formatMonthParam(date);
            const active = key === formatMonthParam(monthAnchor);

            return (
              <Link
                key={key}
                href={`/admin/calendar?month=${key}`}
                className={`admin-calendar-quick-month${active ? " is-active" : ""}`}
              >
                {date.toLocaleString(undefined, { month: "short", year: "numeric" })}
              </Link>
            );
          })}
        </div>

        <div className="admin-calendar-legend">
          <span><i className="admin-calendar-dot admin-calendar-dot--low" /> 1 booking</span>
          <span><i className="admin-calendar-dot admin-calendar-dot--medium" /> 2 bookings</span>
          <span><i className="admin-calendar-dot admin-calendar-dot--high" /> 3+ bookings</span>
        </div>

        {view === "calendar" ? (
          <>
            <div className="admin-calendar-grid-head">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="admin-calendar-grid">
              {days.map((day) => (
                <div
                  key={day.key}
                  className={`admin-calendar-cell admin-calendar-cell--${day.loadTone}${day.isCurrentMonth ? "" : " is-outside"}${day.isToday ? " is-today" : ""}${day.reservedCount ? " is-reserved" : ""}`}
                >
                  <div className="admin-calendar-cell-head">
                    <strong>{day.date.getDate()}</strong>
                    <div className="admin-calendar-cell-meta">
                      {day.items.length ? (
                        <span className="admin-calendar-count">{day.items.length}</span>
                      ) : null}
                      {day.warning ? (
                        <span className="admin-calendar-warning">{day.warning}</span>
                      ) : null}
                    </div>
                  </div>

                  {day.reservedCount ? (
                    <div className="admin-calendar-reserved-mark">
                      Reserved {day.reservedCount > 1 ? `(${day.reservedCount})` : ""}
                    </div>
                  ) : null}

                  <div className="admin-calendar-cell-events">
                    {day.items.slice(0, 3).map((item) => (
                      <Link
                        key={item.id}
                        href={`/admin/inquiries/${item.id}`}
                        className="admin-calendar-event-pill"
                        title={`${item.first_name} ${item.last_name} • ${item.event_type || "Event"} • ${humanizeBookingStage(item.lifecycle)}`}
                      >
                        <span>{item.first_name} {item.last_name}</span>
                        <small>{humanizeBookingStage(item.lifecycle)}</small>
                      </Link>
                    ))}

                    {day.items.length > 3 ? (
                      <span className="admin-calendar-more">+{day.items.length - 3} more</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="admin-calendar-list">
            {days.filter((day) => day.items.length > 0).map((day) => (
              <div key={day.key} className={`admin-calendar-list-day admin-calendar-list-day--${day.loadTone}`}>
                <div className="admin-calendar-list-head">
                  <div>
                    <strong>{day.date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</strong>
                    <p>{day.items.length} booking{day.items.length === 1 ? "" : "s"} • {day.reservedCount} reserved</p>
                  </div>
                  {day.warning ? <span className="admin-calendar-warning">{day.warning}</span> : null}
                </div>
                <div className="admin-calendar-list-events">
                  {day.items.map((item) => (
                    <Link key={item.id} href={`/admin/inquiries/${item.id}`} className="admin-calendar-list-item">
                      <div>
                        <strong>{item.first_name} {item.last_name}</strong>
                        <p>{item.event_type || "Event"} {item.venue_name ? `• ${item.venue_name}` : ""}</p>
                      </div>
                      <span>{humanizeBookingStage(item.lifecycle)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
