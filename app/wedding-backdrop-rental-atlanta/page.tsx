import SeoLandingPage from "@/components/site/seo-landing-page";
import { buildSeoLandingMetadata, getSeoLandingPage } from "@/lib/seo-landing-pages";

const pageConfig = getSeoLandingPage("wedding-backdrop-rental-atlanta");

export const metadata = buildSeoLandingMetadata(pageConfig);

export default function WeddingBackdropRentalAtlantaPage() {
  return <SeoLandingPage config={pageConfig} />;
}
