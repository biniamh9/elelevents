import SeoLandingPage from "@/components/site/seo-landing-page";
import { buildSeoLandingMetadata, getSeoLandingPage } from "@/lib/seo-landing-pages";

const pageConfig = getSeoLandingPage("sweetheart-table-decor-atlanta");

export const metadata = buildSeoLandingMetadata(pageConfig);

export default function SweetheartTableDecorAtlantaPage() {
  return <SeoLandingPage config={pageConfig} />;
}
