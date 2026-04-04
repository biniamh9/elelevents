import { NextResponse } from "next/server";
import { getSiteSocialLinks } from "@/lib/social-links";

export async function GET() {
  try {
    const socialLinks = await getSiteSocialLinks();
    return NextResponse.json(socialLinks);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load social links" },
      { status: 500 }
    );
  }
}
