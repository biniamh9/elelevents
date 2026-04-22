import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import {
  getFeaturedImageFile,
  getGalleryImageFiles,
  insertRentalGalleryImages,
  parseRentalItemFormData,
  removeStoragePaths,
  replaceFeaturedImage,
} from "@/lib/rental-admin";

export async function POST(request: Request) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const formData = await request.formData();
    const values = parseRentalItemFormData(formData);
    const featuredImageFile = getFeaturedImageFile(formData);
    const galleryFiles = getGalleryImageFiles(formData);
    let uploadedFeaturedPath: string | null = null;

    const { data: inserted, error } = await supabaseAdmin
      .from("rental_items")
      .insert({
        ...values,
      })
      .select("*")
      .single();

    if (error || !inserted) {
      return NextResponse.json({ error: error?.message || "Failed to create rental item" }, { status: 500 });
    }

    try {
      const uploadedFeatured = await replaceFeaturedImage(inserted.id, featuredImageFile);

      if (uploadedFeatured) {
        uploadedFeaturedPath = uploadedFeatured.imagePath;
        await supabaseAdmin
          .from("rental_items")
          .update({
            featured_image_url: uploadedFeatured.imageUrl,
            featured_image_path: uploadedFeatured.imagePath,
          })
          .eq("id", inserted.id);
      }

      await insertRentalGalleryImages(inserted.id, galleryFiles, 0);
    } catch (uploadError) {
      await removeStoragePaths([uploadedFeaturedPath]);
      await supabaseAdmin.from("rental_items").delete().eq("id", inserted.id);
      throw uploadError;
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: inserted.id,
      action: "rental.created",
      summary: "Rental item created",
      metadata: {
        name: values.name,
        slug: values.slug,
        category: values.category,
        featured: values.featured,
        active: values.active,
      },
    });

    return NextResponse.json({ success: true, id: inserted.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid rental item data" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to create rental item" }, { status: 500 });
  }
}
