"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const hiddenPrefixes = ["/admin", "/vendors/dashboard", "/vendors/pending"];

export default function SiteFooter() {
  const pathname = usePathname();

  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="footer container">
        <p>© 2026 Elel Events. Elegant design for meaningful celebrations.</p>
        <div className="site-footer-links" aria-label="Footer links">
          <Link href="/contact">Contact</Link>
          <Link href="/vendors">Vendors</Link>
          <Link href="/admin/login" className="site-footer-admin-link">
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
