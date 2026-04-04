import { supabaseAdmin } from "@/lib/supabase/admin-client";

export type SiteSocialLinks = {
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
};

const defaultSocialLinks: SiteSocialLinks = {
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
};

function normalizeUrl(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export async function getSiteSocialLinks(): Promise<SiteSocialLinks> {
  const { data, error } = await supabaseAdmin
    .from("site_social_links")
    .select("instagram_url, facebook_url, tiktok_url")
    .eq("singleton_key", "default")
    .maybeSingle();

  if (error || !data) {
    return {
      instagramUrl: normalizeUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
      facebookUrl: normalizeUrl(process.env.NEXT_PUBLIC_FACEBOOK_URL),
      tiktokUrl: normalizeUrl(process.env.NEXT_PUBLIC_TIKTOK_URL),
    };
  }

  return {
    instagramUrl: normalizeUrl(data.instagram_url),
    facebookUrl: normalizeUrl(data.facebook_url),
    tiktokUrl: normalizeUrl(data.tiktok_url),
  };
}

export function sanitizeSocialLinks(input: Partial<SiteSocialLinks>) {
  return {
    instagram_url: normalizeUrl(input.instagramUrl),
    facebook_url: normalizeUrl(input.facebookUrl),
    tiktok_url: normalizeUrl(input.tiktokUrl),
  };
}

export function getEmptySocialLinks(): SiteSocialLinks {
  return { ...defaultSocialLinks };
}
