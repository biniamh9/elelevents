import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";
import AdminSopPdfFile from "@/components/forms/admin/admin-sop-pdf-file";
import { requireAdminApi } from "@/lib/auth/admin";

export const runtime = "nodejs";

async function getLogoDataUri() {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const fileBuffer = await fs.readFile(logoPath);
    return `data:image/png;base64,${fileBuffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const auth = await requireAdminApi("overview");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const url = new URL(request.url);
  const download = url.searchParams.get("download") !== "0";
  const logoSrc = await getLogoDataUri();

  const pdfElement = createElement(AdminSopPdfFile, { logoSrc }) as Parameters<
    typeof renderToBuffer
  >[0];
  const buffer = await renderToBuffer(pdfElement);

  return new NextResponse(buffer as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="elel-events-admin-sop.pdf"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
