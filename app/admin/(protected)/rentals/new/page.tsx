import AdminPageIntro from "@/components/admin/admin-page-intro";
import RentalItemForm from "@/components/forms/admin/rental-item-form";
import { requireAdminPage } from "@/lib/auth/admin";

export default async function AdminNewRentalPage() {
  await requireAdminPage("sales");

  return (
    <main className="admin-page section admin-page--workspace">
      <AdminPageIntro
        title="New rental item"
        description="Create a clean rental record with pricing, quantity, images, and service fees."
      />
      <RentalItemForm />
    </main>
  );
}
