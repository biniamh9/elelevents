import SocialLinksManagement from "@/components/forms/admin/social-links-management";
import { getSiteSocialLinks } from "@/lib/social-links";
import { requireAdminPage } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminSocialPage() {
  await requireAdminPage("content");

  const socialLinks = await getSiteSocialLinks();

  return <SocialLinksManagement initialLinks={socialLinks} />;
}
