import SeoLandingPage from "@/components/site/seo-landing-page";
import { buildSeoLandingMetadata, getSeoLandingPage } from "@/lib/seo-landing-pages";

const pageConfig = getSeoLandingPage("baby-shower-decoration-atlanta");

export const metadata = buildSeoLandingMetadata(pageConfig);

export default function BabyShowerDecorationAtlantaPage() {
  return <SeoLandingPage config={pageConfig} />;
}
