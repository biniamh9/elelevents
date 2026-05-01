import Link from "next/link";
import { notFound } from "next/navigation";

import RentalRequestDetail from "@/components/forms/admin/rental-request-detail";
import { requireAdminPage } from "@/lib/auth/admin";
import { getRentalQuoteRequestById } from "@/lib/rental-requests";

export const dynamic = "force-dynamic";

export default async function AdminRentalRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("sales");

  const { id } = await params;
  const request = await getRentalQuoteRequestById(id);

  if (!request) {
    notFound();
  }

  return (
    <main className="admin-page section admin-page--workspace">
      <header className="admin-page-header admin-page-header--reference">
        <div>
          <h1>Rental Request</h1>
          <p>Review the rental quote request, confirm stage, and keep staff notes inside the rental pipeline.</p>
        </div>
        <div className="admin-page-head-aside">
          <Link href="/admin/rentals" className="admin-head-pill">Back to rental requests</Link>
        </div>
      </header>

      <section className="admin-reference-summary-shell">
        <p className="admin-reference-summary-lead">
          Keep rental intake details, requested items, logistics pricing, refundable deposit context, and internal stage movement in one structured request record
        </p>
      </section>

      <RentalRequestDetail request={request} />
    </main>
  );
}
