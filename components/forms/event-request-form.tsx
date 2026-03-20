"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryItem } from "@/lib/gallery";
import type { PublicVendorRecommendation } from "@/lib/vendors";
import { VENDOR_SERVICE_CATEGORIES } from "@/lib/vendors";

const eventTypeOptions = [
  "Wedding",
  "Traditional (Melsi)",
  "Engagement",
  "Birthday",
  "Baby Shower",
  "Bridal Shower",
  "Graduation",
  "Corporate Event",
  "Anniversary",
  "Other",
];

const eventTypeIcons: Record<string, string> = {
  Wedding: "W",
  "Traditional (Melsi)": "M",
  Engagement: "E",
  Birthday: "B",
  "Baby Shower": "BS",
  "Bridal Shower": "BR",
  Graduation: "G",
  "Corporate Event": "C",
  Anniversary: "A",
  Other: "O",
};

const venueStatusOptions = ["Booked", "Still looking", "Home", "Church", "Hall", "Hotel / ballroom"];
const consultationOptions = ["Phone call", "Video meeting", "In-person meeting", "Text or email first"];
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
const paletteSuggestions = [
  "Ivory + champagne",
  "White + gold",
  "Blush + ivory",
  "Sage + cream",
  "Terracotta + candlelight",
  "Emerald + gold",
];
const steps = [
  { id: "event-type", label: "Event Type" },
  { id: "basics", label: "Event Basics" },
  { id: "visual-builder", label: "Visual Builder" },
  { id: "summary", label: "Summary" },
];

type GuidedPreviewCategoryConfig = {
  key: string;
  title: string;
  helper: string;
  keywords: string[];
  emptyState: string;
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
  traditional_setup: {
    key: "traditional_setup",
    title: "Traditional Setup",
    helper: "Traditional Melsi styling and ceremonial detail.",
    keywords: ["melsi", "traditional", "ceremony"],
    emptyState: "No traditional setup reference is available here yet. Add a note or upload inspiration if you want to guide the look.",
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

const eventTypeCategoryMap: Record<string, string[]> = {
  Wedding: ["backdrop", "head_table", "sweetheart_table", "centerpiece", "ceiling_drape", "bride_groom_chairs", "florals", "vip_table"],
  "Traditional (Melsi)": ["traditional_setup", "backdrop", "head_table", "centerpiece", "ceiling_drape", "vip_table"],
  Engagement: ["backdrop", "head_table", "sweetheart_table", "centerpiece", "florals"],
  Birthday: ["backdrop", "centerpiece", "dessert_table", "guest_tables"],
  "Baby Shower": ["backdrop", "centerpiece", "dessert_table", "welcome_area"],
  "Bridal Shower": ["backdrop", "centerpiece", "dessert_table", "welcome_area"],
  Graduation: ["backdrop", "guest_tables", "welcome_area"],
  "Corporate Event": ["backdrop", "guest_tables", "welcome_area", "florals"],
  Anniversary: ["backdrop", "head_table", "sweetheart_table", "centerpiece", "florals"],
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
  referralSource: "",
  needsDeliverySetup: false,
  services: [] as string[],
};

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
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
  const [form, setForm] = useState(initialState);
  const [step, setStep] = useState(0);
  const [showOptionalStyleFields, setShowOptionalStyleFields] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingVisionBoard, setUploadingVisionBoard] = useState(false);
  const [selectedDecorCategories, setSelectedDecorCategories] = useState<string[]>([]);
  const [selectedPreviewImages, setSelectedPreviewImages] = useState<Record<string, string[]>>({});
  const [categoryNotes, setCategoryNotes] = useState<Record<string, string>>({});
  const [categoryUploads, setCategoryUploads] = useState<Record<string, string[]>>({});
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [expandedCategoryImages, setExpandedCategoryImages] = useState<Record<string, boolean>>({});
  const effectiveEventType =
    form.eventType === "Other" ? form.customEventType.trim() : form.eventType;

  const missingEventType = !form.eventType || (form.eventType === "Other" && !form.customEventType.trim());
  const missingBasics = !form.firstName || !form.lastName || !form.email || !form.phone || !form.eventDate;
  const vendorCategories = getAvailableVendorCategories(vendors);
  const matchingVendors = getMatchingVendors(vendors, form.requestedVendorCategories);
  const guidedPreviewOptions = useMemo(
    () => getGuidedPreviewOptions(form.eventType, selectedDecorCategories, portfolioItems),
    [form.eventType, selectedDecorCategories, portfolioItems]
  );
  const activeGuidedCategory = guidedPreviewOptions[activeCategoryIndex] ?? null;
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
    setSelectedDecorCategories([]);
    setSelectedPreviewImages({});
    setCategoryNotes({});
    setCategoryUploads({});
    setExpandedCategoryImages({});
    setActiveCategoryIndex(0);
  }, [form.eventType]);

  useEffect(() => {
    if (activeCategoryIndex > guidedPreviewOptions.length - 1) {
      setActiveCategoryIndex(0);
    }
  }, [activeCategoryIndex, guidedPreviewOptions.length]);

  useEffect(() => {
    if (!selectedDecorCategories.length) {
      setActiveCategoryIndex(0);
      return;
    }

    const activeKey = guidedPreviewOptions[activeCategoryIndex]?.key;
    if (!activeKey || !selectedDecorCategories.includes(activeKey)) {
      setActiveCategoryIndex(Math.max(selectedDecorCategories.length - 1, 0));
    }
  }, [activeCategoryIndex, guidedPreviewOptions, selectedDecorCategories]);

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
      .slice(0, 4);

    const fallbackImages = matchedImages.length ? matchedImages : portfolioItems.slice(0, 4);
    const images =
      selectedImages.length || uploadedImages.length
        ? [...selectedImages, ...uploadedImages].slice(0, 4)
        : fallbackImages;
    const eventLabel = effectiveEventType || "your event";
    const styleLabel = form.decorStyle || "elevated and guest-ready";
    const paletteLabel = form.colorsTheme || "a refined palette";
    const venueLabel = form.venueType || form.venueStatus || "the room";
    const guestLabel = form.guestCountRange || (form.guestCount ? `${form.guestCount} guests` : "the guest count");
    const styleDescription = `${eventLabel} with a ${styleLabel.toLowerCase()} direction, ${paletteLabel.toLowerCase()}, and layout choices shaped around ${venueLabel.toLowerCase()} for ${guestLabel.toLowerCase()}.`;

    const decorDirection = derivedServices.includes("Delivery and setup")
      ? "A guided room direction with styling selections, setup planning, and a cleaner path into consultation."
      : selectedImages.length
        ? `Selected inspiration across ${selectedCategoryKeys.length} decor categories to guide the room direction during consultation.`
        : derivedServices.length
        ? `${derivedServices.slice(0, 3).join(", ")}${derivedServices.length > 3 ? ", and supporting details" : ""} as the main visual anchors.`
        : "A focal-point-led room with one hero installation and polished guest-facing details.";

    const packageRecommendation =
      form.guestCountRange === "200+" || form.budgetRange === "$8,000+"
        ? "Best fit: a custom large-event package with layered room styling and logistics support."
        : "Best fit: a focused decor package centered on your main focal points and guest-table styling.";

    return {
      images,
      styleDescription,
      decorDirection,
      packageRecommendation,
    };
  }, [
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

        return `${category.title} — ${pieces.join(" • ")}`;
      })
      .filter(Boolean);

    return lines.length ? `Visual direction picks:\n${lines.map((line) => `- ${line}`).join("\n")}` : "";
  }, [categoryNotes, categoryUploads, guidedPreviewOptions, selectedPreviewImages]);

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
        notes: categoryNotes[category.key]?.trim() || null,
      })),
    [categoryNotes, categoryUploads, guidedPreviewOptions, selectedPreviewImages]
  );

  function updateField(name: string, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleDecorCategory(categoryKey: string) {
    setSelectedDecorCategories((current) => {
      if (current.includes(categoryKey)) {
        return current;
      }

      return [...current, categoryKey];
    });
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

    if (uploads.length) {
      setForm((prev) => ({
        ...prev,
        visionBoardUrls: prev.visionBoardUrls.filter((url) => !uploads.includes(url)),
      }));
    }

    setSelectedDecorCategories((current) => current.filter((item) => item !== categoryKey));
  }

  function nextStep() {
    if (step === 0 && missingEventType) {
      setError("Select the event type before continuing.");
      return;
    }

    if (step === 1 && missingBasics) {
      setError("Add your contact details and event date before continuing.");
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
    if (missingBasics || missingEventType) {
      setError("Complete the event basics before submitting.");
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
    setExpandedCategoryImages({});
    setStep(0);
    setLoading(false);
  }

  return (
    <div className="booking-shell">
      <section className="booking-hero card">
        <div>
          <p className="eyebrow">Consultation request</p>
          <h3>Build the event direction in four simple steps.</h3>
          <p className="muted">
            Choose the event type, add the essentials, then shape the visual direction with real portfolio references.
          </p>
          <p className="booking-preview-intro">
            The preview updates live as you choose images, upload inspiration, and define the room direction.
          </p>
        </div>
        <div className="booking-stepbar" aria-label="Booking steps">
          {steps.map((item, index) => (
            <div
              key={item.id}
              className={`booking-step ${index === step ? "current" : ""} ${index < step ? "done" : ""}`}
            >
              <span>{index + 1}</span>
              <strong>{item.label}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="form-wrap booking-layout">
        <div ref={formCardRef} className="card form-card booking-form-card">
          <form onSubmit={handleSubmit}>
            {step === 0 ? (
              <section className="booking-panel">
                <div className="panel-head">
                  <p className="eyebrow">Step 1</p>
                  <h3>Select the event type.</h3>
                </div>

                <div className="visual-choice-grid visual-choice-grid--event-types">
                  {eventTypeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`choice-card choice-card--event-type ${form.eventType === option ? "selected" : ""}`}
                      onClick={() => {
                        updateField("eventType", option);
                        if (option !== "Other") {
                          updateField("customEventType", "");
                        }
                      }}
                      aria-pressed={form.eventType === option}
                    >
                      <span className="choice-card-icon" aria-hidden="true">
                        {eventTypeIcons[option] ?? option.charAt(0)}
                      </span>
                      <strong>{option}</strong>
                    </button>
                  ))}
                </div>

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
                  <p className="eyebrow">Step 2</p>
                  <h3>Add the essentials.</h3>
                  <p className="muted">Keep this part light. We only need the event basics and your contact details.</p>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label className="label">Event Date</label>
                    <input className="input" type="date" value={form.eventDate} onChange={(e) => updateField("eventDate", e.target.value)} required />
                  </div>
                  <div className="field">
                    <label className="label">Exact Guest Count, if known</label>
                    <input className="input" type="number" min="0" value={form.guestCount} onChange={(e) => updateField("guestCount", e.target.value)} placeholder="Optional exact count" />
                  </div>
                  <div className="field">
                    <label className="label">Location / Venue</label>
                    <input className="input" value={form.venueName} onChange={(e) => updateField("venueName", e.target.value)} />
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

                <div className="field">
                  <label className="label">Guest Count Range</label>
                  <div className="visual-choice-grid visual-choice-grid--compact">
                    {guestCountRangeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`choice-card choice-card--compact ${form.guestCountRange === option.value ? "selected" : ""}`}
                        onClick={() => updateField("guestCountRange", option.value)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

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
                  <label className="label">How should we start the consultation?</label>
                  <div className="option-pills">
                    {consultationOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`pill ${form.preferredContactMethod === option ? "selected" : ""}`}
                        onClick={() => updateField("preferredContactMethod", option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="label">How did you hear about us?</label>
                  <div className="option-pills">
                    {referralOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`pill ${form.referralSource === option ? "selected" : ""}`}
                        onClick={() => updateField("referralSource", option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section className="booking-panel">
                <div className="panel-head">
                  <p className="eyebrow">Step 3</p>
                  <h3>Build the visual direction.</h3>
                  <p className="muted">Choose the references that feel closest to your event. You can skip any category.</p>
                </div>

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
                  <label className="label">Venue Type</label>
                  <div className="option-pills">
                    {venueTypeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`pill ${form.venueType === option ? "selected" : ""}`}
                        onClick={() => updateField("venueType", option)}
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
                  <div className="scope-card">
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
                  <label className="label">Choose the decor elements you want help visualizing</label>
                  <div className="guided-preview-accordion">
                    {(eventTypeCategoryMap[form.eventType] ?? eventTypeCategoryMap.Other).map((categoryKey) => {
                      const category = guidedPreviewCategories[categoryKey];
                      if (!category) {
                        return null;
                      }

                      const guidedCategory = guidedPreviewOptions.find((item) => item.key === category.key);
                      const isSelected = selectedDecorCategories.includes(category.key);
                      const isActive = activeGuidedCategory?.key === category.key;
                      const selectedImageCount = (selectedPreviewImages[category.key] ?? []).length;
                      const uploadedImageCount = (categoryUploads[category.key] ?? []).length;
                      const noteCount = categoryNotes[category.key]?.trim() ? 1 : 0;
                      const hasContent =
                        selectedImageCount > 0 ||
                        uploadedImageCount > 0 ||
                        noteCount > 0;

                      return (
                        <div
                          key={category.key}
                          className={`guided-preview-accordion-item ${isActive ? "expanded" : ""} ${isSelected ? "selected" : ""}`}
                        >
                          <button
                            type="button"
                            className={`guided-preview-category-chip ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              if (!isSelected) {
                                setActiveCategoryIndex(selectedDecorCategories.length);
                                toggleDecorCategory(category.key);
                                return;
                              }

                              const nextIndex = guidedPreviewOptions.findIndex((item) => item.key === category.key);
                              if (nextIndex >= 0) {
                                setActiveCategoryIndex(nextIndex);
                              }
                            }}
                            aria-pressed={isSelected}
                          >
                            <div className="guided-preview-category-chip-copy">
                              <strong>{category.title}</strong>
                              <span>{hasContent ? "Configured" : "Select"}</span>
                            </div>
                            {isSelected ? (
                              <div className="guided-preview-category-status" aria-label="Selected decor element">
                                <span className="guided-preview-category-check">Chosen</span>
                                {hasContent ? (
                                  <small>
                                    {[
                                      selectedImageCount ? `${selectedImageCount} image${selectedImageCount === 1 ? "" : "s"}` : "",
                                      uploadedImageCount ? `${uploadedImageCount} upload${uploadedImageCount === 1 ? "" : "s"}` : "",
                                      noteCount ? "note" : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </small>
                                ) : null}
                              </div>
                            ) : null}
                          </button>

                          {isSelected && isActive && guidedCategory ? (
                            <div className="guided-preview-inline-panel">
                              <div className="guided-preview-category-head">
                                <div>
                                  <h4>{guidedCategory.title}</h4>
                                  <p className="muted">{guidedCategory.helper}</p>
                                </div>
                                <div className="guided-preview-stage-nav">
                                  <button
                                    type="button"
                                    className="btn secondary"
                                    onClick={() => setSelectedDecorCategories((current) => current.filter((item) => item !== guidedCategory.key))}
                                  >
                                    Collapse
                                  </button>
                                </div>
                              </div>

                              {guidedCategory.images.length ? (
                                <>
                                <div className="guided-preview-options">
                                  {(expandedCategoryImages[guidedCategory.key]
                                    ? guidedCategory.images
                                    : guidedCategory.images.slice(0, 3)
                                  ).map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      className={`guided-preview-option ${(selectedPreviewImages[guidedCategory.key] ?? []).includes(item.id) ? "selected" : ""}`}
                                      onClick={() => {
                                        setSelectedPreviewImages((current) => {
                                          const currentIds = current[guidedCategory.key] ?? [];
                                          const nextIds = currentIds.includes(item.id)
                                            ? currentIds.filter((id) => id !== item.id)
                                            : [...currentIds, item.id];

                                          return {
                                            ...current,
                                            [guidedCategory.key]: nextIds,
                                          };
                                        });
                                      }}
                                    >
                                      <img src={item.image_url} alt={item.title} loading="lazy" />
                                      <span>{item.title}</span>
                                    </button>
                                  ))}
                                </div>
                                {guidedCategory.images.length > 3 ? (
                                  <button
                                    type="button"
                                    className="guided-preview-more"
                                    onClick={() =>
                                      setExpandedCategoryImages((current) => ({
                                        ...current,
                                        [guidedCategory.key]: !current[guidedCategory.key],
                                      }))
                                    }
                                  >
                                    {expandedCategoryImages[guidedCategory.key] ? "Show fewer images" : `View ${guidedCategory.images.length - 3} more`}
                                  </button>
                                ) : null}
                                </>
                              ) : (
                                <div className="guided-preview-empty">
                                  <p className="muted">{guidedCategory.emptyState}</p>
                                </div>
                              )}

                              <div className="guided-preview-support">
                                <textarea
                                  className="textarea"
                                  value={categoryNotes[guidedCategory.key] ?? ""}
                                  onChange={(e) =>
                                    setCategoryNotes((current) => ({
                                      ...current,
                                      [guidedCategory.key]: e.target.value,
                                    }))
                                  }
                                  placeholder={`Optional note for ${guidedCategory.title.toLowerCase()}`}
                                />
                                <label className="guided-preview-upload">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleCategoryUpload(guidedCategory.key, e)}
                                    disabled={uploadingVisionBoard || form.visionBoardUrls.length >= 5}
                                  />
                                  <strong>Upload inspiration</strong>
                                  <span>{(categoryUploads[guidedCategory.key] ?? []).length} uploaded</span>
                                </label>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

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

                <div className="field">
                  <label className="label">General inspiration note</label>
                  <textarea
                    className="textarea"
                    value={form.inspirationNotes}
                    onChange={(e) => updateField("inspirationNotes", e.target.value)}
                    placeholder="Anything important you want us to keep in mind."
                  />
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <section className="booking-panel">
                <div className="panel-head">
                  <p className="eyebrow">Step 4</p>
                  <h3>Review and send.</h3>
                  <p className="muted">You can jump back to any step before submitting.</p>
                </div>

                <div className="review-card">
                  <h4>Booking summary</h4>
                  <div className="review-grid">
                    <p><strong>Client:</strong> {form.firstName || "—"} {form.lastName || ""}</p>
                    <p><strong>Event:</strong> {effectiveEventType || "—"}</p>
                    <p><strong>Date:</strong> {form.eventDate || "—"}</p>
                    <p><strong>Guest range:</strong> {form.guestCountRange || "—"}</p>
                    <p><strong>Venue:</strong> {form.venueName || "—"}</p>
                    <p><strong>Consultation:</strong> {form.preferredContactMethod || "—"}</p>
                    <p><strong>Design selections:</strong> {derivedServices.length || 0}</p>
                    <p><strong>Vendor help:</strong> {form.requestedVendorCategories.length ? form.requestedVendorCategories.join(", ") : "Not requested"}</p>
                  </div>
                </div>

                <div className="summary-stack">
                  <div className="booking-edit-links">
                    <button type="button" className="btn secondary" onClick={() => setStep(0)}>Edit Event Type</button>
                    <button type="button" className="btn secondary" onClick={() => setStep(1)}>Edit Basics</button>
                    <button type="button" className="btn secondary" onClick={() => setStep(2)}>Edit Visual Builder</button>
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
                  disabled={(step === 0 && missingEventType) || (step === 1 && missingBasics)}
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

        <aside className="card sidebar-box booking-summary">
          <span className="booking-live-pill">Live Preview</span>
          <p className="eyebrow">Design direction preview</p>
          <h3 style={{ marginTop: 0 }}>Inspiration based on your selections</h3>
          <p className="muted">
            This preview helps you picture the direction. Final concepts are customized during your consultation.
          </p>

          <div className="booking-preview-grid">
            {preview.images.map((item) => (
              <div key={item.id} className="booking-preview-image">
                <img src={item.image_url} alt={item.title} loading="lazy" />
                <span>{item.category || "Portfolio"}</span>
              </div>
            ))}
          </div>

            <div className="summary-stack">
            <div className="booking-preview-copy">
              <strong>Style snapshot</strong>
              <p className="muted">{preview.styleDescription}</p>
            </div>
            <div className="booking-preview-copy">
              <strong>Recommended decor direction</strong>
              <p className="muted">{preview.decorDirection}</p>
            </div>
            <div className="booking-preview-copy">
              <strong>Suggested package path</strong>
              <p className="muted">{preview.packageRecommendation}</p>
            </div>
            <div>
              <strong>Event</strong>
              <p className="muted">{effectiveEventType || "Not selected yet"}</p>
            </div>
            <div>
              <strong>Date & venue</strong>
              <p className="muted">
                {form.eventDate || "Date not added"}
                {form.venueName ? ` • ${form.venueName}` : ""}
              </p>
            </div>
            <div>
              <strong>Consultation</strong>
              <p className="muted">{form.preferredContactMethod || "We will follow up using your preferred contact method"}</p>
            </div>
            <div>
              <strong>Palette + style</strong>
              <p className="muted">
                {[form.colorsTheme, form.decorStyle].filter(Boolean).join(" • ") || "Still open for consultation"}
              </p>
            </div>
            <div>
              <strong>Selected decor direction</strong>
              <div className="summary-pills">
                {derivedServices.length > 0 ? (
                  derivedServices.map((service) => (
                    <span key={service} className="summary-chip">
                      {service}
                    </span>
                  ))
                ) : (
                  <p className="muted">No selections yet.</p>
                )}
              </div>
            </div>
                {guidedPreviewOptions.length ? (
                  <div className="booking-preview-grouped">
                    <strong>Selected inspiration by category</strong>
                    <div className="booking-preview-selection-list">
                      {guidedPreviewOptions.map((category) => {
                        const selected = category.images.filter((item) =>
                          (selectedPreviewImages[category.key] ?? []).includes(item.id)
                        );
                        const uploads = categoryUploads[category.key] ?? [];
                        const note = categoryNotes[category.key];

                        return (
                          <div key={category.key} className="booking-preview-selection">
                            <span>{category.title}</span>
                        {selected.length ? (
                          <div className="booking-preview-selection-card">
                            <div className="booking-preview-selection-images">
                              {selected.map((item) => (
                                <img key={item.id} src={item.image_url} alt={item.title} loading="lazy" />
                              ))}
                            </div>
                            <small>{selected.map((item) => item.title).join(" • ")}</small>
                            {note ? <small>{note}</small> : null}
                            <button type="button" className="booking-preview-selection-remove" onClick={() => clearCategorySelection(category.key)}>
                              Remove
                            </button>
                          </div>
                        ) : uploads.length ? (
                          <div className="booking-preview-selection-card booking-preview-selection-card--placeholder">
                            <div className="booking-preview-selection-images">
                              {uploads.map((url) => (
                                <img key={url} src={url} alt={`${category.title} upload`} loading="lazy" />
                              ))}
                            </div>
                            <small>{uploads.length} uploaded inspiration image{uploads.length === 1 ? "" : "s"}</small>
                            {note ? <small>{note}</small> : null}
                            <button type="button" className="booking-preview-selection-remove" onClick={() => clearCategorySelection(category.key)}>
                              Clear
                            </button>
                          </div>
                        ) : note ? (
                          <div className="booking-preview-selection-card booking-preview-selection-card--placeholder">
                            <small>{note}</small>
                            <button type="button" className="booking-preview-selection-remove" onClick={() => clearCategorySelection(category.key)}>
                              Clear
                            </button>
                          </div>
                        ) : (
                          <p className="muted">Skipped for now</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div>
              <strong>Partner vendors</strong>
              <div className="summary-pills">
                {form.requestedVendorCategories.length > 0 ? (
                  form.requestedVendorCategories.map((category) => (
                    <span key={category} className="summary-chip">
                      {category}
                    </span>
                  ))
                ) : (
                  <p className="muted">No vendor recommendations requested.</p>
                )}
              </div>
            </div>
          </div>

          <p className="booking-preview-note">
            Inspiration preview only. Final concept, florals, rentals, and exact room design are refined during consultation.
          </p>
        </aside>
      </div>
    </div>
  );
}
