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
  parseRetainedGalleryIds,
  removeStoragePaths,
  replaceFeaturedImage,
} from "@/lib/rental-admin";
import { slugifyRentalName } from "@/lib/rentals";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const contentType = request.headers.get("content-type") || "";

    const { data: existingItem, error: existingError } = await supabaseAdmin
      .from("rental_items")
      .select("*")
      .eq("id", id)
      .single();

    if (existingError || !existingItem) {
      return NextResponse.json({ error: "Rental item not found" }, { status: 404 });
    }

    const { data: existingImages } = await supabaseAdmin
      .from("rental_item_images")
      .select("id, image_path, sort_order")
      .eq("rental_item_id", id)
      .order("sort_order", { ascending: true });

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const partialUpdates: Record<string, unknown> = {};

      if (typeof body.active === "boolean") {
        partialUpdates.active = body.active;
      }

      if (typeof body.featured === "boolean") {
        partialUpdates.featured = body.featured;
      }

      if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
        partialUpdates.sort_order = Math.max(Math.trunc(body.sort_order), 0);
      }

      if (typeof body.name === "string" && body.name.trim()) {
        partialUpdates.name = body.name.trim();
      }

      if (typeof body.slug === "string" && body.slug.trim()) {
        partialUpdates.slug = slugifyRentalName(body.slug);
      }

      if (!Object.keys(partialUpdates).length) {
        return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
      }

      const { error } = await supabaseAdmin.from("rental_items").update(partialUpdates).eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    const formData = await request.formData();
    const values = parseRentalItemFormData(formData);
    const featuredImageFile = getFeaturedImageFile(formData);
    const removeFeaturedImage = formData.get("remove_featured_image") === "true";
    const retainedGalleryIds = parseRetainedGalleryIds(formData);
    const galleryFiles = getGalleryImageFiles(formData);

    let featuredImageUrl: string | null | undefined;
    let featuredImagePath: string | null | undefined;

    if (featuredImageFile) {
      const uploaded = await replaceFeaturedImage(
        id,
        featuredImageFile,
        existingItem.featured_image_path
      );
      featuredImageUrl = uploaded?.imageUrl ?? null;
      featuredImagePath = uploaded?.imagePath ?? null;
    } else if (removeFeaturedImage) {
      await removeStoragePaths([existingItem.featured_image_path]);
      featuredImageUrl = null;
      featuredImagePath = null;
    }

    const galleryToDelete = (existingImages ?? []).filter(
      (image) => !retainedGalleryIds.includes(String(image.id))
    );

    if (galleryToDelete.length) {
      await removeStoragePaths(galleryToDelete.map((image) => image.image_path));
      await supabaseAdmin
        .from("rental_item_images")
        .delete()
        .in(
          "id",
          galleryToDelete.map((image) => image.id)
        );
    }

    const maxSortOrder = (existingImages ?? [])
      .filter((image) => retainedGalleryIds.includes(String(image.id)))
      .reduce((max, image) => Math.max(max, Number(image.sort_order ?? 0)), -1);

    if (galleryFiles.length) {
      await insertRentalGalleryImages(id, galleryFiles, maxSortOrder + 1);
    }

    const updates: Record<string, unknown> = { ...values };
    if (featuredImageUrl !== undefined) {
      updates.featured_image_url = featuredImageUrl;
      updates.featured_image_path = featuredImagePath;
    }

    const { error } = await supabaseAdmin
      .from("rental_items")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: id,
      action: "rental.updated",
      summary: "Rental item updated",
      metadata: {
        name: values.name,
        slug: values.slug,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid rental item data" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to update rental item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("sales");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;

    const { data: item } = await supabaseAdmin
      .from("rental_items")
      .select("id, name, featured_image_path")
      .eq("id", id)
      .single();

    const { data: images } = await supabaseAdmin
      .from("rental_item_images")
      .select("image_path")
      .eq("rental_item_id", id);

    await removeStoragePaths([
      item?.featured_image_path,
      ...(images ?? []).map((image) => image.image_path),
    ]);

    const { error } = await supabaseAdmin.from("rental_items").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: id,
      action: "rental.deleted",
      summary: "Rental item deleted",
      metadata: {
        name: item?.name ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete rental item" }, { status: 500 });
  }
}
