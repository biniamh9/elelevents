import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

async function getVendorAccount(userId: string) {
  const { data: vendor } = await supabaseAdmin
    .from("vendor_accounts")
    .select("id, approval_status, membership_status, is_active, business_name")
    .eq("id", userId)
    .maybeSingle();

  return vendor;
}

export async function getCurrentVendorContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, vendor: null };
  }

  const vendor = await getVendorAccount(user.id);
  return { user, vendor };
}

export async function requireVendorPage() {
  const { user, vendor } = await getCurrentVendorContext();

  if (!user || !vendor || !vendor.is_active) {
    redirect("/vendors/login");
  }

  if (vendor.approval_status !== "approved") {
    redirect("/vendors/pending");
  }

  return { user, vendor };
}

export async function requireVendorApi() {
  const { user, vendor } = await getCurrentVendorContext();

  if (!user) {
    return {
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
      vendor: null,
    };
  }

  if (!vendor || !vendor.is_active) {
    return {
      errorResponse: NextResponse.json({ error: "Vendor account not found" }, { status: 404 }),
      user,
      vendor: null,
    };
  }

  if (vendor.approval_status !== "approved") {
    return {
      errorResponse: NextResponse.json({ error: "Vendor account is not approved yet" }, { status: 403 }),
      user,
      vendor,
    };
  }

  return { errorResponse: null, user, vendor };
}
