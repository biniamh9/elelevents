"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryItem } from "@/lib/gallery";
import type { SiteSocialLinks } from "@/lib/social-links";
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
    preferredImageUrl:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=80",
    imageKeywords: ["wedding", "reception", "head table"],
  },
  {
    key: "traditional",
    title: "Traditional (Melsi)",
    eventType: "Traditional (Melsi)",
    preferredImageUrl:
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1400&q=80",
    imageKeywords: ["melsi", "traditional"],
  },
  {
    key: "celebrations",
    title: "Celebrations",
    eventType: null,
    preferredImageUrl:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&q=80",
    imageKeywords: ["birthday", "baby shower", "anniversary", "bridal shower", "engagement"],
  },
  {
    key: "corporate",
    title: "Corporate Events",
    eventType: "Corporate Event",
    preferredImageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80",
    imageKeywords: ["corporate", "conference", "brand"],
  },
  {
    key: "other",
    title: "Other",
    eventType: "Other",
    preferredImageUrl:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=80",
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
const decorDirectionOptions = [
  {
    key: "Classic elegance",
    title: "Elegant",
    subtitle: "Soft florals, layered focal styling, and timeless polish.",
    keywords: ["head table", "wedding", "reception", "white floral"],
  },
  {
    key: "Traditional ceremony",
    title: "Traditional",
    subtitle: "Ceremonial detail with cultural warmth and statement presence.",
    keywords: ["melsi", "traditional", "ceremony"],
  },
  {
    key: "Modern clean",
    title: "Modern",
    subtitle: "Clean lines, refined balance, and crisp room styling.",
    keywords: ["backdrop", "modern", "clean", "white"],
  },
  {
    key: "Garden luxe",
    title: "Luxury",
    subtitle: "Editorial florals, candlelight, and an immersive grand reveal.",
    keywords: ["floral", "luxury", "ceiling drape", "romantic"],
  },
] as const;
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
const momentSizeOptions = ["Small", "Medium", "Large"] as const;
const momentFloralDensityOptions = ["Light", "Full", "Luxury"] as const;
const steps = [
  {
    id: "vision",
    label: "Type",
    title: "Let us know what you are planning",
    blurb: "Choose the celebration first so the next steps can adapt around your event.",
  },
  {
    id: "style",
    label: "Style",
    title: "Tell us your style",
    blurb: "Select the atmosphere and inspiration that best matches how you want the room to feel.",
  },
  {
    id: "decor",
    label: "Decor",
    title: "Select your decoration",
    blurb: "Choose the focal moments that matter most and refine them one by one without feeling overwhelmed.",
  },
  {
    id: "details",
    label: "Details",
    title: "Fill the form",
    blurb: "Add the key event details and the best contact information so we can prepare your consultation.",
  },
  {
    id: "review",
    label: "Review",
    title: "Review and approve",
    blurb: "Review everything clearly before you send your request and move into consultation.",
  },
];

type GuidedPreviewCategoryConfig = {
  key: string;
  title: string;
  helper: string;
  keywords: string[];
  emptyState: string;
};

type DecorRefinementConfig = {
  label: string;
  options: string[];
};

type MomentCustomizationField =
  | "size"
  | "floralDensity"
  | "colorPalette"
  | "inspirationLink"
  | "designerLed";

type SubmittedRequestSummary = {
  customerName: string;
  eventType: string;
  eventDate: string;
  venue: string;
  decorStyle: string;
  decorCount: number;
  decorLabels: string[];
  inspirationCount: number;
  consultationType: string;
  leadImageUrl: string;
  calendarReminderUrl: string;
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

type KeyMomentCard = {
  key: string;
  title: string;
  description: string;
  imageUrl: string;
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

function getEstimatedGuestCount(guestCount: string, guestCountRange: string) {
  if (guestCount) {
    return Number(guestCount);
  }

  switch (guestCountRange) {
    case "Under 50":
      return 40;
    case "50–100":
    case "50-100":
      return 75;
    case "100–200":
    case "100-200":
      return 150;
    case "200+":
      return 220;
    default:
      return null;
  }
}

function getVenueComplexityMultiplier(venueType: string, venueStatus: string) {
  const venueMultiplierMap: Record<string, number> = {
    "Ballroom / hotel": 1.1,
    "Banquet hall": 1.05,
    "Church reception": 1.08,
    "Private home": 1,
    "Outdoor garden": 1.18,
    "Mixed indoor-outdoor": 1.14,
  };

  const statusMultiplierMap: Record<string, number> = {
    Booked: 1,
    "Still looking": 1.03,
    Home: 1,
    Church: 1.06,
    Hall: 1.05,
    "Hotel / ballroom": 1.1,
  };

  return Number(
    ((venueMultiplierMap[venueType] ?? 1) * (statusMultiplierMap[venueStatus] ?? 1)).toFixed(2)
  );
}

function buildReviewNotes(
  form: typeof initialState,
  visualSelectionNotes?: string,
  momentGuidanceRequested?: boolean
) {
  const detailLines = [
    form.additionalInfo.trim(),
    momentGuidanceRequested ? "Client requested Elel to guide key moment selection." : "",
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
  socialLinks,
}: {
  vendors: PublicVendorRecommendation[];
  portfolioItems: GalleryItem[];
  socialLinks: SiteSocialLinks;
}) {
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState(initialState);
  const [step, setStep] = useState(0);
  const [selectedEventExperience, setSelectedEventExperience] = useState("");
  const [showOptionalStyleFields, setShowOptionalStyleFields] = useState(false);
  const [success, setSuccess] = useState("");
  const [submittedSummary, setSubmittedSummary] = useState<SubmittedRequestSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingVisionBoard, setUploadingVisionBoard] = useState(false);
  const [selectedDecorCategories, setSelectedDecorCategories] = useState<string[]>([]);
  const [selectedPreviewImages, setSelectedPreviewImages] = useState<Record<string, string[]>>({});
  const [categoryNotes, setCategoryNotes] = useState<Record<string, string>>({});
  const [categoryUploads, setCategoryUploads] = useState<Record<string, string[]>>({});
  const [categoryRefinements, setCategoryRefinements] = useState<Record<string, string>>({});
  const [categorySizes, setCategorySizes] = useState<Record<string, string>>({});
  const [categoryFloralDensity, setCategoryFloralDensity] = useState<Record<string, string>>({});
  const [categoryPalettes, setCategoryPalettes] = useState<Record<string, string>>({});
  const [categoryInspirationLinks, setCategoryInspirationLinks] = useState<Record<string, string>>({});
  const [categoryDesignerLed, setCategoryDesignerLed] = useState<Record<string, boolean>>({});
  const [momentGuidanceRequested, setMomentGuidanceRequested] = useState(false);
  const [activeDecorKey, setActiveDecorKey] = useState("");
  const [expandedCategoryImages, setExpandedCategoryImages] = useState<Record<string, boolean>>({});
  const effectiveEventType =
    form.eventType === "Other" ? form.customEventType.trim() : form.eventType;
  const experienceCards = useMemo(
    () =>
      primaryEventExperienceOptions.map((option, index) => ({
        ...option,
        imageUrl:
          option.preferredImageUrl ??
          getExperienceCardImage([...option.imageKeywords], portfolioItems, index),
      })),
    [portfolioItems]
  );
  const mainEventExperienceCards = experienceCards.filter((option) =>
    ["wedding", "traditional"].includes(option.key)
  );
  const otherEventExperienceCards = experienceCards.filter((option) =>
    ["celebrations", "corporate", "other"].includes(option.key)
  );
  const decorDirectionCards = useMemo(
    () =>
      decorDirectionOptions.map((option, index) => ({
        ...option,
        imageUrl: getExperienceCardImage([...option.keywords], portfolioItems, index + 1),
      })),
    [portfolioItems]
  );

  const missingEventType = !form.eventType || (form.eventType === "Other" && !form.customEventType.trim());
  const missingEventDetails =
    !form.eventDate ||
    (!form.guestCount && !form.guestCountRange);
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
    guidedPreviewOptions.find((item) => item.key === activeDecorKey) ??
    guidedPreviewOptions[0] ??
    availableGuidedCategories.find((item) => item.key === activeDecorKey) ??
    availableGuidedCategories[0] ??
    null;
  const activeGuidedCategoryIsDesignerLed = activeGuidedCategory
    ? Boolean(categoryDesignerLed[activeGuidedCategory.key])
    : false;
  const recommendedDecorKeys = recommendedDecorByEventType[form.eventType] ?? recommendedDecorByEventType.Other;
  const keyMomentCards = useMemo(() => {
    const cards: Array<Omit<KeyMomentCard, "imageUrl">> = [
      {
        key: "not_sure",
        title: "Not sure, guide me",
        description: "Let our team recommend the right moments to prioritize.",
      },
      {
        key: "head_table",
        title: "Head Table",
        description: "Elevate the couple-facing focal table.",
      },
      {
        key: "backdrop",
        title: "Backdrop",
        description: "Create the hero frame for the room.",
      },
      {
        key: "centerpiece",
        title: "Centerpieces",
        description: "Shape the guest-table rhythm.",
      },
      {
        key: "guest_tables",
        title: "Guest Tables",
        description: "Style the guest seating experience.",
      },
      {
        key: "ceiling_drape",
        title: "Ceiling Drapes",
        description: "Soften the room overhead with draping.",
      },
      {
        key: "full_package",
        title: "Full Package",
        description: "Let us shape the full room direction.",
      },
    ];

    const mapped = cards.map((card, index) => {
      const keywords =
        card.key === "full_package" || card.key === "not_sure"
          ? recommendedDecorKeys.flatMap((key) => guidedPreviewCategories[key]?.keywords ?? [])
          : guidedPreviewCategories[card.key]?.keywords ?? [];

      return {
        ...card,
        imageUrl: getExperienceCardImage(keywords, portfolioItems, index + 2),
      };
    });

    if (form.eventType === "Traditional (Melsi)") {
      mapped.splice(1, 0, {
        key: "traditional_setup",
        title: "Traditional Setup",
        description: "Highlight ceremonial moments with warmth.",
        imageUrl: getExperienceCardImage(guidedPreviewCategories.traditional_setup.keywords, portfolioItems, 3),
      });
    }

    return mapped;
  }, [form.eventType, portfolioItems, recommendedDecorKeys]);
  const configuredDecorCount = useMemo(
    () =>
      selectedDecorCategories.filter((key) => {
        const hasImages = (selectedPreviewImages[key] ?? []).length > 0;
        const hasUploads = (categoryUploads[key] ?? []).length > 0;
        const hasNote = Boolean(categoryNotes[key]?.trim());
        const hasRefinement = Boolean(categoryRefinements[key]);
        const hasSize = Boolean(categorySizes[key]);
        const hasDensity = Boolean(categoryFloralDensity[key]);
        const hasPalette = Boolean(categoryPalettes[key]);
        const hasLink = Boolean(categoryInspirationLinks[key]?.trim());
        const isDesignerLed = Boolean(categoryDesignerLed[key]);
        return hasImages || hasUploads || hasNote || hasRefinement || hasSize || hasDensity || hasPalette || hasLink || isDesignerLed;
      }).length,
    [
      selectedDecorCategories,
      selectedPreviewImages,
      categoryUploads,
      categoryNotes,
      categoryRefinements,
      categorySizes,
      categoryFloralDensity,
      categoryPalettes,
      categoryInspirationLinks,
      categoryDesignerLed,
    ]
  );
  const selectedCategoryKeys = selectedDecorCategories;
  const hasCategoryNotesOrUploads =
    Object.values(categoryNotes).some((value) => value?.trim()) ||
    Object.values(categoryUploads).some((urls) => urls.length > 0) ||
    Object.values(categoryInspirationLinks).some((value) => value?.trim()) ||
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
    setSelectedDecorCategories([]);
    setSelectedPreviewImages({});
    setCategoryNotes({});
    setCategoryUploads({});
    setCategoryRefinements({});
    setCategorySizes({});
    setCategoryFloralDensity({});
    setCategoryPalettes({});
    setCategoryInspirationLinks({});
    setCategoryDesignerLed({});
    setMomentGuidanceRequested(false);
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

    const activePool = guidedPreviewOptions.length ? guidedPreviewOptions : availableGuidedCategories;

    if (!activeDecorKey || !activePool.some((item) => item.key === activeDecorKey)) {
      setActiveDecorKey(activePool[0]?.key ?? "");
    }
  }, [activeDecorKey, availableGuidedCategories, guidedPreviewOptions]);

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
          "Choose your direction, key moments, and styled references to build the preview here.",
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
        : activeExperience
          ? fallbackImages
          : [];
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
  const currentStepConfig = steps[step];
  const estimatedGuestCount = getEstimatedGuestCount(form.guestCount, form.guestCountRange);
  const estimatedTableCount = estimatedGuestCount ? Math.max(1, Math.ceil(estimatedGuestCount / 8)) : null;
  const venueComplexityMultiplier = getVenueComplexityMultiplier(form.venueType, form.venueStatus);
  const estimateItems = selectedDecorCategories.map((key) => {
    const label = guidedPreviewCategories[key]?.title ?? key;
    const refinement = categoryRefinements[key];
    return refinement ? `${label}: ${refinement}` : label;
  });
  const startingInvestment = form.budgetRange
    ? form.budgetRange
    : selectedDecorCategories.length >= 4
      ? "$5,000+"
      : selectedDecorCategories.length >= 2
        ? "$3,000-$5,000"
        : "Custom quote";
  const totalInspirationCount = preview.selectedImageCount + preview.uploadedImageCount;
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
        if (categorySizes[category.key]) {
          pieces.push(`size: ${categorySizes[category.key]}`);
        }
        if (categoryFloralDensity[category.key]) {
          pieces.push(`floral density: ${categoryFloralDensity[category.key]}`);
        }
        if (categoryPalettes[category.key]) {
          pieces.push(`palette: ${categoryPalettes[category.key]}`);
        }
        if (categoryInspirationLinks[category.key]?.trim()) {
          pieces.push(`link: ${categoryInspirationLinks[category.key].trim()}`);
        }
        if (categoryDesignerLed[category.key]) {
          pieces.push("designer-led direction requested");
        }

        return `${category.title} — ${pieces.join(" • ")}`;
      })
      .filter(Boolean);

    return lines.length ? `Visual direction picks:\n${lines.map((line) => `- ${line}`).join("\n")}` : "";
  }, [
    categoryDesignerLed,
    categoryFloralDensity,
    categoryInspirationLinks,
    categoryNotes,
    categoryPalettes,
    categoryRefinements,
    categorySizes,
    categoryUploads,
    guidedPreviewOptions,
    selectedPreviewImages,
  ]);

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
        sizeOption: categorySizes[category.key] ?? null,
        floralDensity: categoryFloralDensity[category.key] ?? null,
        colorPalette: categoryPalettes[category.key] ?? null,
        inspirationLink: categoryInspirationLinks[category.key]?.trim() || null,
        designerLed: Boolean(categoryDesignerLed[category.key]),
      })),
    [
      categoryDesignerLed,
      categoryFloralDensity,
      categoryInspirationLinks,
      categoryNotes,
      categoryPalettes,
      categoryRefinements,
      categorySizes,
      categoryUploads,
      guidedPreviewOptions,
      selectedPreviewImages,
    ]
  );
  function updateField(name: string, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function ensureDecorCategory(categoryKey: string) {
    setSelectedDecorCategories((current) =>
      current.includes(categoryKey) ? current : [...current, categoryKey]
    );
  }

  function focusDecorCategory(categoryKey: string) {
    setActiveDecorKey(categoryKey);
  }

  function focusNextDecorCategory(currentCategoryKey: string) {
    const currentIndex = availableGuidedCategories.findIndex((category) => category.key === currentCategoryKey);

    if (currentIndex === -1) {
      return;
    }

    const nextCategory = availableGuidedCategories[currentIndex + 1];

    if (nextCategory) {
      setActiveDecorKey(nextCategory.key);
    }
  }

  function activateDecorCategory(categoryKey: string) {
    ensureDecorCategory(categoryKey);
    focusDecorCategory(categoryKey);
  }

  function updateMomentCustomization(
    categoryKey: string,
    field: MomentCustomizationField,
    value: string | boolean
  ) {
    ensureDecorCategory(categoryKey);

    if (field === "size" && typeof value === "string") {
      setCategorySizes((current) => ({ ...current, [categoryKey]: value }));
      return;
    }

    if (field === "floralDensity" && typeof value === "string") {
      setCategoryFloralDensity((current) => ({ ...current, [categoryKey]: value }));
      return;
    }

    if (field === "colorPalette" && typeof value === "string") {
      setCategoryPalettes((current) => ({ ...current, [categoryKey]: value }));
      return;
    }

    if (field === "inspirationLink" && typeof value === "string") {
      setCategoryInspirationLinks((current) => ({ ...current, [categoryKey]: value }));
      return;
    }

    if (field === "designerLed" && typeof value === "boolean") {
      setCategoryDesignerLed((current) => ({ ...current, [categoryKey]: value }));
    }
  }

  function setDesignerLedForCategory(categoryKey: string, nextValue: boolean) {
    updateMomentCustomization(categoryKey, "designerLed", nextValue);

    if (nextValue) {
      const recommendedImageId = guidedPreviewOptions.find((item) => item.key === categoryKey)?.images[0]?.id;
      if (recommendedImageId) {
        setSelectedPreviewImages((current) => ({
          ...current,
          [categoryKey]: [recommendedImageId],
        }));
      }
    }
  }

  function toggleKeyMoment(categoryKey: string) {
    if (categoryKey === "not_sure") {
      const nextGuidanceState = !momentGuidanceRequested;
      setMomentGuidanceRequested(nextGuidanceState);

      if (nextGuidanceState) {
        const packageKeys = Array.from(new Set(recommendedDecorKeys));
        setSelectedDecorCategories((current) => Array.from(new Set([...current, ...packageKeys])));
        setCategoryDesignerLed((current) => ({
          ...current,
          ...Object.fromEntries(packageKeys.map((key) => [key, true])),
        }));
        setActiveDecorKey(packageKeys[0] ?? "");
      }
      return;
    }

    if (categoryKey === "full_package") {
      const packageKeys = Array.from(new Set(recommendedDecorKeys));
      setSelectedDecorCategories((current) => {
        const hasAll = packageKeys.every((key) => current.includes(key));
        return hasAll
          ? current.filter((key) => !packageKeys.includes(key))
          : Array.from(new Set([...current, ...packageKeys]));
      });
      setActiveDecorKey(packageKeys[0] ?? "");
      return;
    }

    setSelectedDecorCategories((current) =>
      current.includes(categoryKey)
        ? current.filter((item) => item !== categoryKey)
        : [...current, categoryKey]
    );
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

  function nextStep() {
    if (step === 0 && missingEventType) {
      setError("Select the event type before continuing.");
      return;
    }

    if (step === 1 && !form.decorStyle) {
      setError("Choose the style direction before continuing.");
      return;
    }

    if (step === 2 && selectedDecorCategories.length === 0) {
      setError("Choose at least one decor moment before continuing.");
      return;
    }

    if (step === 3 && (missingEventDetails || missingContactDetails)) {
      setError("Add the event details and contact details before continuing.");
      return;
    }

    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleShareVision() {
    const shareData = {
      title: "Elel Events & Design",
      text: `I’m building my event vision with Elel Events & Design for ${effectiveEventType || "my event"}.`,
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard && shareData.url) {
        await navigator.clipboard.writeText(shareData.url);
        setSuccess("Link copied. Share it with anyone helping plan the event.");
      }
    } catch {
      setError("Unable to share right now. Please try again.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (missingEventDetails || missingEventType || missingContactDetails || !form.decorStyle) {
      setError("Complete the required details before submitting.");
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
        additionalInfo: buildReviewNotes(form, visualSelectionNotes, momentGuidanceRequested),
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

    const reminderDate = form.eventDate
      ? `${form.eventDate.replace(/-/g, "")}/${form.eventDate.replace(/-/g, "")}`
      : "";

    setSubmittedSummary({
      customerName: [form.firstName, form.lastName].filter(Boolean).join(" ") || "Client",
      eventType: effectiveEventType || "Custom event",
      eventDate: form.eventDate || "To be confirmed",
      venue: form.venueName || form.venueStatus || "To be confirmed",
      decorStyle: form.decorStyle || "To be refined during consultation",
      decorCount: selectedDecorCategories.length,
      decorLabels: selectedDecorCategories
        .map((key) => guidedPreviewCategories[key]?.title)
        .filter(Boolean)
        .slice(0, 4) as string[],
      inspirationCount: preview.selectedImageCount + preview.uploadedImageCount,
      consultationType: form.preferredContactMethod || "To be confirmed",
      leadImageUrl: preview.leadImage?.image_url ?? portfolioItems[0]?.image_url ?? "",
      calendarReminderUrl: reminderDate
        ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Elel Events request follow-up")}&dates=${reminderDate}&details=${encodeURIComponent("Elel Events & Design will reach out within 12–24 hours to continue your booking consultation.")}`
        : "",
    });
    setSuccess("Your consultation request has been received.");
    setForm(initialState);
    setSelectedDecorCategories([]);
    setSelectedPreviewImages({});
    setCategoryNotes({});
    setCategoryUploads({});
    setCategoryRefinements({});
    setCategorySizes({});
    setCategoryFloralDensity({});
    setCategoryPalettes({});
    setCategoryInspirationLinks({});
    setCategoryDesignerLed({});
    setMomentGuidanceRequested(false);
    setExpandedCategoryImages({});
    setStep(0);
    setLoading(false);
  }

  if (success && submittedSummary) {
    const availableSocialLinks = [
      {
        key: "instagram",
        label: "Instagram",
        href: socialLinks.instagramUrl,
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
          </svg>
        ),
      },
      {
        key: "facebook",
        label: "Facebook",
        href: socialLinks.facebookUrl,
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13.5 20v-6h2.4l.6-3h-3V9.4c0-.9.3-1.6 1.6-1.6H16V5.1c-.2 0-.9-.1-1.8-.1-2.2 0-3.7 1.3-3.7 3.9V11H8v3h2.5v6h3Z" fill="currentColor" stroke="none" />
          </svg>
        ),
      },
      {
        key: "tiktok",
        label: "TikTok",
        href: socialLinks.tiktokUrl,
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 4c.4 1.6 1.4 2.9 3 3.7 1 .5 2 .7 3 .7v2.8a8 8 0 0 1-3.4-.8v5.3a5.8 5.8 0 1 1-5.1-5.8v3c-1.4 0-2.5 1.1-2.5 2.6s1.1 2.6 2.5 2.6c1.5 0 2.5-1.1 2.5-2.6V4H14Z" fill="currentColor" stroke="none" />
          </svg>
        ),
      },
    ].filter((item) => item.href);

    return (
      <section className="booking-success-shell">
        {submittedSummary.leadImageUrl ? (
          <img
            className="booking-success-backdrop"
            src={submittedSummary.leadImageUrl}
            alt={submittedSummary.eventType}
          />
        ) : null}
        <div className="booking-success-overlay" />
        <div className="booking-success-sparkles" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="booking-success-card">
          <div className="booking-success-icon" aria-hidden="true">
            <span>✓</span>
          </div>

          <div className="booking-success-copy">
            <p className="booking-success-kicker">Concierge confirmation</p>
            <h2>Your Dream Event Request Has Been Received</h2>
            <p>
              Our design team will carefully review your vision and reach out within 12–24 hours
              to begin creating something unforgettable.
            </p>
          </div>

          <div className="booking-success-summary">
            <div className="booking-success-summary-head">
              <strong>{submittedSummary.customerName}</strong>
              <span>What was submitted</span>
            </div>
            <div className="booking-success-summary-grid">
              <div>
                <small>Event type</small>
                <span>{submittedSummary.eventType}</span>
              </div>
              <div>
                <small>Requested date</small>
                <span>{submittedSummary.eventDate}</span>
              </div>
              <div>
                <small>Venue</small>
                <span>{submittedSummary.venue}</span>
              </div>
              <div>
                <small>Decor style</small>
                <span>{submittedSummary.decorStyle}</span>
              </div>
              <div>
                <small>Key decor items</small>
                <span>{submittedSummary.decorCount} selected</span>
              </div>
              <div>
                <small>Inspiration images</small>
                <span>{submittedSummary.inspirationCount} selected</span>
              </div>
              <div>
                <small>Consultation</small>
                <span>{submittedSummary.consultationType}</span>
              </div>
            </div>
            {submittedSummary.decorLabels.length ? (
              <div className="booking-success-tags">
                {submittedSummary.decorLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="booking-success-timeline">
            <article>
              <span>1</span>
              <div>
                <strong>Review Request</strong>
                <p>Our team reviews your dream setup</p>
              </div>
            </article>
            <article>
              <span>2</span>
              <div>
                <strong>Consultation</strong>
                <p>We connect to align on vision &amp; budget</p>
              </div>
            </article>
            <article>
              <span>3</span>
              <div>
                <strong>Secure Your Date</strong>
                <p>Quote + contract + reservation</p>
              </div>
            </article>
          </div>

          <div className="booking-success-actions">
            <a className="btn" href="/gallery">
              View Inspiration Gallery
            </a>
            <a className="btn secondary" href="/">
              Return Home
            </a>
            {submittedSummary.calendarReminderUrl ? (
              <a
                className="btn secondary"
                href={submittedSummary.calendarReminderUrl}
                target="_blank"
                rel="noreferrer"
              >
                Add Event Date to Calendar Reminder
              </a>
            ) : null}
          </div>

          <div className="booking-success-trust">
            <span>Serving Atlanta since 2019</span>
            <span>12+ years of luxury event excellence</span>
            <span>Trusted by Atlanta brides &amp; families</span>
          </div>

          <div className="booking-success-share">
            <p>Know someone planning a special event?</p>
            {availableSocialLinks.length ? (
              <div className="booking-success-social-links">
                {availableSocialLinks.map((item) => (
                  <a
                    key={item.key}
                    className="booking-success-social-link"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Share Elel Events on ${item.label}`}
                  >
                    <span className="booking-success-social-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            ) : (
              <a className="btn secondary" href="/contact">
                Share Elel With a Friend
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="booking-shell">
      <section className="booking-hero card">
        <div className="booking-hero-copy">
          <p className="eyebrow">Luxury request experience</p>
          <h3>Tell us your vision, then let the room take shape.</h3>
          <p className="muted">
            This request is designed like a concierge conversation: one clear decision at a time, more breathing room in every step, and a polished review before you book your consultation.
          </p>
        </div>
        <div className="booking-wizard-track booking-wizard-track--mobile" aria-label="Booking steps">
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

      <div className="booking-workspace">
        <aside className="card booking-progress-rail">
          <div className="booking-progress-rail-head">
            <strong>{completionPercent}% complete</strong>
            <h3>{step === 0 ? "Let's plan your event" : currentStepConfig.title}</h3>
            <p>
              {step === 0
                ? "With our support we are here to make your event planning journey seamless."
                : currentStepConfig.blurb}
            </p>
          </div>
          <div className="booking-progress-list" aria-label="Booking progress">
            {steps.map((item, index) => {
              const state =
                index < step ? "done" : index === step ? "current" : "upcoming";

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`booking-progress-item booking-progress-item--${state}`}
                  onClick={() => {
                    if (index <= step) {
                      setError("");
                      setStep(index);
                    }
                  }}
                  disabled={index > step}
                >
                  <span>{index < step ? "✓" : index + 1}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="booking-progress-rail-note">
            <small>{step === 0 ? "Common tip:" : "Current step"}</small>
            <p>
              {step === 0
                ? "To ensure a smooth consultation process, we will send you breathing room in every step and a polished review before you book your consultation."
                : currentStepConfig.blurb}
            </p>
          </div>
        </aside>

        <div className="booking-main-column">
          <div ref={formCardRef} className="card form-card booking-form-card">
          <div className="booking-pane-head">
            <div className="booking-mobile-progress-card">
              <div className="booking-mobile-progress-meta">
                <span className="booking-pane-tag">Booking concierge</span>
                <p className="booking-progress-copy">{completionPercent}% complete</p>
              </div>
              <strong>{currentStepConfig.label}</strong>
              <p className="muted">Step {step + 1} of {steps.length} • Your dream setup is taking shape</p>
              <div className="booking-mobile-progress-bar" aria-hidden="true">
                <span style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            {step === 0 ? (
              <section className="booking-panel booking-panel--vision">
                <div className="panel-head">
                  <p className="eyebrow">Step 1 of 5</p>
                  <h3>What are you planning?</h3>
                  <p className="muted">
                    Choose the celebration first. The next steps will adapt around the atmosphere, focal moments, and consultation needs that fit your event.
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
                            {isSelected ? <span className="event-experience-badge" aria-label="Selected">✓</span> : null}
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
                            {isSelected ? <span className="event-experience-badge" aria-label="Selected">✓</span> : null}
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
              <section className="booking-panel booking-panel--style">
                <div className="panel-head">
                  <p className="eyebrow">Step 2 of 5</p>
                  <h3>Choose your style direction.</h3>
                  <p className="muted">Pick the atmosphere you want guests to feel the moment they walk in.</p>
                </div>

                <div className="design-direction-grid">
                  {decorDirectionCards.map((option) => {
                    const isSelected = form.decorStyle === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        className={`design-direction-card ${isSelected ? "selected" : ""}`}
                        onClick={() => updateField("decorStyle", option.key)}
                      >
                        {option.imageUrl ? <img src={option.imageUrl} alt={option.title} loading="lazy" /> : null}
                        <span className="design-direction-overlay" />
                        {isSelected ? <span className="design-direction-badge">Selected</span> : null}
                        <div className="design-direction-copy">
                          <small>Style direction</small>
                          <strong>{option.title}</strong>
                          <span>{option.subtitle}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="booking-style-grid">
                  <div className="scope-card booking-style-card">
                    <h4>Preferred palette</h4>
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
                    <input
                      className="input"
                      value={form.colorsTheme}
                      onChange={(e) => updateField("colorsTheme", e.target.value)}
                      placeholder="Or type your own palette"
                      style={{ marginTop: "12px" }}
                    />
                  </div>

                  <div className="scope-card booking-style-card">
                    <h4>Tell us what you love</h4>
                    <textarea
                      className="textarea"
                      value={form.inspirationNotes}
                      onChange={(e) => updateField("inspirationNotes", e.target.value)}
                      placeholder="Describe the atmosphere, mood, or design details you already know you want."
                    />
                    <p className="muted">Keep it simple: elegant, romantic, dramatic, intimate, or anything in between.</p>
                  </div>
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section className="booking-panel booking-panel--decor">
                <div className="panel-head">
                  <p className="eyebrow">Step 3 of 5</p>
                  <h3>Build your decor story.</h3>
                  <p className="muted">Select the focal elements you'd like to feature. Choose from our popular options or upload your own inspiration images.</p>
                </div>

                <div className="booking-decor-accordion">
                  {availableGuidedCategories.map((category) => {
                    const isActive = activeGuidedCategory?.key === category.key;
                    const isSelected = selectedDecorCategories.includes(category.key);
                    const selectedIds = selectedPreviewImages[category.key] ?? [];
                    const uploadedCount = (categoryUploads[category.key] ?? []).length;
                    const hasContent =
                      isSelected ||
                      selectedIds.length > 0 ||
                      uploadedCount > 0 ||
                      Boolean(categoryNotes[category.key]?.trim()) ||
                      Boolean(categoryRefinements[category.key]) ||
                      Boolean(categorySizes[category.key]) ||
                      Boolean(categoryFloralDensity[category.key]) ||
                      Boolean(categoryPalettes[category.key]) ||
                      Boolean(categoryInspirationLinks[category.key]?.trim()) ||
                      Boolean(categoryDesignerLed[category.key]);
                    const visibleImages = (expandedCategoryImages[category.key]
                      ? category.images
                      : category.images.slice(0, 3));
                    const refinementConfig = decorRefinementOptions[category.key];

                    return (
                      <article
                        key={category.key}
                        className={`booking-decor-accordion-item ${isActive ? "open" : ""} ${hasContent ? "configured" : ""}`}
                      >
                        <button
                          type="button"
                          className="booking-decor-accordion-row"
                          onClick={() => activateDecorCategory(category.key)}
                          aria-expanded={isActive}
                        >
                          <span className={`booking-decor-accordion-select ${isSelected || hasContent ? "selected" : ""}`}>
                            {isSelected || hasContent ? "✓" : ""}
                          </span>

                          <span className="booking-decor-accordion-trigger">
                            <span className="booking-decor-accordion-copy">
                              <strong>{category.title}</strong>
                              <span>{category.helper}</span>
                            </span>
                            <span className="booking-decor-accordion-meta">
                              {recommendedDecorKeys.includes(category.key) ? (
                                <span className="booking-decor-accordion-chip">Recommended</span>
                              ) : null}
                              <span className={`booking-decor-accordion-chevron ${isActive ? "open" : ""}`}>⌄</span>
                            </span>
                          </span>
                        </button>

                        {isActive ? (
                          <div ref={detailPanelRef} className="booking-decor-accordion-panel">
                            {category.images.length ? (
                              <>
                                <div className="booking-decor-accordion-section-head">
                                  <h4>Top {Math.min(category.images.length, 3)} Popular Options</h4>
                                  {selectedIds.length ? (
                                    <span>{selectedIds.length} selected</span>
                                  ) : null}
                                </div>

                                <div className="booking-decor-option-grid">
                                  {visibleImages.map((item) => {
                                    const isImageSelected = selectedIds.includes(item.id);

                                    return (
                                      <button
                                        key={item.id}
                                        type="button"
                                        className={`booking-decor-option-card ${isImageSelected ? "selected" : ""}`}
                                        onClick={() => {
                                          const nextIds = isImageSelected ? [] : [item.id];
                                          setSelectedPreviewImages((current) => ({
                                            ...current,
                                            [category.key]: nextIds,
                                          }));
                                          ensureDecorCategory(category.key);
                                          if (!isImageSelected) {
                                            focusNextDecorCategory(category.key);
                                          }
                                        }}
                                      >
                                        <img src={item.image_url} alt={item.title} loading="lazy" />
                                        <span className="booking-decor-option-overlay" />
                                        <strong>{item.title}</strong>
                                        {isImageSelected ? <span className="booking-decor-option-check">✓</span> : null}
                                      </button>
                                    );
                                  })}
                                </div>

                                {category.images.length > 3 ? (
                                  <button
                                    type="button"
                                    className="booking-decor-text-action"
                                    onClick={() =>
                                      setExpandedCategoryImages((current) => ({
                                        ...current,
                                        [category.key]: !current[category.key],
                                      }))
                                    }
                                  >
                                    {expandedCategoryImages[category.key]
                                      ? "Show fewer options"
                                      : `View ${category.images.length - 3} more`}
                                  </button>
                                ) : null}
                              </>
                            ) : (
                              <div className="guided-preview-empty">
                                <p>{category.emptyState}</p>
                              </div>
                            )}

                            <div className="booking-decor-upload-wrap">
                              <p className="booking-decor-upload-label">Or Upload Your Own</p>
                              <label className="booking-decor-upload-zone">
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleCategoryUpload(category.key, e)}
                                  disabled={uploadingVisionBoard || form.visionBoardUrls.length >= 5}
                                />
                                <span className="booking-decor-upload-icon">↑</span>
                                <strong>Upload inspiration images</strong>
                                <span>
                                  {uploadedCount
                                    ? `${uploadedCount} uploaded`
                                    : "PNG, JPG up to 10MB"}
                                </span>
                              </label>
                            </div>

                            <div className="booking-decor-more-options">
                              {refinementConfig?.options?.length ? (
                                <div className="booking-decor-more-options-block">
                                  <p>{refinementConfig.label}</p>
                                  <div className="option-pills">
                                    {refinementConfig.options.map((option) => (
                                      <button
                                        key={option}
                                        type="button"
                                        className={`pill ${categoryRefinements[category.key] === option ? "selected" : ""}`}
                                        onClick={() => {
                                          const nextValue =
                                            categoryRefinements[category.key] === option ? "" : option;
                                          setCategoryRefinements((current) => ({
                                            ...current,
                                            [category.key]: nextValue,
                                          }));
                                          if (nextValue) {
                                            ensureDecorCategory(category.key);
                                            focusNextDecorCategory(category.key);
                                          }
                                        }}
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              <div className="booking-decor-more-options-block">
                                <p>Describe your vision</p>
                                <textarea
                                  className="textarea"
                                  value={categoryNotes[category.key] ?? ""}
                                  onChange={(e) => {
                                    const nextValue = e.target.value;
                                    setCategoryNotes((current) => ({
                                      ...current,
                                      [category.key]: nextValue,
                                    }));
                                    if (nextValue.trim()) ensureDecorCategory(category.key);
                                  }}
                                  placeholder="Tell us the feeling, details, or must-haves for this moment."
                                />
                              </div>

                              <div className="booking-decor-more-options-block">
                                <p>Paste an inspiration link</p>
                                <input
                                  className="input"
                                  value={categoryInspirationLinks[category.key] ?? ""}
                                  onChange={(e) => updateMomentCustomization(category.key, "inspirationLink", e.target.value)}
                                  placeholder="Pinterest, Instagram, or gallery link"
                                />
                              </div>

                              <div className="booking-decor-designer-led">
                                <button
                                  type="button"
                                  className={`pill ${categoryDesignerLed[category.key] ? "selected" : ""}`}
                                  onClick={() => {
                                    const nextValue = !categoryDesignerLed[category.key];
                                    setDesignerLedForCategory(category.key, nextValue);
                                    if (nextValue) {
                                      focusNextDecorCategory(category.key);
                                    }
                                  }}
                                >
                                  Let Elel guide this moment
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <section className="booking-panel booking-panel--details">
                <div className="panel-head">
                  <p className="eyebrow">Step 4 of 5</p>
                  <h3>Share the event details.</h3>
                  <p className="muted">This step is intentionally calm. We only need the logistics that help us prepare your consultation properly.</p>
                </div>

                <div className="booking-details-grid">
                  <div className="scope-card">
                    <h4>Event basics</h4>
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
                    <h4>Contact &amp; consultation</h4>
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
                    <div className="field">
                      <label className="label">Preferred consultation type</label>
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
                  </div>

                  <div className="scope-card">
                    <h4>Additional notes</h4>
                    <textarea
                      className="textarea"
                      value={form.additionalInfo}
                      onChange={(e) => updateField("additionalInfo", e.target.value)}
                      placeholder="Anything else we should know about your venue, timing, priorities, or family preferences?"
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {step === 4 ? (
              <section className="booking-panel booking-panel--review">
                <div className="panel-head">
                  <p className="eyebrow">Step 5 of 5</p>
                  <h3>Your Event Vision Is Ready.</h3>
                  <p className="muted">Review the direction, confirm how you want us to follow up, and send your request with confidence.</p>
                </div>

                <div className="booking-final-screen">
                  <div className="booking-final-hero">
                    {preview.leadImage ? (
                      <div className="booking-final-hero-media">
                        <img
                          key={`final-preview-hero-${previewSignature}`}
                          src={preview.leadImage.image_url}
                          alt={preview.leadImage.title}
                          loading="lazy"
                        />
                        <div className="booking-final-hero-copy">
                          <span className="booking-pane-tag">Your Event Vision</span>
                          <h3>Your Event Vision</h3>
                          <p>{preview.styleDescription}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="booking-final-hero-media booking-final-hero-media--empty">
                        <div className="booking-final-hero-copy">
                          <span className="booking-pane-tag">Your Event Vision</span>
                          <h3>Your Event Vision</h3>
                          <p>We have the beginning of your event story. Send the request and we will refine everything together in consultation.</p>
                        </div>
                      </div>
                    )}

                    <div className="booking-final-hero-body">
                      <div className="booking-final-tag-list">
                        {selectedDecorCategories.length ? (
                          selectedDecorCategories.map((key) => {
                            const title = guidedPreviewCategories[key]?.title;
                            return title ? (
                              <span key={key} className="booking-final-tag">
                                {title}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="booking-final-tag">No moments selected yet</span>
                        )}
                      </div>

                      <div className="booking-final-confidence">
                        <strong>You’re not locked into anything — we’ll refine everything together.</strong>
                        <p>
                          This request simply gives us a polished starting point. We will align on details, budget, and venue realities before anything is finalized.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="booking-final-side">
                    <div className="scope-card booking-final-summary-card">
                      <div className="booking-final-summary-head">
                        <h4>Booking summary</h4>
                        <span className="booking-pane-tag">Luxury request</span>
                      </div>
                      <div className="booking-final-summary-grid">
                        <div>
                          <small>Event type</small>
                          <span>{effectiveEventType || "—"}</span>
                        </div>
                        <div>
                          <small>Date</small>
                          <span>{form.eventDate || "Pending"}</span>
                        </div>
                        <div>
                          <small>Decor style</small>
                          <span>{form.decorStyle || "—"}</span>
                        </div>
                        <div>
                          <small>Estimated price</small>
                          <span>{startingInvestment}</span>
                        </div>
                      </div>
                    </div>

                    <div className="scope-card booking-final-summary-card">
                      <div className="booking-final-summary-head">
                        <h4>Selected decor</h4>
                        <button type="button" className="btn secondary" onClick={() => setStep(2)}>
                          Edit Decor
                        </button>
                      </div>
                      <div className="booking-review-decor-grid">
                        {selectedDecorCategories.length ? (
                          selectedDecorCategories.map((key) => {
                            const category = guidedPreviewCategories[key];
                            const selectedImageId = selectedPreviewImages[key]?.[0];
                            const selectedImage = guidedPreviewOptions
                              .find((item) => item.key === key)
                              ?.images.find((image) => image.id === selectedImageId);

                            return (
                              <div key={key} className="booking-review-decor-card">
                                <div className="booking-review-decor-head">
                                  <strong>{category?.title ?? key}</strong>
                                  <span>{categoryDesignerLed[key] ? "Elel guided" : "Selected"}</span>
                                </div>
                                {selectedImage ? (
                                  <div className="booking-review-media-grid">
                                    <img src={selectedImage.image_url} alt={selectedImage.title} loading="lazy" />
                                  </div>
                                ) : null}
                                <div className="booking-review-detail-list">
                                  {categoryRefinements[key] ? <p>Direction: {categoryRefinements[key]}</p> : null}
                                  {categoryNotes[key]?.trim() ? <p>{categoryNotes[key]}</p> : null}
                                  {(categoryUploads[key] ?? []).length ? (
                                    <p>{categoryUploads[key].length} uploaded inspiration file{categoryUploads[key].length === 1 ? "" : "s"}</p>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="booking-review-decor-card booking-review-decor-card--empty">
                            <strong>No decor moments selected yet</strong>
                            <p className="muted">Go back to the decor step if you want to add focal styling before submitting.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="scope-card booking-final-next-card">
                      <h4>What happens next</h4>
                      <div className="booking-final-timeline">
                        <div className="booking-final-timeline-item">
                          <i>1</i>
                          <div>
                            <strong>We review your request</strong>
                            <p>We study the event type, selected moments, and overall direction you submitted.</p>
                          </div>
                        </div>
                        <div className="booking-final-timeline-item">
                          <i>2</i>
                          <div>
                            <strong>We contact you for consultation</strong>
                            <p>We connect to refine priorities, budget, and the experience you want your guests to feel.</p>
                          </div>
                        </div>
                        <div className="booking-final-timeline-item">
                          <i>3</i>
                          <div>
                            <strong>We prepare your quote and secure your date</strong>
                            <p>Once the scope is approved, we move into quote, contract, and reservation details.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="booking-final-secondary-actions">
                      <button type="button" className="btn secondary" onClick={() => setStep(3)}>
                        Back to Edit Details
                      </button>
                      <button type="button" className="btn secondary" onClick={() => setStep(1)}>
                        Edit Style
                      </button>
                      <a href="/gallery" className="btn secondary">
                        View Inspiration Gallery
                      </a>
                      <button type="button" className="btn secondary" onClick={handleShareVision}>
                        Share
                      </button>
                    </div>
                  </div>
                </div>
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
                  disabled={loading}
                >
                  Next Step
                </button>
              ) : (
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Book Your Consultation"}
                </button>
              )}
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
