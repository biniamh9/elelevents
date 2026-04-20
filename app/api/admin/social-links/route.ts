import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { sanitizeSocialLinks } from "@/lib/social-links";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminApi("content");
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const links = sanitizeSocialLinks({
      instagramUrl: body.instagramUrl,
      facebookUrl: body.facebookUrl,
      tiktokUrl: body.tiktokUrl,
    });

    const { error } = await supabaseAdmin.from("site_social_links").upsert(
      {
        singleton_key: "default",
        ...links,
      },
      { onConflict: "singleton_key" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "client",
      entityId: "site-social-links",
      action: "site_social_links.updated",
      summary: "Site social links updated",
      metadata: links,
      actorId: auth.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update social links" },
      { status: 500 }
    );
  }
}
