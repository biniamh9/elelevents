import { notFound } from "next/navigation";

import AdminPageIntro from "@/components/admin/admin-page-intro";
import RentalItemForm from "@/components/forms/admin/rental-item-form";
import { requireAdminPage } from "@/lib/auth/admin";
import { getRentalItemById } from "@/lib/rentals";

export default async function AdminRentalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("sales");
  const { id } = await params;
  const item = await getRentalItemById(id);

  if (!item) {
    notFound();
  }

  return (
    <main className="admin-page section admin-page--workspace">
      <AdminPageIntro
        title={item.name}
        description="Update pricing, images, visibility, and default rental fees without leaving the admin workspace."
      />
      <RentalItemForm item={item} />
    </main>
  );
}
