import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import DocumentPdfFile from "@/components/forms/admin/document-pdf-file";
import { getDocumentById } from "@/lib/admin-documents";
import { requireAdminApi } from "@/lib/auth/admin";

export const runtime = "nodejs";

function buildPdfFilename(documentNumber: string, documentType: string) {
  const safeBase = `${documentNumber || documentType}`
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${safeBase || "document"}.pdf`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { id } = await context.params;
  const document = await getDocumentById(id);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const compact = url.searchParams.get("compact") === "1";
  const filename = buildPdfFilename(document.document_number, document.document_type);

  const pdfElement = createElement(DocumentPdfFile, { document, printCompact: compact }) as Parameters<
    typeof renderToBuffer
  >[0];
  const buffer = await renderToBuffer(pdfElement);

  return new NextResponse(buffer as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
