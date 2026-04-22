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
          <stop stop-color="#F8F3EB"/>
          <stop offset="0.58" stop-color="#EADFCC"/>
          <stop offset="1" stop-color="#D7C2A4"/>
        </linearGradient>
        <radialGradient id="glowA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1190 250) rotate(125) scale(720 540)">
          <stop stop-color="#F2D2AF" stop-opacity="0.7"/>
          <stop offset="1" stop-color="#F2D2AF" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glowB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(420 860) rotate(32) scale(680 440)">
          <stop stop-color="#FFFFFF" stop-opacity="0.54"/>
          <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#FFFDF8" stop-opacity="0.78"/>
          <stop offset="1" stop-color="#FFF8EF" stop-opacity="0.4"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="1120" rx="48" fill="url(#bg)"/>
      <rect width="1600" height="1120" rx="48" fill="url(#glowA)"/>
      <rect width="1600" height="1120" rx="48" fill="url(#glowB)"/>
      <rect x="96" y="96" width="1408" height="928" rx="40" fill="url(#frame)" stroke="rgba(93,39,4,0.12)" stroke-width="2"/>
      <rect x="196" y="164" width="1208" height="792" rx="34" fill="rgba(255,255,255,0.16)" stroke="rgba(93,39,4,0.08)"/>
      <path d="M196 746C338 676 471 638 614 638C828 638 968 746 1148 746C1244 746 1328 716 1404 666V956H196V746Z" fill="rgba(93,39,4,0.08)"/>
      <path d="M196 626C324 528 451 480 604 480C798 480 944 598 1132 598C1238 598 1326 564 1404 502V758C1326 808 1230 834 1124 834C938 834 798 734 608 734C460 734 334 772 196 850V626Z" fill="rgba(255,255,255,0.34)"/>
      <circle cx="456" cy="408" r="126" fill="rgba(255,255,255,0.28)"/>
      <circle cx="1188" cy="332" r="152" fill="rgba(93,39,4,0.08)"/>
      <rect x="290" y="236" width="192" height="18" rx="9" fill="rgba(122,71,31,0.16)"/>
      <rect x="290" y="836" width="288" height="72" rx="24" fill="rgba(255,255,255,0.6)" stroke="rgba(93,39,4,0.1)"/>
      <text x="338" y="872" fill="#7A471F" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5">ELEL EVENTS</text>
      <text x="338" y="902" fill="#3B2A21" font-family="Arial, sans-serif" font-size="24" font-weight="600">${label}</text>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
