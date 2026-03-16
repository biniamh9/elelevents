import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

const VISION_BOARD_BUCKET = "vision-boards";
const MAX_FILES = 5;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "At least one image is required." }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_FILES} inspiration images.` },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Only image files are allowed for vision boards." },
          { status: 400 }
        );
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${Date.now()}-${randomUUID()}.${extension}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(VISION_BOARD_BUCKET)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from(VISION_BOARD_BUCKET).getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return NextResponse.json({ success: true, urls: uploadedUrls });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to upload inspiration images." },
      { status: 500 }
    );
  }
}
