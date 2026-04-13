"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import AdminNotificationBell from "@/components/admin/admin-notification-bell";

type HeaderConfig = {
  title: string;
  subtitle: string;
  context?: string;
};

function getHeaderConfig(pathname: string, tab: string | null): HeaderConfig {
  if (pathname === "/admin/inquiries") {
    const currentTab = tab || "overview";

    if (currentTab === "pipeline") {
      return {
        title: "Pipeline",
        subtitle: "Track every inquiry from first response to booking.",
        context: "Overview workspace",
      };
    }

    if (currentTab === "schedule") {
      return {
        title: "Schedule",
        subtitle: "Stay ahead of consultations, event dates, and booking load.",
        context: "Overview workspace",
      };
    }

    if (currentTab === "inquiries") {
      return {
        title: "Inquiries",
        subtitle: "Search, filter, and manage every incoming request in one place.",
        context: "Overview workspace",
      };
    }

    return {
      title: "Overview",
      subtitle: "Business health, action items, and recent activity.",
      context: "Overview workspace",
    };
  }

  if (pathname.startsWith("/admin/documents")) {
    return {
      title: "Documents",
      subtitle: "Quotes, invoices, and receipts in one polished client workflow.",
      context: "Sales workspace",
    };
  }

  if (pathname.startsWith("/admin/contracts")) {
    return {
      title: "Contracts",
      subtitle: "Manage agreements, signature progress, and deposits clearly.",
      context: "Sales workspace",
    };
  }

  if (pathname.startsWith("/admin/calendar")) {
    return {
      title: "Calendar",
      subtitle: "Monitor booked dates, consultations, and upcoming workload.",
      context: "Operations",
    };
  }

  if (pathname.startsWith("/admin/vendors")) {
    return {
      title: "Vendors",
      subtitle: "Keep the partner network curated and easy to review.",
      context: "Operations",
    };
  }

  if (pathname.startsWith("/admin/gallery")) {
    return {
      title: "Gallery",
      subtitle: "Manage the public visual portfolio without clutter.",
      context: "Content",
    };
  }

  if (pathname.startsWith("/admin/testimonials")) {
    return {
      title: "Testimonials",
      subtitle: "Keep review highlights refined and ready for the homepage.",
      context: "Content",
    };
  }

  if (pathname.startsWith("/admin/social")) {
    return {
      title: "Social Links",
      subtitle: "Manage public sharing links and success-screen destinations.",
      context: "Content",
    };
  }

  if (pathname.startsWith("/admin/flow")) {
    return {
      title: "Homepage Flow",
      subtitle: "Adjust the homepage process story and supporting content.",
      context: "Content",
    };
  }

  if (pathname.startsWith("/admin/packages")) {
    return {
      title: "Packages",
      subtitle: "Organize public offerings so sales conversations stay clear.",
      context: "Sales workspace",
    };
  }

  if (pathname.startsWith("/admin/pricing")) {
    return {
      title: "Pricing",
      subtitle: "Maintain reusable line items and quote-ready catalog pricing.",
      context: "Sales workspace",
    };
  }

  if (pathname.startsWith("/admin/finance")) {
    const currentTab = tab || "overview";

    if (currentTab === "income") {
      return {
        title: "Finance",
        subtitle: "Track recorded income, deposits, and paid client documents.",
        context: "Finance workspace",
      };
    }

    if (currentTab === "expenses") {
      return {
        title: "Finance",
        subtitle: "Keep expenses, vendor outflow, and cost visibility organized.",
        context: "Finance workspace",
      };
    }

    return {
      title: "Finance",
      subtitle: "Monitor revenue, payouts, and the financial picture in one workspace.",
      context: "Finance workspace",
    };
  }

  if (pathname.startsWith("/admin/settings")) {
    const currentTab = tab || "access";

    if (currentTab === "workspace") {
      return {
        title: "Settings",
        subtitle: "Adjust workspace defaults and operational preferences.",
        context: "Settings",
      };
    }

    if (currentTab === "modules") {
      return {
        title: "Settings",
        subtitle: "Control which admin modules stay visible and who can use them.",
        context: "Settings",
      };
    }

    return {
      title: "Settings",
      subtitle: "Manage roles, access levels, and admin workflow controls.",
      context: "Settings",
    };
  }

  return {
    title: "Admin Workspace",
    subtitle: "Run Elel Events operations with a clear, focused workspace.",
  };
}

export default function AdminWorkspaceHeader({
  adminId,
}: {
  adminId: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const config = getHeaderConfig(pathname, searchParams.get("tab"));

  return (
    <div className="admin-topbar">
      <div className="admin-topbar-main">
        <div className="admin-topbar-copy">
          <p className="eyebrow">{config.context || "Admin workspace"}</p>
          <h2>{config.title}</h2>
          <p className="admin-breadcrumbs">{config.subtitle}</p>
        </div>
      </div>
      <div className="admin-topbar-actions">
        <AdminNotificationBell adminId={adminId} />
        <Link href="/admin/gallery" className="admin-topbar-pill">
          Gallery
        </Link>
        <Link href="/request" className="admin-topbar-pill">
          Public form
        </Link>
        <Link href="/request" className="btn">
          Create inquiry
        </Link>
      </div>
    </div>
  );
}
