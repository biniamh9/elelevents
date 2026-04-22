import SeoLandingPage from "@/components/site/seo-landing-page";
import { buildSeoLandingMetadata, getSeoLandingPage } from "@/lib/seo-landing-pages";

const pageConfig = getSeoLandingPage("engagement-party-decor-atlanta");

export const metadata = buildSeoLandingMetadata(pageConfig);

export default function EngagementPartyDecorAtlantaPage() {
  return <SeoLandingPage config={pageConfig} />;
}
