import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    slug: string[];
  }>;
};

function formatLabel(segment: string) {
  const fileName = segment.replace(/\.[a-z0-9]+$/i, "");

  return fileName
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function GET(_: Request, context: RouteContext) {
  const params = await context.params;
  const lastSegment = params.slug[params.slug.length - 1] ?? "elel-events";
  const label = formatLabel(lastSegment);

  const svg = `
    <svg width="1600" height="1120" viewBox="0 0 1600 1120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1600" y2="1120" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F7F1E8"/>
          <stop offset="0.55" stop-color="#E9DED0"/>
          <stop offset="1" stop-color="#DCC4AA"/>
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1248 228) rotate(123.987) scale(642.958 582.387)">
          <stop stop-color="#F6D7B4" stop-opacity="0.9"/>
          <stop offset="1" stop-color="#F6D7B4" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="1120" rx="48" fill="url(#bg)"/>
      <rect width="1600" height="1120" rx="48" fill="url(#glow)"/>
      <rect x="98" y="98" width="1404" height="924" rx="36" fill="rgba(255,255,255,0.5)" stroke="rgba(93,39,4,0.12)" stroke-width="2"/>
      <rect x="172" y="172" width="488" height="694" rx="28" fill="rgba(255,255,255,0.46)"/>
      <rect x="710" y="204" width="692" height="244" rx="28" fill="rgba(93,39,4,0.08)"/>
      <rect x="710" y="488" width="320" height="288" rx="28" fill="rgba(255,255,255,0.74)"/>
      <rect x="1082" y="488" width="320" height="288" rx="28" fill="rgba(255,255,255,0.74)"/>
      <text x="172" y="254" fill="#7A471F" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="6">ELEL EVENTS</text>
      <text x="172" y="342" fill="#221813" font-family="Georgia, serif" font-size="94" font-weight="700">${label}</text>
      <text x="172" y="414" fill="#5F564F" font-family="Arial, sans-serif" font-size="34">Luxury placeholder image for SEO landing pages</text>
      <text x="172" y="486" fill="#5F564F" font-family="Arial, sans-serif" font-size="30">Replace this with a real portfolio image when ready.</text>
      <text x="770" y="326" fill="#221813" font-family="Georgia, serif" font-size="52" font-weight="700">Editorial image slot</text>
      <text x="770" y="388" fill="#5F564F" font-family="Arial, sans-serif" font-size="30">/images/seo/${lastSegment}</text>
      <text x="770" y="584" fill="#7A471F" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="4">PORTFOLIO READY</text>
      <text x="770" y="640" fill="#221813" font-family="Georgia, serif" font-size="42">Swap with a real design image</text>
      <text x="1142" y="584" fill="#7A471F" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="4">LUXURY BRAND FIT</text>
      <text x="1142" y="640" fill="#221813" font-family="Georgia, serif" font-size="42">Warm, timeless, polished</text>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
