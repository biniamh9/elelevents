import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Elel Events",
  description: "Quote-first event planning and decor website",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <header className="site-header">
          <div className="container nav">
            <Link href="/" className="brand brand-logo" aria-label="Elel Events home">
              <Image
                src="/logo.png"
                alt="Elel Events logo"
                width={320}
                height={120}
                priority
                className="brand-logo-image"
              />
            </Link>
            <nav className="nav-links">
              <Link href="/">Home</Link>
              <Link href="/request">Request Quote</Link>
              <Link href="/gallery">Gallery</Link>
              <Link href="/packages">Packages</Link>
              <Link href="/admin/login">Admin</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
