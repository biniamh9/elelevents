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
        <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="rgba(255,255,255,0.88)"/>
          <stop offset="1" stop-color="rgba(255,255,255,0.58)"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="1120" rx="48" fill="url(#bg)"/>
      <rect width="1600" height="1120" rx="48" fill="url(#glow)"/>
      <rect x="96" y="96" width="1408" height="928" rx="40" fill="rgba(255,255,255,0.28)" stroke="rgba(93,39,4,0.12)" stroke-width="2"/>
      <circle cx="336" cy="336" r="208" fill="rgba(255,255,255,0.22)"/>
      <circle cx="1264" cy="764" r="236" fill="rgba(93,39,4,0.08)"/>
      <rect x="196" y="176" width="1208" height="768" rx="34" fill="rgba(255,255,255,0.18)"/>
      <rect x="376" y="354" width="848" height="246" rx="28" fill="url(#panel)" stroke="rgba(93,39,4,0.08)"/>
      <text x="800" y="314" text-anchor="middle" fill="#7A471F" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="6">ELEL EVENTS</text>
      <text x="800" y="465" text-anchor="middle" fill="#221813" font-family="Georgia, serif" font-size="78" font-weight="700">${label}</text>
      <text x="800" y="533" text-anchor="middle" fill="#5F564F" font-family="Arial, sans-serif" font-size="28">Luxury placeholder image</text>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
