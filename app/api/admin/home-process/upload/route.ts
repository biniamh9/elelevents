import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdminApi } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const GALLERY_BUCKET = "gallery";
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function getContentType(file: File, extension: string) {
  if (file.type && allowedMimeTypes.has(file.type)) {
    return file.type;
  }

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

    if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
      return NextResponse.json(
        { error: "Only JPG, JPEG, PNG, and WEBP files are allowed." },
        { status: 400 }
      );
    }

    const contentType = getContentType(file, extension);
    const filePath = `homepage-flow/${Date.now()}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(GALLERY_BUCKET)
      .upload(filePath, file, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(GALLERY_BUCKET).getPublicUrl(filePath);

    return NextResponse.json({ success: true, publicUrl, filePath });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to upload homepage flow image" },
      { status: 500 }
    );
  }
}
