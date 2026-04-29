import Link from "next/link";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import ManualInquiryForm from "@/components/forms/admin/manual-inquiry-form";
import { buildInquiryWorkspaceHref } from "@/lib/admin-navigation";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function NewAdminInquiryPage() {
  await requireAdminPage("overview");

  return (
    <main className="section admin-page admin-page--workspace">
      <AdminPageIntro
        title="Create a request manually"
        description="Enter a lead on behalf of the customer and keep it inside the same operating lane as website inquiries."
      />
      <div className="admin-workspace-actions admin-workspace-actions--page">
        <Link
          href={buildInquiryWorkspaceHref({ tab: "inquiries" })}
          className="admin-topbar-pill"
        >
          Back to Inquiries
        </Link>
      </div>

      <ManualInquiryForm />
    </main>
  );
}
