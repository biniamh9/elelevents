import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
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
    const auth = await requireAdminApi("content");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const formData = await request.formData();
    const fileEntries = formData.getAll("files");
    const legacyFile = formData.get("file");
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const sortOrderValue = String(formData.get("sort_order") ?? "").trim();
    const sortOrderBase = sortOrderValue ? Number(sortOrderValue) : null;
    const files = fileEntries.length
      ? fileEntries.filter((entry): entry is File => entry instanceof File)
      : legacyFile instanceof File
        ? [legacyFile]
        : [];

    if (!files.length) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const insertedIds: string[] = [];

    for (const [index, file] of files.entries()) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

      if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
        return NextResponse.json(
          { error: "Only JPG, JPEG, PNG, and WEBP files are allowed." },
          { status: 400 }
        );
      }

      const contentType = getContentType(file, extension);
      const filePath = `${Date.now()}-${randomUUID()}.${extension}`;

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

      const itemTitle =
        files.length === 1 ? title : `${title} ${index + 1}`;

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("gallery_items")
        .insert({
          title: itemTitle,
          category: category || null,
          image_url: publicUrl,
          image_path: filePath,
          sort_order: sortOrderBase !== null ? sortOrderBase + index : null,
          is_active: true,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        return NextResponse.json(
          { error: insertError?.message || "Failed to save gallery item" },
          { status: 500 }
        );
      }

      insertedIds.push(inserted.id);

      await logActivity(supabaseAdmin, {
        entityType: "client",
        entityId: inserted.id,
        action: "gallery.uploaded",
        summary: "Gallery image uploaded",
        metadata: {
          title: itemTitle,
          category: category || null,
          image_path: filePath,
        },
      });
    }

    return NextResponse.json({ success: true, ids: insertedIds });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
