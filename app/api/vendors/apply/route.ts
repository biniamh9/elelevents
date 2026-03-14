import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { logActivity } from "@/lib/crm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
    const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";

    if (!email || !password || password.length < 8 || !businessName || !contactName) {
      return NextResponse.json(
        { error: "Business name, contact name, email, and a password of at least 8 characters are required." },
        { status: 400 }
      );
    }

    const { data: createdUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "vendor",
      },
    });

    if (userError || !createdUser.user) {
      return NextResponse.json(
        { error: userError?.message || "Failed to create vendor user" },
        { status: 500 }
      );
    }

    const { error: vendorError } = await supabaseAdmin.from("vendor_accounts").insert({
      id: createdUser.user.id,
      business_name: businessName,
      contact_name: contactName,
      email,
      phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
      service_categories: Array.isArray(body.serviceCategories) ? body.serviceCategories : [],
      city: typeof body.city === "string" ? body.city.trim() || null : null,
      state: typeof body.state === "string" ? body.state.trim() || null : null,
      service_area: typeof body.serviceArea === "string" ? body.serviceArea.trim() || null : null,
      instagram_handle: typeof body.instagramHandle === "string" ? body.instagramHandle.trim() || null : null,
      website_url: typeof body.websiteUrl === "string" ? body.websiteUrl.trim() || null : null,
      bio: typeof body.bio === "string" ? body.bio.trim() || null : null,
      pricing_tier: typeof body.pricingTier === "string" ? body.pricingTier.trim() || null : null,
      approval_status: "pending",
      membership_status: "trial",
      is_active: true,
    });

    if (vendorError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
      return NextResponse.json({ error: vendorError.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      entityType: "vendor",
      entityId: createdUser.user.id,
      action: "vendor.applied",
      summary: "Vendor application submitted",
      metadata: {
        business_name: businessName,
        service_categories: Array.isArray(body.serviceCategories) ? body.serviceCategories : [],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to submit vendor application" }, { status: 500 });
  }
}
