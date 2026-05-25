import Link from "next/link";
import { buildSeedDocument } from "@/lib/admin-documents";
import DocumentEditor from "@/components/forms/admin/document-editor";
import type { ClientDocumentType } from "@/lib/client-documents";
import AdminPageIntro from "@/components/admin/admin-page-intro";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    inquiryId?: string;
    contractId?: string;
    sourceDocumentId?: string;
    mode?: string;
  }>;
}) {
  await requireAdminPage("sales");

  const params = await searchParams;
  const type = (params.type as ClientDocumentType) || "quote";
  const isManualInvoice = type === "invoice" && params.mode === "manual";
  const seeded = await buildSeedDocument({
    type,
    inquiryId: params.inquiryId ?? null,
    contractId: params.contractId ?? null,
    sourceDocumentId: params.sourceDocumentId ?? null,
  });
  const initialDocument = isManualInvoice
    ? {
        ...seeded,
        status: "unpaid" as const,
        customer_name: seeded.customer_name || "Walk-in customer",
        customer_email: null,
        payment_instructions:
          seeded.payment_instructions ||
          "Invoice prepared for in-person delivery. Record cash, Zelle, check, transfer, or card payment after collection.",
        payment_terms:
          seeded.payment_terms ||
          "Payment is due upon receipt unless another arrangement is documented by the admin.",
        notes:
          seeded.notes ||
          "Manual invoice created from admin for work already completed or collected in person.",
      }
    : seeded;

  return (
    <main className="section admin-page admin-page--workspace">
      <AdminPageIntro
        title={isManualInvoice ? "Create in-person invoice" : `Build a client-ready ${type}`}
        description={
          isManualInvoice
            ? "Use this for walk-in, phone, cash, Zelle, or no-email customers. Save the invoice, print or download it, then record payment when money is collected."
            : "Refine the scope, totals, and notes before sharing anything with the client."
        }
      />
      <div className="admin-workspace-actions admin-workspace-actions--page">
        <Link href="/admin/documents" className="admin-topbar-pill">
          Back to Documents
        </Link>
      </div>

      <DocumentEditor
        initialDocument={initialDocument}
        mode="create"
        manualInvoiceMode={isManualInvoice}
      />
    </main>
  );
}
