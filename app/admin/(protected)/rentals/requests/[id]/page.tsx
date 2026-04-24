import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPageIntro from "@/components/admin/admin-page-intro";
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
      <AdminPageIntro
        title="Rental Request"
        description="Review the rental quote request, confirm stage, and keep staff notes inside the rental pipeline."
        aside={<Link href="/admin/rentals" className="btn secondary">Back to rental requests</Link>}
      />

      <RentalRequestDetail request={request} />
    </main>
  );
}
