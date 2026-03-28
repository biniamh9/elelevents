"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryItem } from "@/lib/gallery";
import type { PublicVendorRecommendation } from "@/lib/vendors";
import { VENDOR_SERVICE_CATEGORIES } from "@/lib/vendors";

const celebrationEventOptions = [
  "Birthday",
  "Baby Shower",
  "Anniversary",
  "Bridal Shower",
  "Engagement",
  "Graduation",
];

const primaryEventExperienceOptions = [
  {
    key: "wedding",
    title: "Wedding",
    eventType: "Wedding",
    imageKeywords: ["wedding", "reception", "head table"],
  },
  {
    key: "traditional",
    title: "Traditional (Melsi)",
    eventType: "Traditional (Melsi)",
    imageKeywords: ["melsi", "traditional"],
  },
  {
    key: "celebrations",
    title: "Celebrations",
    eventType: null,
    imageKeywords: ["birthday", "baby shower", "anniversary", "bridal shower", "engagement"],
  },
  {
    key: "corporate",
    title: "Corporate Events",
    eventType: "Corporate Event",
    imageKeywords: ["corporate", "conference", "brand"],
  },
  {
    key: "other",
    title: "Other",
    eventType: "Other",
    imageKeywords: [],
  },
] as const;

const venueStatusOptions = ["Booked", "Still looking", "Home", "Church", "Hall", "Hotel / ballroom"];
const consultationOptions = ["Phone call", "Video meeting", "In-person meeting", "Text or email first"];
const videoPlatformOptions = ["Google Meet", "Zoom", "Other"];
const referralOptions = ["Instagram", "Facebook", "Google", "Friend / referral", "Repeat client", "Other"];
const guestCountRangeOptions = [
  { label: "Under 50", value: "Under 50", hint: "Intimate celebration" },
  { label: "50-100", value: "50–100", hint: "Mid-size room" },
  { label: "100-200", value: "100–200", hint: "Large guest floor" },
  { label: "200+", value: "200+", hint: "Full-scale setup" },
];
const decorStyleOptions = [
  "Classic elegance",
  "Soft romantic",
  "Modern clean",
  "Garden luxe",
  "Traditional ceremony",
  "Bold glam",
];
const venueTypeOptions = [
  "Ballroom / hotel",
  "Banquet hall",
  "Church reception",
  "Private home",
  "Outdoor garden",
  "Mixed indoor-outdoor",
];
const budgetRangeOptions = [
  "Under $3,000",
  "$3,000-$5,000",
  "$5,000-$8,000",
  "$8,000+",
];
const guestCountSelectOptions = [
  "Under 50",
  "50-100",
  "100-200",
  "200+",
];
const paletteSuggestions = [
  "Ivory + champagne",
  "White + gold",
  "Blush + ivory",
  "Sage + cream",
  "Terracotta + candlelight",
  "Emerald + gold",
];
const steps = [
  { id: "event-type", label: "Type" },
  { id: "decor-style", label: "Style" },
  { id: "visual-builder", label: "Decor" },
  { id: "basics", label: "Date" },
  { id: "preview", label: "Photos" },
  { id: "contact", label: "Contact" },
  { id: "summary", label: "Submit" },
];

type GuidedPreviewCategoryConfig = {
  key: string;
  title: string;
  helper: string;
  keywords: string[];
  emptyState: string;
};

type DecorCategoryGroup = {
  title: string;
  emphasis: "primary" | "secondary";
  items: string[];
};

type DecorRefinementConfig = {
  label: string;
  options: string[];
};

const guidedPreviewCategories: Record<string, GuidedPreviewCategoryConfig> = {
  backdrop: {
    key: "backdrop",
    title: "Backdrop",
    helper: "Main focal wall or framing detail.",
    keywords: ["backdrop", "back drape", "drape", "arch"],
    emptyState: "No backdrop image is ready here yet. Add a note or upload inspiration if you already know the direction.",
  },
  ceiling_drape: {
    key: "ceiling_drape",
    title: "Ceiling Drape",
    helper: "Overhead drape, ceiling softness, and room height treatment.",
    keywords: ["ceiling drape", "ceiling", "drape", "overhead"],
    emptyState: "No ceiling-drape reference is available here yet. Add a note or upload inspiration if you want a softer ceiling treatment.",
  },
  head_table: {
    key: "head_table",
    title: "Head Table",
    helper: "Head table or sweetheart styling.",
    keywords: ["head table", "sweetheart", "bride and groom", "table setup"],
    emptyState: "No head-table reference is available here yet. Add a note or upload inspiration if you have a preference.",
  },
  centerpiece: {
    key: "centerpiece",
    title: "Centerpiece",
    helper: "Guest-table centerpieces and table rhythm.",
    keywords: ["centerpiece", "tablescape", "guest table", "table setup"],
    emptyState: "No centerpiece reference is available here yet. Add a note or upload inspiration if you want something specific.",
  },
  sweetheart_table: {
    key: "sweetheart_table",
    title: "Sweetheart Table",
    helper: "Couple-facing table styling separate from the main head table.",
    keywords: ["sweetheart", "sweetheart table", "couple table"],
    emptyState: "No sweetheart-table reference is available yet. Add a note or upload inspiration if you want a specific look.",
  },
  bride_groom_chairs: {
    key: "bride_groom_chairs",
    title: "Bride & Groom Chairs",
    helper: "Statement couple chairs and seat styling.",
    keywords: ["bride and groom", "couple chairs", "king chair", "chairs"],
    emptyState: "No chair reference is available yet. Add a note or upload inspiration if the seating style matters to you.",
  },
  florals: {
    key: "florals",
    title: "Floral Arrangement",
    helper: "Bouquets, arrangements, and floral accents.",
    keywords: ["floral", "flower", "bouquet", "arrangement"],
    emptyState: "No floral image is available here yet. Add a note or upload inspiration if florals matter to your vision.",
  },
  vip_table: {
    key: "vip_table",
    title: "VIP Table",
    helper: "VIP family table styling and placement direction.",
    keywords: ["vip", "family table", "vip table"],
    emptyState: "No VIP-table reference is available here yet. Add a note or upload inspiration if this table matters to the layout.",
  },
  guest_tables: {
    key: "guest_tables",
    title: "Guest Tables",
    helper: "Guest-table styling and overall layout feel.",
    keywords: ["guest table", "tablescape", "table", "charger", "napkin"],
    emptyState: "No guest-table reference is available here yet. Add a note or upload inspiration if you want a certain tablescape.",
  },
  plate_chargers: {
    key: "plate_chargers",
    title: "Plate Chargers",
    helper: "Chargers and place settings that sharpen the guest table.",
    keywords: ["charger", "plate charger", "tablescape", "guest table"],
    emptyState: "No charger reference is available here yet. Add a note or upload inspiration if a certain place setting matters to you.",
  },
  napkins: {
    key: "napkins",
    title: "Napkins",
    helper: "Napkin folds, fabrics, and guest-table finishing details.",
    keywords: ["napkin", "linen", "guest table", "tablescape"],
    emptyState: "No napkin styling reference is available here yet. Add a note or upload inspiration if linen details matter to the room.",
  },
  traditional_setup: {
    key: "traditional_setup",
    title: "Traditional Setup",
    helper: "Traditional Melsi styling and ceremonial detail.",
    keywords: ["melsi", "traditional", "ceremony"],
    emptyState: "No traditional setup reference is available here yet. Add a note or upload inspiration if you want to guide the look.",
  },
  bouquet: {
    key: "bouquet",
    title: "Bouquet",
    helper: "Personal florals and bouquet direction.",
    keywords: ["bouquet", "bridal bouquet", "flower"],
    emptyState: "No bouquet reference is available here yet. Add a note or upload inspiration if you want to guide the bouquet style.",
  },
  boutonniere: {
    key: "boutonniere",
    title: "Boutonniere",
    helper: "Small floral accessories for the groom or wedding party.",
    keywords: ["boutonniere", "lapel", "flower pin"],
    emptyState: "No boutonniere reference is available here yet. Add a note or upload inspiration if that detail matters to your vision.",
  },
  welcome_area: {
    key: "welcome_area",
    title: "Welcome Area",
    helper: "Entry styling, signage, or arrival detail.",
    keywords: ["welcome", "entrance", "entry", "sign"],
    emptyState: "No welcome-area image is available here yet. Add a note or upload inspiration if you want to shape the entry moment.",
  },
  dessert_table: {
    key: "dessert_table",
    title: "Dessert Table",
    helper: "Cake, dessert, or buffet focal styling.",
    keywords: ["cake", "dessert", "buffet", "sweets"],
    emptyState: "No dessert-table image is available here yet. Add a note or upload inspiration if this area matters to the room.",
  },
  other: {
    key: "other",
    title: "Other",
    helper: "Anything else you want us to design around.",
    keywords: [],
    emptyState: "Use this space to upload your own inspiration and explain a custom decor need.",
  },
};

const decorCategoryGroups: DecorCategoryGroup[] = [
  {
    title: "Main focal areas",
    emphasis: "primary",
    items: ["head_table", "backdrop", "sweetheart_table", "bride_groom_chairs", "vip_table"],
  },
  {
    title: "Guest experience",
    emphasis: "secondary",
    items: ["centerpiece", "guest_tables", "plate_chargers", "napkins", "ceiling_drape"],
  },
  {
    title: "Floral & specialty",
    emphasis: "secondary",
    items: ["florals", "bouquet", "boutonniere", "traditional_setup", "other"],
  },
];

const decorRefinementOptions: Record<string, DecorRefinementConfig> = {
  centerpiece: {
    label: "Centerpiece size",
    options: ["Small", "Medium", "Large"],
  },
  florals: {
    label: "Floral type",
    options: ["Silk", "Fresh Flower"],
  },
  backdrop: {
    label: "Backdrop direction",
    options: ["Floral", "Clean", "Layered"],
  },
  traditional_setup: {
    label: "Traditional setup",
    options: ["Coffee Ceremony", "Melsi", "Full Traditional"],
  },
};

const eventTypeCategoryMap: Record<string, string[]> = {
  Wedding: ["head_table", "backdrop", "sweetheart_table", "bride_groom_chairs", "vip_table", "centerpiece", "guest_tables", "plate_chargers", "napkins", "ceiling_drape", "florals", "bouquet", "boutonniere", "other"],
  "Traditional (Melsi)": ["traditional_setup", "backdrop", "head_table", "vip_table", "centerpiece", "guest_tables", "napkins", "ceiling_drape", "florals", "other"],
  Engagement: ["backdrop", "head_table", "sweetheart_table", "centerpiece", "guest_tables", "plate_chargers", "florals", "bouquet", "other"],
  Birthday: ["backdrop", "centerpiece", "guest_tables", "plate_chargers", "napkins", "dessert_table", "florals", "other"],
  "Baby Shower": ["backdrop", "centerpiece", "guest_tables", "napkins", "dessert_table", "welcome_area", "florals", "other"],
  "Bridal Shower": ["backdrop", "centerpiece", "guest_tables", "plate_chargers", "napkins", "dessert_table", "welcome_area", "florals", "other"],
  Graduation: ["backdrop", "guest_tables", "plate_chargers", "napkins", "welcome_area", "other"],
  "Corporate Event": ["backdrop", "vip_table", "guest_tables", "plate_chargers", "napkins", "welcome_area", "ceiling_drape", "florals", "other"],
  Anniversary: ["backdrop", "head_table", "sweetheart_table", "centerpiece", "guest_tables", "plate_chargers", "napkins", "florals", "bouquet", "other"],
  Other: ["backdrop", "head_table", "centerpiece", "guest_tables", "florals", "other"],
};

const recommendedDecorByEventType: Record<string, string[]> = {
  Wedding: ["head_table", "backdrop", "centerpiece", "sweetheart_table", "ceiling_drape"],
  "Traditional (Melsi)": ["traditional_setup", "backdrop", "florals", "guest_tables", "head_table"],
  Engagement: ["backdrop", "sweetheart_table", "centerpiece", "florals"],
  Birthday: ["backdrop", "centerpiece", "dessert_table", "guest_tables"],
  "Baby Shower": ["backdrop", "centerpiece", "dessert_table", "welcome_area"],
  "Bridal Shower": ["backdrop", "centerpiece", "dessert_table", "welcome_area"],
  Graduation: ["backdrop", "welcome_area", "guest_tables"],
  "Corporate Event": ["backdrop", "guest_tables", "welcome_area", "ceiling_drape"],
  Anniversary: ["backdrop", "sweetheart_table", "centerpiece", "florals"],
  Other: ["backdrop", "guest_tables", "centerpiece", "other"],
};

const eventTypeKeywords: Record<string, string[]> = {
  Wedding: ["wedding", "reception", "head table", "sweetheart"],
  "Traditional (Melsi)": ["melsi", "traditional", "ceremony"],
  Engagement: ["engagement", "proposal"],
  Birthday: ["birthday"],
  "Baby Shower": ["baby shower"],
  "Bridal Shower": ["bridal shower", "bride shower"],
  Graduation: ["graduation", "grad"],
  "Corporate Event": ["corporate", "conference", "brand"],
  Anniversary: ["anniversary"],
  Other: [],
};

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  eventType: "",
  customEventType: "",
  eventDate: "",
  guestCount: "",
  venueName: "",
  venueStatus: "",
  guestCountRange: "",
  indoorOutdoor: "",
  decorStyle: "",
  venueType: "",
  budgetRange: "",
  colorsTheme: "",
  inspirationNotes: "",
  visionBoardUrls: [] as string[],
  additionalInfo: "",
  requestedVendorCategories: [] as string[],
  vendorRequestNotes: "",
  preferredContactMethod: "",
  consultationPreferenceDate: "",
  consultationPreferenceTime: "",
  consultationVideoPlatform: "",
  referralSource: "",
  needsDeliverySetup: false,
  services: [] as string[],
};

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function getExperienceCardImage(
  cardKeywords: string[],
  portfolioItems: GalleryItem[],
  fallbackIndex: number
) {
  const match = portfolioItems.find((item) => {
    const haystack = `${normalizeSearchText(item.title)} ${normalizeSearchText(item.category)}`;
    return cardKeywords.some((keyword) => haystack.includes(normalizeSearchText(keyword)));
  });

  return match?.image_url ?? portfolioItems[fallbackIndex]?.image_url ?? portfolioItems[0]?.image_url ?? "";
}

function deriveEventExperience(eventType: string) {
  if (eventType === "Wedding") {
    return "wedding";
  }

  if (eventType === "Traditional (Melsi)") {
    return "traditional";
  }

  if (eventType === "Corporate Event") {
    return "corporate";
  }

  if (eventType === "Other") {
    return "other";
  }

  if (celebrationEventOptions.includes(eventType)) {
    return "celebrations";
  }

  return "";
}

function getGuidedPreviewOptions(
  eventType: string,
  selectedCategoryKeys: string[],
  portfolioItems: GalleryItem[]
) {
  const categoryKeys =
    selectedCategoryKeys.length > 0
      ? selectedCategoryKeys
      : eventType
        ? eventTypeCategoryMap[eventType] ?? eventTypeCategoryMap.Other
        : [];

  if (!categoryKeys.length) {
    return [];
  }

  const eventKeywords = eventTypeKeywords[eventType] ?? [];

  return categoryKeys.map((key) => {
    const config = guidedPreviewCategories[key];
    if (!config) {
      return null;
    }

    const eventMatches = portfolioItems.filter((item) => {
      const haystack = `${normalizeSearchText(item.title)} ${normalizeSearchText(item.category)}`;
      const matchesCategory = config.keywords.some((keyword) =>
        haystack.includes(normalizeSearchText(keyword))
      );

      if (!matchesCategory) {
        return false;
      }

      if (!eventKeywords.length) {
        return true;
      }

      return eventKeywords.some((keyword) =>
        haystack.includes(normalizeSearchText(keyword))
      );
    });

    const fallbackMatches = portfolioItems.filter((item) => {
      const haystack = `${normalizeSearchText(item.title)} ${normalizeSearchText(item.category)}`;
      return config.keywords.some((keyword) =>
        haystack.includes(normalizeSearchText(keyword))
      );
    });

    const images = (eventMatches.length ? eventMatches : fallbackMatches).slice(0, 5);

    return {
      ...config,
      images,
    };
  }).filter(Boolean) as Array<GuidedPreviewCategoryConfig & { images: GalleryItem[] }>;
}

function deriveRequestedServices(
  selectedCategories: string[],
  hasUploadsOrNotes: boolean,
  needsDeliverySetup: boolean
) {
  const labels = selectedCategories.map((key) => guidedPreviewCategories[key]?.title).filter(Boolean);

  if (hasUploadsOrNotes) {
    labels.push("Custom inspiration");
  }

  if (needsDeliverySetup) {
    labels.push("Delivery and setup");
  }

  return Array.from(new Set(labels));
}

function buildReviewNotes(
  form: typeof initialState,
  visualSelectionNotes?: string
) {
  const detailLines = [
    form.additionalInfo.trim(),
    form.preferredContactMethod
      ? `Consultation preference: ${form.preferredContactMethod}.`
      : "",
    form.consultationPreferenceDate
      ? `Requested consultation date: ${form.consultationPreferenceDate}.`
      : "",
    form.consultationPreferenceTime
      ? `Requested time: ${form.consultationPreferenceTime}.`
      : "",
    form.consultationVideoPlatform
      ? `Preferred video platform: ${form.consultationVideoPlatform}.`
      : "",
    form.referralSource ? `Referral source: ${form.referralSource}.` : "",
    form.guestCountRange ? `Guest count range: ${form.guestCountRange}.` : "",
    form.decorStyle ? `Preferred decor style: ${form.decorStyle}.` : "",
    form.venueType ? `Venue type: ${form.venueType}.` : "",
    form.budgetRange ? `Budget range: ${form.budgetRange}.` : "",
    visualSelectionNotes ?? "",
  ].filter(Boolean);

  return detailLines.join("\n\n");
}

function normalizeVendorCategory(category: string) {
  return category.startsWith("Other:")
    ? category.replace(/^Other:\s*/, "").trim()
    : category;
}

function requiresConsultationScheduling(method: string) {
  return method === "Phone call" || method === "Video meeting" || method === "In-person meeting";
}

function getAvailableVendorCategories(vendors: PublicVendorRecommendation[]) {
  const builtIn = VENDOR_SERVICE_CATEGORIES.filter((item) => item !== "Other");
  const custom = Array.from(
    new Set(
      vendors.flatMap((vendor) =>
        (vendor.service_categories ?? [])
          .map(normalizeVendorCategory)
          .filter(Boolean)
      )
    )
  );

  return Array.from(new Set([...builtIn, ...custom]));
}

function getMatchingVendors(
  vendors: PublicVendorRecommendation[],
  requestedCategories: string[]
) {
  if (requestedCategories.length === 0) {
    return [];
  }

  return vendors.filter((vendor) =>
    requestedCategories.some((category) =>
      (vendor.service_categories ?? []).some(
        (item) => normalizeVendorCategory(item) === category
      )
    )
  );
}

export default function EventRequestForm({
  vendors,
  portfolioItems,
}: {
  vendors: PublicVendorRecommendation[];
  portfolioItems: GalleryItem[];
}) {
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const decorSidebarRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState(initialState);
  const [step, setStep] = useState(0);
  const [mobileSummaryExpanded, setMobileSummaryExpanded] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [selectedEventExperience, setSelectedEventExperience] = useState("");
  const [showOptionalStyleFields, setShowOptionalStyleFields] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingVisionBoard, setUploadingVisionBoard] = useState(false);
  const [selectedDecorCategories, setSelectedDecorCategories] = useState<string[]>([]);
  const [selectedPreviewImages, setSelectedPreviewImages] = useState<Record<string, string[]>>({});
  const [categoryNotes, setCategoryNotes] = useState<Record<string, string>>({});
  const [categoryUploads, setCategoryUploads] = useState<Record<string, string[]>>({});
  const [categoryRefinements, setCategoryRefinements] = useState<Record<string, string>>({});
  const [activeDecorKey, setActiveDecorKey] = useState("");
  const [expandedCategoryImages, setExpandedCategoryImages] = useState<Record<string, boolean>>({});
  const [pendingCategoryFocus, setPendingCategoryFocus] = useState<string | null>(null);
  const effectiveEventType =
    form.eventType === "Other" ? form.customEventType.trim() : form.eventType;
  const experienceCards = useMemo(
    () =>
      primaryEventExperienceOptions.map((option, index) => ({
        ...option,
        imageUrl: getExperienceCardImage([...option.imageKeywords], portfolioItems, index),
      })),
    [portfolioItems]
  );
  const mainEventExperienceCards = experienceCards.filter((option) =>
    ["wedding", "traditional"].includes(option.key)
  );
  const otherEventExperienceCards = experienceCards.filter((option) =>
    ["celebrations", "corporate", "other"].includes(option.key)
  );

  const missingEventType = !form.eventType || (form.eventType === "Other" && !form.customEventType.trim());
  const missingEventDetails =
    !form.eventDate ||
    (!form.guestCount && !form.guestCountRange) ||
    !form.budgetRange;
  const missingContactDetails =
    !form.firstName ||
    !form.lastName ||
    !form.email ||
    !form.phone;
  const vendorCategories = getAvailableVendorCategories(vendors);
  const matchingVendors = getMatchingVendors(vendors, form.requestedVendorCategories);
  const guidedPreviewOptions = useMemo(
    () => getGuidedPreviewOptions(form.eventType, selectedDecorCategories, portfolioItems),
    [form.eventType, selectedDecorCategories, portfolioItems]
  );
  const availableGuidedCategories = useMemo(
    () =>
      getGuidedPreviewOptions(
        form.eventType,
        eventTypeCategoryMap[form.eventType] ?? eventTypeCategoryMap.Other,
        portfolioItems
      ),
    [form.eventType, portfolioItems]
  );
  const activeGuidedCategory =
    availableGuidedCategories.find((item) => item.key === activeDecorKey) ??
    availableGuidedCategories[0] ??
    null;
  const recommendedDecorKeys = recommendedDecorByEventType[form.eventType] ?? recommendedDecorByEventType.Other;
  const selectedCategoryKeys = selectedDecorCategories;
  const hasCategoryNotesOrUploads =
    Object.values(categoryNotes).some((value) => value?.trim()) ||
    Object.values(categoryUploads).some((urls) => urls.length > 0) ||
    form.visionBoardUrls.length > 0;
  const derivedServices = useMemo(
    () =>
      deriveRequestedServices(
        selectedCategoryKeys,
        hasCategoryNotesOrUploads,
        form.needsDeliverySetup
      ),
    [selectedCategoryKeys, hasCategoryNotesOrUploads, form.needsDeliverySetup]
  );

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth <= 900);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    setSelectedDecorCategories([]);
    setSelectedPreviewImages({});
    setCategoryNotes({});
    setCategoryUploads({});
    setCategoryRefinements({});
    setExpandedCategoryImages({});
    setActiveDecorKey(eventTypeCategoryMap[form.eventType]?.[0] ?? eventTypeCategoryMap.Other[0] ?? "");
  }, [form.eventType]);

  useEffect(() => {
    setSelectedEventExperience(deriveEventExperience(form.eventType));
  }, [form.eventType]);

  useEffect(() => {
    if (!availableGuidedCategories.length) {
      setActiveDecorKey("");
      return;
    }

    if (!activeDecorKey || !availableGuidedCategories.some((item) => item.key === activeDecorKey)) {
      setActiveDecorKey(availableGuidedCategories[0]?.key ?? "");
    }
  }, [activeDecorKey, availableGuidedCategories]);

  useEffect(() => {
    if (!pendingCategoryFocus || step !== 2) {
      return;
    }

    const sidebar = decorSidebarRef.current;

    if (!sidebar) {
      return;
    }

    const element = sidebar.querySelector<HTMLElement>(
      `[data-guided-category="${pendingCategoryFocus}"]`
    );

    if (!element) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      element.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
      setPendingCategoryFocus(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeDecorKey, pendingCategoryFocus, step]);

  useEffect(() => {
    const panel = detailPanelRef.current;
    if (!panel) {
      return;
    }

    panel.scrollTop = 0;
  }, [activeDecorKey]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const element = formCardRef.current;
      if (!element) {
        return;
      }

      const headerOffset = 132;
      const top = element.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({
        top: Math.max(top, 0),
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    setMobileSummaryExpanded(false);
  }, [step]);

  const preview = useMemo(() => {
    const eventNeedles = [form.eventType, form.decorStyle, form.venueType, form.colorsTheme]
      .filter(Boolean)
      .map((value) => value.toLowerCase());
    const activeExperience = selectedEventExperience || deriveEventExperience(form.eventType);
    const activeExperienceCard = experienceCards.find((item) => item.key === activeExperience);
    const previewContentByExperience = {
      wedding: {
        label: "Showing Wedding Direction",
        styleDescription:
          "An elevated wedding direction with focal florals, layered styling, and guest-ready details.",
        decorDirection:
          "Head table, backdrop, centerpieces, and soft draping for a polished celebration.",
      },
      traditional: {
        label: "Showing Traditional (Melsi) Direction",
        styleDescription:
          "A culturally grounded setup with layered traditional detail and warm guest-facing styling.",
        decorDirection:
          "Traditional focal setup, backdrop, florals, and supporting table styling.",
      },
      celebrations: {
        label: "Showing Celebration Direction",
        styleDescription:
          "A vibrant and styled celebration with playful focal points and clean finishing touches.",
        decorDirection:
          "Backdrop, focal decor, guest table details, and statement accents.",
      },
      corporate: {
        label: "Showing Corporate Event Direction",
        styleDescription:
          "A clean, refined setup with polished styling for hosted guest experiences.",
        decorDirection:
          "Stage/focal area, table styling, branded decor moments, and clean presentation.",
      },
      other: {
        label: "Showing Custom Event Direction",
        styleDescription:
          "A flexible decor direction shaped around your event type and visual preferences.",
        decorDirection:
          "Custom focal decor, tailored styling, and curated layout recommendations.",
      },
      default: {
        label: "Choose an event type to start building your visual direction.",
        styleDescription:
          "Choose an event type to start building your visual direction.",
        decorDirection:
          "Select a category on the left and the preview will respond here.",
      },
    } as const;

    const selectedImages = guidedPreviewOptions
      .flatMap((category) =>
        category.images.filter((item) =>
          (selectedPreviewImages[category.key] ?? []).includes(item.id)
        )
      ) as GalleryItem[];

    const uploadedImages = guidedPreviewOptions
      .flatMap((category) =>
        (categoryUploads[category.key] ?? []).map((url, index) => ({
          id: `${category.key}-upload-${index}`,
          image_url: url,
          title: `${category.title} inspiration`,
          category: category.title,
        }))
      )
      .slice(0, 4) as GalleryItem[];

    const matchedImages = portfolioItems
      .filter((item) => {
        const haystack = `${item.title} ${item.category ?? ""}`.toLowerCase();
        if (eventNeedles.length === 0) {
          return true;
        }
        return eventNeedles.some((needle) => haystack.includes(needle.split(" ")[0]));
      })
      .slice(0, 8);

    const eventCardImageUrls = new Set(
      experienceCards
        .filter((item) => item.key === activeExperience || (activeExperience === "celebrations" && item.key === "celebrations"))
        .map((item) => item.imageUrl)
        .filter(Boolean)
    );

    const recommendedDecorPool = recommendedDecorKeys.flatMap((key) => {
      const category = guidedPreviewCategories[key];

      if (!category) {
        return [];
      }

      return portfolioItems.filter((item) => {
        const haystack = `${normalizeSearchText(item.title)} ${normalizeSearchText(item.category)}`;
        const matchesCategory = category.keywords.some((keyword) =>
          haystack.includes(normalizeSearchText(keyword))
        );
        const matchesEvent =
          !eventNeedles.length ||
          eventNeedles.some((needle) => haystack.includes(normalizeSearchText(needle)));

        return matchesCategory && matchesEvent;
      });
    });

    const fallbackImages = [...recommendedDecorPool, ...matchedImages, ...portfolioItems]
      .filter((item, index, items) => {
        const isDuplicate = items.findIndex((candidate) => candidate.image_url === item.image_url) !== index;
        return !isDuplicate && !eventCardImageUrls.has(item.image_url);
      })
      .slice(0, 4);

    const images =
      selectedImages.length || uploadedImages.length
        ? [...selectedImages, ...uploadedImages].slice(0, 4)
        : fallbackImages;
    const leadImage = images[0] ?? null;
    const supportingImages = images.slice(1, 3);
    const baseContent =
      previewContentByExperience[activeExperience as keyof typeof previewContentByExperience] ??
      previewContentByExperience.default;

    const styleDescription =
      selectedImages.length || uploadedImages.length
        ? baseContent.styleDescription
        : baseContent.styleDescription;

    const decorDirection = derivedServices.includes("Delivery and setup")
      ? `${baseContent.decorDirection} Delivery and setup support can also be folded into the planning path.`
      : selectedImages.length
        ? `${baseContent.decorDirection} Based on ${selectedCategoryKeys.length} selected decor ${selectedCategoryKeys.length === 1 ? "element" : "elements"}.`
        : baseContent.decorDirection;

    const packageRecommendation =
      form.guestCountRange === "200+" || form.budgetRange === "$8,000+"
        ? "Best fit: a custom large-event package with layered room styling and logistics support."
        : "Best fit: a focused decor package centered on your main focal points and guest-table styling.";

    const selectedDecorSummary = activeGuidedCategory
      ? `Focused on ${activeGuidedCategory.title.toLowerCase()}`
      : selectedCategoryKeys.length
        ? `${selectedCategoryKeys.length} decor ${selectedCategoryKeys.length === 1 ? "element" : "elements"} selected`
        : "Choose decor elements to shape the room direction";

    return {
      images,
      leadImage,
      supportingImages,
      eventDirectionLabel: baseContent.label,
      previewStateLabel: activeExperienceCard?.title ?? "Visual Direction",
      isPlaceholder: !activeExperience,
      styleDescription,
      decorDirection,
      packageRecommendation,
      selectedImageCount: selectedImages.length,
      uploadedImageCount: uploadedImages.length,
      selectedDecorSummary,
    };
  }, [
    activeGuidedCategory,
    selectedEventExperience,
    experienceCards,
    form.budgetRange,
    form.colorsTheme,
    form.decorStyle,
    effectiveEventType,
    form.guestCount,
    form.guestCountRange,
    form.venueStatus,
    form.venueType,
    guidedPreviewOptions,
    derivedServices,
    portfolioItems,
    selectedCategoryKeys.length,
    selectedPreviewImages,
    categoryUploads,
  ]);
  const previewSignature = useMemo(
    () =>
      JSON.stringify({
        images: preview.images.map((item) => item.id),
        directionLabel: preview.eventDirectionLabel,
        eventType: effectiveEventType,
        style: form.decorStyle,
        palette: form.colorsTheme,
        services: derivedServices,
        vendors: form.requestedVendorCategories,
      }),
    [
      preview.images,
      preview.eventDirectionLabel,
      effectiveEventType,
      form.decorStyle,
      form.colorsTheme,
      derivedServices,
      form.requestedVendorCategories,
    ]
  );

  const completionPercent = Math.round(((step + 1) / steps.length) * 100);
  const startingInvestment = form.budgetRange
    ? form.budgetRange
    : selectedDecorCategories.length >= 4
      ? "$5,000+"
      : selectedDecorCategories.length >= 2
        ? "$3,000-$5,000"
        : "Custom quote";
  const mobileSummaryItems = useMemo(
    () => [
      { label: "Event type", value: effectiveEventType || "Not selected" },
      { label: "Decor style", value: form.decorStyle || "To be refined" },
      { label: "Decor pieces", value: selectedDecorCategories.length ? `${selectedDecorCategories.length} selected` : "None yet" },
      { label: "Venue", value: form.venueName || form.venueStatus || "Not added" },
      { label: "Inspiration", value: `${preview.selectedImageCount + preview.uploadedImageCount} image picks` },
      { label: "Color theme", value: form.colorsTheme || "Open palette" },
      { label: "Consultation", value: form.preferredContactMethod || "To be confirmed" },
    ],
    [
      effectiveEventType,
      form.colorsTheme,
      form.decorStyle,
      form.preferredContactMethod,
      form.venueName,
      form.venueStatus,
      preview.selectedImageCount,
      preview.uploadedImageCount,
      selectedDecorCategories.length,
    ]
  );

  const visualSelectionNotes = useMemo(() => {
    const lines = guidedPreviewOptions
      .map((category) => {
        const selected = category.images.filter(
          (item) => (selectedPreviewImages[category.key] ?? []).includes(item.id)
        );
        const uploads = categoryUploads[category.key] ?? [];
        const note = categoryNotes[category.key]?.trim();

        if (!selected.length && uploads.length === 0 && !note) {
          return "";
        }

        const pieces = [];
        if (selected.length) {
          pieces.push(
            `selected image${selected.length === 1 ? "" : "s"}: ${selected
              .map((item) => item.title)
              .join(", ")}`
          );
        }
        if (uploads.length) {
          pieces.push(`uploaded inspiration: ${uploads.length}`);
        }
        if (note) {
          pieces.push(`note: ${note}`);
        }
        if (categoryRefinements[category.key]) {
          pieces.push(`refinement: ${categoryRefinements[category.key]}`);
        }

        return `${category.title} — ${pieces.join(" • ")}`;
      })
      .filter(Boolean);

    return lines.length ? `Visual direction picks:\n${lines.map((line) => `- ${line}`).join("\n")}` : "";
  }, [categoryNotes, categoryRefinements, categoryUploads, guidedPreviewOptions, selectedPreviewImages]);

  const decorSelections = useMemo(
    () =>
      guidedPreviewOptions.map((category) => ({
        categoryKey: category.key,
        categoryTitle: category.title,
        selectedGalleryImageIds: selectedPreviewImages[category.key] ?? [],
        selectedGalleryImages: category.images
          .filter((item) => (selectedPreviewImages[category.key] ?? []).includes(item.id))
          .map((item) => ({
            id: item.id,
            title: item.title,
            image_url: item.image_url,
            category: item.category,
          })),
        uploadedImageUrls: categoryUploads[category.key] ?? [],
        refinement: categoryRefinements[category.key] ?? null,
        notes: categoryNotes[category.key]?.trim() || null,
      })),
    [categoryNotes, categoryRefinements, categoryUploads, guidedPreviewOptions, selectedPreviewImages]
  );
  function updateField(name: string, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function ensureDecorCategory(categoryKey: string) {
    setSelectedDecorCategories((current) =>
      current.includes(categoryKey) ? current : [...current, categoryKey]
    );
  }

  function removeDecorCategory(categoryKey: string) {
    setSelectedDecorCategories((current) => current.filter((item) => item !== categoryKey));
  }

  function focusDecorCategory(categoryKey: string) {
    setPendingCategoryFocus(categoryKey);
    setActiveDecorKey(categoryKey);
  }

  async function uploadInspirationFiles(files: File[]) {
    setUploadingVisionBoard(true);
    setError("");

    try {
      const payload = new FormData();
      files.forEach((file) => payload.append("files", file));

      const res = await fetch("/api/inquiries/vision-board", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to upload vision board images.");
        return [];
      }

      return data.urls ?? [];
    } catch {
      setError("Something went wrong while uploading inspiration images.");
      return [];
    } finally {
      setUploadingVisionBoard(false);
    }
  }

  async function handleCategoryUpload(
    categoryKey: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    if (form.visionBoardUrls.length + files.length > 5) {
      setError("Upload up to 5 inspiration images total.");
      e.target.value = "";
      return;
    }

    const urls = await uploadInspirationFiles(files);

    if (urls.length) {
      ensureDecorCategory(categoryKey);
      setCategoryUploads((current) => ({
        ...current,
        [categoryKey]: [...(current[categoryKey] ?? []), ...urls],
      }));
      setForm((prev) => ({
        ...prev,
        visionBoardUrls: [...prev.visionBoardUrls, ...urls],
      }));
    }

    e.target.value = "";
  }

  function toggleVendorCategory(category: string) {
    setForm((prev) => ({
      ...prev,
      requestedVendorCategories: prev.requestedVendorCategories.includes(category)
        ? prev.requestedVendorCategories.filter((item) => item !== category)
        : [...prev.requestedVendorCategories, category],
    }));
  }

  function clearCategorySelection(categoryKey: string) {
    const uploads = categoryUploads[categoryKey] ?? [];

    setSelectedPreviewImages((current) => {
      const next = { ...current };
      delete next[categoryKey];
      return next;
    });
    setCategoryNotes((current) => {
      const next = { ...current };
      delete next[categoryKey];
      return next;
    });
    setCategoryUploads((current) => {
      const next = { ...current };
      delete next[categoryKey];
      return next;
    });
    setCategoryRefinements((current) => {
      const next = { ...current };
      delete next[categoryKey];
      return next;
    });

    if (uploads.length) {
      setForm((prev) => ({
        ...prev,
        visionBoardUrls: prev.visionBoardUrls.filter((url) => !uploads.includes(url)),
      }));
    }

    removeDecorCategory(categoryKey);
    setActiveDecorKey((current) => (current === categoryKey ? "" : current));
  }

  function nextStep() {
    if (step === 0 && missingEventType) {
      setError("Select the event type before continuing.");
      return;
    }

    if (step === 3 && missingEventDetails) {
      setError("Add the event date, guest range, and budget before continuing.");
      return;
    }

    if (step === 5 && missingContactDetails) {
      setError("Add your contact details before continuing.");
      return;
    }

    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (missingEventDetails || missingEventType || missingContactDetails) {
      setError("Complete the event details and contact details before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        eventType: effectiveEventType,
        services: derivedServices,
        guestCount: form.guestCount ? Number(form.guestCount) : null,
        selectedDecorCategories,
        decorSelections,
        additionalInfo: buildReviewNotes(form, visualSelectionNotes),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const details =
        data?.details?.fieldErrors &&
        typeof data.details.fieldErrors === "object"
          ? Object.entries(data.details.fieldErrors)
              .flatMap(([, messages]) =>
                Array.isArray(messages) ? messages.filter(Boolean) : []
              )
              .join(" ")
          : "";

      setError(details || data.error || "Submission failed.");
      setLoading(false);
      return;
    }

    setSuccess("Your consultation request has been received.");
    setForm(initialState);
    setSelectedDecorCategories([]);
    setSelectedPreviewImages({});
    setCategoryNotes({});
    setCategoryUploads({});
    setCategoryRefinements({});
    setExpandedCategoryImages({});
    setStep(0);
    setLoading(false);
  }

  return (
    <div className="booking-shell">
      <section className="booking-hero card">
        <div>
          <p className="eyebrow">Consultation request</p>
          <h3>Build the event direction step by step.</h3>
          <p className="muted">
            Move through the request one clear step at a time, then preview and submit with confidence.
          </p>
        </div>
        <div className="booking-wizard-track" aria-label="Booking steps">
          {steps.map((item, index) => (
            <div
              key={item.id}
              className={`booking-track-step ${index === step ? "current" : ""} ${index < step ? "done" : ""}`}
            >
              <span>{index < step ? "✓" : index + 1}</span>
              <strong>{item.label}</strong>
              {index < steps.length - 1 ? <i aria-hidden="true" className="booking-track-line" /> : null}
            </div>
          ))}
        </div>
      </section>

      <div className="form-wrap booking-layout">
        <div ref={formCardRef} className="card form-card booking-form-card">
          <div className="booking-pane-head">
            <div className="booking-mobile-progress-card">
              <div className="booking-mobile-progress-meta">
                <span className="booking-pane-tag">Booking concierge</span>
                <p className="booking-progress-copy">{completionPercent}% complete</p>
              </div>
              <strong>{steps[step]?.label}</strong>
              <p className="muted">Step {step + 1} of {steps.length} • Your dream setup is taking shape</p>
              <div className="booking-mobile-progress-bar" aria-hidden="true">
                <span style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            {step === 0 ? (
              <section className="booking-panel">
                <div className="panel-head">
                  <p className="eyebrow">Step 1 of 5</p>
                  <h3>Select the event type.</h3>
                  <p className="muted">
                    Choose the kind of event experience you are planning first. We will tailor the next steps around it.
                  </p>
                </div>

                <div className="event-experience-sections">
                  <div className="event-experience-section">
                    <p className="event-experience-section-label">Main Events</p>
                    <div className="event-experience-grid">
                      {mainEventExperienceCards.map((option) => {
                        const isSelected = selectedEventExperience === option.key;

                        return (
                          <button
                            key={option.key}
                            type="button"
                            className={`event-experience-card ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              setSelectedEventExperience(option.key);

                              if (option.key === "celebrations") {
                                updateField("eventType", "");
                                updateField("customEventType", "");
                                return;
                              }

                              updateField("eventType", option.eventType ?? "");
                              if (option.key !== "other") {
                                updateField("customEventType", "");
                              }
                            }}
                            aria-pressed={isSelected}
                          >
                            {option.imageUrl ? (
                              <img src={option.imageUrl} alt={option.title} loading="lazy" />
                            ) : null}
                            <span className="event-experience-overlay" />
                            <span className="event-experience-accent" />
                            {isSelected ? <span className="event-experience-badge">Selected</span> : null}
                            <strong>{option.title}</strong>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="event-experience-section">
                    <p className="event-experience-section-label">Other Events</p>
                    <div className="event-experience-grid">
                      {otherEventExperienceCards.map((option) => {
                        const isSelected = selectedEventExperience === option.key;

                        return (
                          <button
                            key={option.key}
                            type="button"
                            className={`event-experience-card ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              setSelectedEventExperience(option.key);

                              if (option.key === "celebrations") {
                                updateField("eventType", "");
                                updateField("customEventType", "");
                                return;
                              }

                              updateField("eventType", option.eventType ?? "");
                              if (option.key !== "other") {
                                updateField("customEventType", "");
                              }
                            }}
                            aria-pressed={isSelected}
                          >
                            {option.imageUrl ? (
                              <img src={option.imageUrl} alt={option.title} loading="lazy" />
                            ) : null}
                            <span className="event-experience-overlay" />
                            <span className="event-experience-accent" />
                            {isSelected ? <span className="event-experience-badge">Selected</span> : null}
                            <strong>{option.title}</strong>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {selectedEventExperience === "celebrations" ? (
                  <div className="field">
                    <label className="label">Choose the celebration type</label>
                    <div className="option-pills">
                      {celebrationEventOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`pill ${form.eventType === option ? "selected" : ""}`}
                          onClick={() => updateField("eventType", option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {form.eventType === "Other" ? (
                  <div className="field">
                    <label className="label">Add your event type</label>
                    <input
                      className="input"
                      value={form.customEventType}
                      onChange={(e) => updateField("customEventType", e.target.value)}
                      placeholder="Example: Henna Night, Nikah, Baptism, Graduation Dinner"
                      required
                    />
                  </div>
                ) : null}
              </section>
            ) : null}

            {step === 1 ? (
              <section className="booking-panel">
                <div className="panel-head">
                  <p className="eyebrow">Step 2 of 5</p>
                  <h3>Add the event basics.</h3>
                  <p className="muted">Keep this step compact. Add the date, guest count, location, budget range, and the contact details we need to follow up.</p>
                </div>

                <div className="scope-card">
                  <h4>Event details</h4>
                  <div className="form-grid">
                    <div className="field">
                      <label className="label">Event Date</label>
                      <input className="input" type="date" value={form.eventDate} onChange={(e) => updateField("eventDate", e.target.value)} required />
                    </div>
                    <div className="field">
                      <label className="label">Guest Count Range</label>
                      <select
                        className="select"
                        value={form.guestCountRange}
                        onChange={(e) => updateField("guestCountRange", e.target.value)}
                        required
                      >
                        <option value="">Select a range</option>
                        {guestCountSelectOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label className="label">Exact Guest Count, if known</label>
                      <input className="input" type="number" min="0" value={form.guestCount} onChange={(e) => updateField("guestCount", e.target.value)} placeholder="Optional exact count" />
                    </div>
                    <div className="field">
                      <label className="label">Location / Venue</label>
                      <input className="input" value={form.venueName} onChange={(e) => updateField("venueName", e.target.value)} placeholder="Venue name, neighborhood, or city" />
                    </div>
                    <div className="field">
                      <label className="label">Budget Range</label>
                      <select
                        className="select"
                        value={form.budgetRange}
                        onChange={(e) => updateField("budgetRange", e.target.value)}
                      >
                        <option value="">Select a range</option>
                        {budgetRangeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="scope-card">
                  <h4>Contact details</h4>
                  <div className="form-grid">
                    <div className="field">
                      <label className="label">First Name</label>
                      <input className="input" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} required />
                    </div>
                    <div className="field">
                      <label className="label">Last Name</label>
                      <input className="input" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} required />
                    </div>
                    <div className="field">
                      <label className="label">Email</label>
                      <input className="input" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                    </div>
                    <div className="field">
                      <label className="label">Phone</label>
                      <input className="input" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} required />
                    </div>
                  </div>
                </div>

              </section>
            ) : null}

            {step === 2 ? (
              <section className="booking-panel">
                <div className="panel-head">
                  <p className="eyebrow">Step 3 of 5</p>
                  <h3>What would you like us to style?</h3>
                  <p className="muted">Use the decor list on the left, then refine the active item on the right. Your selections stay saved as you move between items.</p>
                </div>

                <div className="field">
                  <div className="guided-preview-builder guided-preview-builder--detail">
                    <div className="guided-preview-step-summary">
                      <div>
                        <p className="eyebrow">Decor progress</p>
                        <h4>{selectedDecorCategories.length} decor {selectedDecorCategories.length === 1 ? "item" : "items"} selected</h4>
                      </div>
                      <span>{effectiveEventType || "Event"} direction</span>
                    </div>
                    <div className="guided-preview-master-detail">
                      <aside ref={decorSidebarRef} className="guided-preview-sidebar">
                        {decorCategoryGroups.map((group) => {
                          const items = group.items
                            .filter((categoryKey) =>
                              (eventTypeCategoryMap[form.eventType] ?? eventTypeCategoryMap.Other).includes(categoryKey)
                            )
                            .map((categoryKey) => availableGuidedCategories.find((item) => item.key === categoryKey))
                            .filter(Boolean) as Array<GuidedPreviewCategoryConfig & { images: GalleryItem[] }>;

                          if (!items.length) {
                            return null;
                          }

                          return (
                            <div key={group.title} className="guided-preview-sidebar-group">
                              <p className="eyebrow">{group.title}</p>
                              <div className="guided-preview-sidebar-list">
                                {items.map((guidedCategory) => {
                                  const isSelected = selectedDecorCategories.includes(guidedCategory.key);
                                  const isActive = activeGuidedCategory?.key === guidedCategory.key;
                                  const selectedImageCount = (selectedPreviewImages[guidedCategory.key] ?? []).length;
                                  const uploadedImageCount = (categoryUploads[guidedCategory.key] ?? []).length;
                                  const noteCount = categoryNotes[guidedCategory.key]?.trim() ? 1 : 0;
                                  const refinement = categoryRefinements[guidedCategory.key];
                                  const hasContent =
                                    selectedImageCount > 0 ||
                                    uploadedImageCount > 0 ||
                                    noteCount > 0 ||
                                    Boolean(refinement);

                                  return (
                                    <button
                                      key={guidedCategory.key}
                                      type="button"
                                      data-guided-category={guidedCategory.key}
                                      className={`guided-preview-sidebar-item ${isActive ? "active" : ""} ${isSelected ? "selected" : ""}`}
                                      onClick={() => focusDecorCategory(guidedCategory.key)}
                                    >
                                      <div className="guided-preview-sidebar-copy">
                                        <strong>{guidedCategory.title}</strong>
                                      </div>
                                      <div className="guided-preview-sidebar-status">
                                        {recommendedDecorKeys.includes(guidedCategory.key) ? (
                                          <small className="guided-preview-category-badge">Recommended</small>
                                        ) : null}
                                        {isSelected || hasContent ? (
                                          <span className="guided-preview-category-check" aria-hidden="true">
                                            {selectedImageCount > 0 ? selectedImageCount : "✓"}
                                          </span>
                                        ) : null}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </aside>

                      <div
                        key={activeGuidedCategory?.key ?? "empty"}
                        ref={detailPanelRef}
                        className="guided-preview-detail-panel"
                      >
                        {activeGuidedCategory ? (
                          <>
                            <div className="guided-preview-category-head">
                              <div>
                                <h4>{activeGuidedCategory.title}</h4>
                                <p className="muted">{activeGuidedCategory.helper}</p>
                              </div>
                              <div className="guided-preview-stage-nav">
                                <button
                                  type="button"
                                  className={`btn ${selectedDecorCategories.includes(activeGuidedCategory.key) ? "secondary" : ""}`}
                                  onClick={() => {
                                    if (selectedDecorCategories.includes(activeGuidedCategory.key)) {
                                      clearCategorySelection(activeGuidedCategory.key);
                                      return;
                                    }

                                    ensureDecorCategory(activeGuidedCategory.key);
                                  }}
                                >
                                  {selectedDecorCategories.includes(activeGuidedCategory.key) ? "Remove from request" : "Include this item"}
                                </button>
                              </div>
                            </div>

                            {decorRefinementOptions[activeGuidedCategory.key] ? (
                              <div className="field">
                                <label className="label">{decorRefinementOptions[activeGuidedCategory.key].label}</label>
                                <div className="option-pills">
                                  {decorRefinementOptions[activeGuidedCategory.key].options.map((option) => (
                                    <button
                                      key={option}
                                      type="button"
                                      className={`pill ${categoryRefinements[activeGuidedCategory.key] === option ? "selected" : ""}`}
                                      onClick={() => {
                                        const nextValue =
                                          categoryRefinements[activeGuidedCategory.key] === option ? "" : option;
                                        setCategoryRefinements((current) => ({
                                          ...current,
                                          [activeGuidedCategory.key]: nextValue,
                                        }));
                                        if (nextValue) {
                                          ensureDecorCategory(activeGuidedCategory.key);
                                        }
                                      }}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {activeGuidedCategory.images.length ? (
                              <>
                                <div className="guided-preview-options">
                                  {(expandedCategoryImages[activeGuidedCategory.key]
                                    ? activeGuidedCategory.images
                                    : activeGuidedCategory.images.slice(0, 3)
                                  ).map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      className={`guided-preview-option ${(selectedPreviewImages[activeGuidedCategory.key] ?? []).includes(item.id) ? "selected" : ""}`}
                                      onClick={() => {
                                        setSelectedPreviewImages((current) => {
                                          const currentIds = current[activeGuidedCategory.key] ?? [];
                                          const nextIds = currentIds.includes(item.id)
                                            ? currentIds.filter((id) => id !== item.id)
                                            : [...currentIds, item.id];

                                          if (nextIds.length > 0) {
                                            ensureDecorCategory(activeGuidedCategory.key);
                                          }

                                          return {
                                            ...current,
                                            [activeGuidedCategory.key]: nextIds,
                                          };
                                        });
                                      }}
                                    >
                                      <img src={item.image_url} alt={item.title} loading="lazy" />
                                      {(selectedPreviewImages[activeGuidedCategory.key] ?? []).includes(item.id) ? (
                                        <span className="guided-preview-option-check" aria-hidden="true">
                                          ✓
                                        </span>
                                      ) : null}
                                      <span>{item.title}</span>
                                    </button>
                                  ))}
                                </div>
                                {activeGuidedCategory.images.length > 3 ? (
                                  <button
                                    type="button"
                                    className="guided-preview-more"
                                    onClick={() =>
                                      setExpandedCategoryImages((current) => ({
                                        ...current,
                                        [activeGuidedCategory.key]: !current[activeGuidedCategory.key],
                                      }))
                                    }
                                  >
                                    {expandedCategoryImages[activeGuidedCategory.key] ? "Show fewer images" : `View ${activeGuidedCategory.images.length - 3} more`}
                                  </button>
                                ) : null}
                              </>
                            ) : (
                              <div className="guided-preview-empty">
                                <p className="muted">{activeGuidedCategory.emptyState}</p>
                              </div>
                            )}

                            <div className="guided-preview-support">
                              <textarea
                                className="textarea"
                                value={categoryNotes[activeGuidedCategory.key] ?? ""}
                                onChange={(e) => {
                                  const nextValue = e.target.value;
                                  setCategoryNotes((current) => ({
                                    ...current,
                                    [activeGuidedCategory.key]: nextValue,
                                  }));
                                  if (nextValue.trim()) {
                                    ensureDecorCategory(activeGuidedCategory.key);
                                  }
                                }}
                                placeholder="What do you like about this design?"
                              />
                              <label className="guided-preview-upload">
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleCategoryUpload(activeGuidedCategory.key, e)}
                                  disabled={uploadingVisionBoard || form.visionBoardUrls.length >= 5}
                                />
                                <strong>Have a different idea? Upload your inspiration.</strong>
                                <span>{(categoryUploads[activeGuidedCategory.key] ?? []).length} uploaded</span>
                              </label>
                            </div>

                            <div className="guided-preview-global-note">
                              <label className="label">General inspiration note</label>
                              <textarea
                                className="textarea"
                                value={form.inspirationNotes}
                                onChange={(e) => updateField("inspirationNotes", e.target.value)}
                                placeholder="Anything important you want us to keep in mind."
                              />
                            </div>
                          </>
                        ) : (
                          <div className="guided-preview-empty">
                            <p className="muted">Choose a decor item from the left to start configuring it.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <section className="booking-panel">
                <div className="panel-head">
                  <p className="eyebrow">Step 4 of 5</p>
                  <h3>Live Preview</h3>
                  <p className="muted">See the current event direction in one place before moving to the final submit step.</p>
                </div>

                <div className="scope-card booking-preview-step-card">
                  <div className="booking-summary-head">
                    <span className="booking-pane-tag">Live Preview</span>
                    <h3>Your Event Preview</h3>
                    <p className="muted">Built from your selections</p>
                    <div className={`booking-preview-state ${preview.isPlaceholder ? "placeholder" : ""}`}>
                      {preview.eventDirectionLabel}
                    </div>
                  </div>

                  <div className="booking-preview-stage">
                    {preview.leadImage ? (
                      <div className="booking-preview-hero">
                        <img
                          key={`preview-hero-${previewSignature}`}
                          src={preview.leadImage.image_url}
                          alt={preview.leadImage.title}
                          loading="lazy"
                        />
                        <div className="booking-preview-hero-copy">
                          <span>Based on your selection</span>
                          <strong>{preview.previewStateLabel}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="booking-preview-hero booking-preview-hero--empty">
                        <div className="booking-preview-empty-copy">
                          <strong>Choose decor items and visual references to build your preview.</strong>
                        </div>
                      </div>
                    )}

                    <div className="booking-preview-meta-row">
                      <span className="booking-preview-meta-pill">{preview.selectedDecorSummary}</span>
                      {preview.selectedImageCount ? (
                        <span className="booking-preview-meta-pill">{preview.selectedImageCount} selected image{preview.selectedImageCount === 1 ? "" : "s"}</span>
                      ) : null}
                      {preview.uploadedImageCount ? (
                        <span className="booking-preview-meta-pill">{preview.uploadedImageCount} upload{preview.uploadedImageCount === 1 ? "" : "s"}</span>
                      ) : null}
                    </div>

                    {preview.supportingImages.length ? (
                      <div className="booking-preview-grid booking-preview-grid--animated">
                        {preview.supportingImages.map((item) => (
                          <div key={`${item.id}-${previewSignature}`} className="booking-preview-image">
                            <img src={item.image_url} alt={item.title} loading="lazy" />
                            <span>{item.category || item.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="summary-stack">
                      <div className="booking-preview-copy booking-preview-copy--highlight">
                        <small className="booking-preview-kicker">Style snapshot</small>
                        <p>{preview.styleDescription}</p>
                      </div>
                      <div className="booking-preview-copy">
                        <small className="booking-preview-kicker">Recommended decor direction</small>
                        <p>{preview.decorDirection}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {step === 4 ? (
              <section className="booking-panel">
                <div className="panel-head">
                  <p className="eyebrow">Step 5 of 5</p>
                  <h3>Review and submit.</h3>
                  <p className="muted">Confirm the request details, add the remaining consultation preferences, and submit when ready.</p>
                </div>

                <div className="booking-review-grid">
                  <div className="scope-card booking-review-card">
                    <h4>Event summary</h4>
                    <div className="review-grid">
                      <p><strong>Event type:</strong> {effectiveEventType || "—"}</p>
                      <p><strong>Event date:</strong> {form.eventDate || "—"}</p>
                      <p><strong>Guest count:</strong> {form.guestCount || form.guestCountRange || "—"}</p>
                      <p><strong>Location:</strong> {form.venueName || "—"}</p>
                      <p><strong>Budget range:</strong> {form.budgetRange || "—"}</p>
                    </div>
                  </div>

                  <div className="scope-card booking-review-card">
                    <h4>Contact & consultation</h4>
                    <div className="review-grid">
                      <p><strong>Name:</strong> {[form.firstName, form.lastName].filter(Boolean).join(" ") || "—"}</p>
                      <p><strong>Email:</strong> {form.email || "—"}</p>
                      <p><strong>Phone:</strong> {form.phone || "—"}</p>
                      <p><strong>Preferred consultation:</strong> {form.preferredContactMethod || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="scope-card booking-review-card">
                  <h4>Selected decor items</h4>
                  {guidedPreviewOptions.length ? (
                    <div className="booking-review-decor-grid">
                      {guidedPreviewOptions.map((category) => {
                        const selected = category.images.filter((item) =>
                          (selectedPreviewImages[category.key] ?? []).includes(item.id)
                        );
                        const uploads = categoryUploads[category.key] ?? [];
                        const note = categoryNotes[category.key]?.trim();
                        const refinement = categoryRefinements[category.key];
                        const hasContent =
                          selected.length > 0 ||
                          uploads.length > 0 ||
                          Boolean(note) ||
                          Boolean(refinement);

                        return (
                          <div key={category.key} className={`booking-review-decor-card ${hasContent ? "" : "booking-review-decor-card--empty"}`}>
                            <div className="booking-review-decor-head">
                              <strong>{category.title}</strong>
                              {refinement ? <span>{refinement}</span> : null}
                            </div>

                            {selected.length ? (
                              <div className="booking-review-media-grid">
                                {selected.slice(0, 3).map((item) => (
                                  <img key={item.id} src={item.image_url} alt={item.title} loading="lazy" />
                                ))}
                              </div>
                            ) : null}

                            {uploads.length ? (
                              <div className="booking-review-media-grid">
                                {uploads.slice(0, 3).map((url, index) => (
                                  <img key={`${category.key}-upload-${index}`} src={url} alt={`${category.title} upload ${index + 1}`} loading="lazy" />
                                ))}
                              </div>
                            ) : null}

                            {note ? <p className="muted">{note}</p> : null}
                            {!hasContent ? <p className="muted">Selected for review. No image or note added yet.</p> : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="muted">No decor items selected yet.</p>
                  )}
                </div>

                <div className="summary-stack">
                  <div className="booking-edit-links">
                    <button type="button" className="btn secondary" onClick={() => setStep(0)}>Edit Event Type</button>
                    <button type="button" className="btn secondary" onClick={() => setStep(1)}>Edit Basics</button>
                    <button type="button" className="btn secondary" onClick={() => setStep(2)}>Edit Visual Builder</button>
                  </div>
                </div>

                <div className="scope-card booking-review-card">
                  <h4>Final details</h4>
                  <div className="field">
                    <label className="label">How should we start the consultation?</label>
                    <div className="option-pills">
                      {consultationOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`pill ${form.preferredContactMethod === option ? "selected" : ""}`}
                          onClick={() => {
                            updateField("preferredContactMethod", option);
                            if (option !== "Video meeting") {
                              updateField("consultationVideoPlatform", "");
                            }
                            if (!requiresConsultationScheduling(option)) {
                              updateField("consultationPreferenceDate", "");
                              updateField("consultationPreferenceTime", "");
                            }
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {requiresConsultationScheduling(form.preferredContactMethod) ? (
                    <div className="form-grid">
                      <div className="field">
                        <label className="label">Preferred consultation day</label>
                        <input
                          className="input"
                          type="date"
                          value={form.consultationPreferenceDate}
                          onChange={(e) => updateField("consultationPreferenceDate", e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="label">Preferred consultation time</label>
                        <input
                          className="input"
                          value={form.consultationPreferenceTime}
                          onChange={(e) => updateField("consultationPreferenceTime", e.target.value)}
                          placeholder="Example: Weekdays after 6 PM"
                        />
                      </div>
                    </div>
                  ) : null}

                  {form.preferredContactMethod === "Video meeting" ? (
                    <div className="field">
                      <label className="label">Preferred video platform</label>
                      <div className="option-pills">
                        {videoPlatformOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={`pill ${form.consultationVideoPlatform === option ? "selected" : ""}`}
                            onClick={() => updateField("consultationVideoPlatform", option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="field">
                    <label className="label">Venue Status</label>
                    <div className="option-pills">
                      {venueStatusOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`pill ${form.venueStatus === option ? "selected" : ""}`}
                          onClick={() => updateField("venueStatus", option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => setShowOptionalStyleFields((current) => !current)}
                    >
                      {showOptionalStyleFields ? "Hide Optional Style Details" : "Add Optional Style Details"}
                    </button>
                  </div>

                  {showOptionalStyleFields ? (
                    <div className="booking-review-subgrid">
                      <div className="field">
                        <label className="label">Decor Style</label>
                        <div className="option-pills">
                          {decorStyleOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`pill ${form.decorStyle === option ? "selected" : ""}`}
                              onClick={() => updateField("decorStyle", option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="field">
                        <label className="label">Color Palette</label>
                        <div className="option-pills">
                          {paletteSuggestions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`pill ${form.colorsTheme === option ? "selected" : ""}`}
                              onClick={() => updateField("colorsTheme", option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        <input className="input" value={form.colorsTheme} onChange={(e) => updateField("colorsTheme", e.target.value)} placeholder="Or type your own palette" style={{ marginTop: "12px" }} />
                      </div>
                    </div>
                  ) : null}

                  <div className="field">
                    <label className="checkline">
                      <input
                        type="checkbox"
                        checked={form.needsDeliverySetup}
                        onChange={(e) => updateField("needsDeliverySetup", e.target.checked)}
                      />
                      <span>Include delivery, setup, or teardown support in the request.</span>
                    </label>
                  </div>

                  <div className="field">
                    <label className="label">Partner vendor support</label>
                    <div className="option-pills">
                      {vendorCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          className={`pill ${form.requestedVendorCategories.includes(category) ? "selected" : ""}`}
                          onClick={() => toggleVendorCategory(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label className="label">Anything else we should know before the consultation?</label>
                  <textarea
                    className="textarea"
                    value={form.additionalInfo}
                    onChange={(e) => updateField("additionalInfo", e.target.value)}
                    placeholder="Budget expectations, timing constraints, venue rules, or family priorities."
                  />
                </div>

                {form.requestedVendorCategories.length ? (
                  <div className="field">
                    <label className="label">Vendor notes</label>
                    <textarea
                      className="textarea"
                      value={form.vendorRequestNotes}
                      onChange={(e) => updateField("vendorRequestNotes", e.target.value)}
                      placeholder="Budget range, location, or style notes for vendors."
                    />
                  </div>
                ) : null}
              </section>
            ) : null}

            {success ? <p className="success">{success}</p> : null}
            {error ? <p className="error">{error}</p> : null}

            <div className="booking-actions">
              <button type="button" className="btn secondary" onClick={previousStep} disabled={step === 0 || loading}>
                Back
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  className="btn"
                  onClick={nextStep}
                  disabled={(step === 0 && missingEventType) || (step === 3 && missingEventDetails) || (step === 5 && missingContactDetails)}
                >
                  Next Step
                </button>
              ) : (
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Send Consultation Request"}
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
