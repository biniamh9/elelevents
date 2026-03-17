import "./globals.css";
import type { Metadata } from "next";
import type { Viewport } from "next";
import { Bodoni_Moda, Great_Vibes, Plus_Jakarta_Sans } from "next/font/google";
import SiteHeader from "@/components/site/site-header";
import SiteFooter from "@/components/site/site-footer";

const displayFont = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const accentFont = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-accent",
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Elel Events",
  description: "Quote-first event planning and decor website",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Elel Events",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6ede3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${accentFont.variable} ${bodyFont.variable}`}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
