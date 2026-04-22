import SeoLandingPage from "@/components/site/seo-landing-page";
import { buildSeoLandingMetadata, getSeoLandingPage } from "@/lib/seo-landing-pages";

const pageConfig = getSeoLandingPage("wedding-decor-atlanta");

export const metadata = buildSeoLandingMetadata(pageConfig);

export default function WeddingDecorAtlantaPage() {
  return <SeoLandingPage config={pageConfig} />;
}
