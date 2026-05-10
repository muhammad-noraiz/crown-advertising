import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Booking, Location, LocationImage, LocationMediaCategory, PricingBasis } from "@/lib/supabase/types";
import { formatDate, getLocationImageUrl } from "@/lib/utils";
import { mediaKitLocations } from "@/lib/media-kit";
import type { MediaLocation } from "@/lib/media-kit";
import type { ShowcaseLocation, ShowcaseLocationStatus } from "@/lib/location-showcase-types";

type LocationRow = Location & {
  bookings?: Booking[] | null;
  location_images?: LocationImage[] | null;
};

export interface ShowcaseSummary {
  total: number;
  available: number;
  booked: number;
  expiring: number;
  cities: string[];
  categories: LocationMediaCategory[];
  usesFallbackData: boolean;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDateOnly(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function activeBookingFor(bookings: Booking[] | null | undefined) {
  const now = new Date();
  return (bookings ?? [])
    .filter((booking) => {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      return start <= now && end >= now;
    })
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())[0] ?? null;
}

function statusFromBooking(booking: Booking | null): ShowcaseLocationStatus {
  if (!booking) return "available";
  const end = new Date(booking.end_date);
  const daysUntilFree = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
  return daysUntilFree <= 7 ? "expiring" : "booked";
}

function parseMediaKitAvailability(value: string | null) {
  if (!value) {
    return {
      status: "available" as ShowcaseLocationStatus,
      freeOn: null,
      freeDateLabel: null,
      availabilityLabel: "Available now",
    };
  }

  const text = value.trim();
  const lowered = text.toLowerCase();
  if (lowered.includes("current") && !lowered.includes("hold")) {
    return {
      status: "available" as ShowcaseLocationStatus,
      freeOn: null,
      freeDateLabel: null,
      availabilityLabel: "Available now",
    };
  }

  const dateMatch = text.match(/(\d{1,2})\.([A-Za-z]+)\.(\d{2,4})/);
  if (dateMatch) {
    const [, day, monthName, year] = dateMatch;
    const parsed = new Date(`${day} ${monthName} ${year.length === 2 ? `20${year}` : year}`);
    if (!Number.isNaN(parsed.getTime())) {
      const freeOn = normalizeDateOnly(parsed);
      const isFuture = parsed >= new Date();
      return {
        status: isFuture ? ("booked" as ShowcaseLocationStatus) : ("available" as ShowcaseLocationStatus),
        freeOn: isFuture ? freeOn : null,
        freeDateLabel: isFuture ? formatDate(freeOn) : null,
        availabilityLabel: isFuture ? `Free after ${formatDate(freeOn)}` : "Available now",
      };
    }
  }

  return {
    status: "booked" as ShowcaseLocationStatus,
    freeOn: null,
    freeDateLabel: null,
    availabilityLabel: text,
  };
}

function formatPrice(value: number | null, basis: PricingBasis) {
  if (value === null) return null;
  const formatted = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(value);
  if (basis === "slot") return `PKR ${formatted} / slot`;
  if (basis === "on_request") return `PKR ${formatted}`;
  return `PKR ${formatted} / month`;
}

function imageForLocation(location: LocationRow) {
  if (location.public_image_path) {
    if (location.public_image_path.startsWith("/") || location.public_image_path.startsWith("http")) {
      return location.public_image_path;
    }
    return getLocationImageUrl(location.public_image_path);
  }

  const firstImage = location.location_images?.[0];
  if (firstImage) return getLocationImageUrl(firstImage.storage_path);

  const source = location.source_slide
    ? mediaKitLocations.find((item) => item.slide === location.source_slide)
    : null;

  return source?.image ?? "/crown-assets/hero-billboard.jpg";
}

function fromDatabaseLocation(location: LocationRow): ShowcaseLocation {
  const activeBooking = activeBookingFor(location.bookings);
  const status = statusFromBooking(activeBooking);
  const freeOn = activeBooking ? normalizeDateOnly(activeBooking.end_date) : null;
  const source = location.source_slide
    ? mediaKitLocations.find((item) => item.slide === location.source_slide)
    : null;

  return {
    id: `location-${location.id}`,
    databaseId: location.id,
    slide: location.source_slide,
    city: location.city,
    section: source?.section ?? null,
    category: location.media_category ?? source?.category ?? "static",
    name: location.name,
    size: location.size,
    from: location.facing_from,
    toward: location.facing_towards,
    priceLabel: location.price_label ?? formatPrice(location.price_per_month, location.pricing_basis),
    priceValue: location.price_per_month,
    pricingBasis: location.pricing_basis,
    availabilityLabel: activeBooking ? `Free after ${formatDate(freeOn!)}` : "Available now",
    status,
    freeOn,
    freeDateLabel: freeOn ? formatDate(freeOn) : null,
    details: location.address,
    image: imageForLocation(location),
    source: "database",
    activeBooking: activeBooking
      ? {
          id: activeBooking.id,
          startDate: activeBooking.start_date,
          endDate: activeBooking.end_date,
          duration: activeBooking.duration,
        }
      : null,
  };
}

function priceValueFromMediaKit(value: string | null) {
  if (!value) return null;
  const match = value.match(/[\d,.]+/);
  if (!match) return null;
  const amount = Number(match[0].replace(/,/g, ""));
  if (!Number.isFinite(amount)) return null;
  return /million/i.test(value) ? amount * 1_000_000 : amount;
}

function pricingBasisFromMediaKit(location: MediaLocation): PricingBasis {
  if (!location.rent) return "on_request";
  return location.category === "digital" ? "slot" : "monthly";
}

function fromMediaKitLocation(location: MediaLocation): ShowcaseLocation {
  const availability = parseMediaKitAvailability(location.availability);
  const pricingBasis = pricingBasisFromMediaKit(location);

  return {
    id: location.id || `slide-${location.slide}-${slugify(location.name)}`,
    databaseId: null,
    slide: location.slide,
    city: location.city,
    section: location.section,
    category: location.category,
    name: location.name,
    size: location.size,
    from: location.from,
    toward: location.toward,
    priceLabel: location.rent,
    priceValue: priceValueFromMediaKit(location.rent),
    pricingBasis,
    availabilityLabel: availability.availabilityLabel,
    status: availability.status,
    freeOn: availability.freeOn,
    freeDateLabel: availability.freeDateLabel,
    details: location.details,
    image: location.image,
    source: "seed-fallback",
    activeBooking: null,
  };
}

export function summarizeShowcaseLocations(locations: ShowcaseLocation[]): ShowcaseSummary {
  const cities = Array.from(new Set(locations.map((location) => location.city))).sort();
  const categories = Array.from(new Set(locations.map((location) => location.category))).sort();
  const available = locations.filter((location) => location.status === "available").length;
  const expiring = locations.filter((location) => location.status === "expiring").length;
  const booked = locations.length - available;

  return {
    total: locations.length,
    available,
    booked,
    expiring,
    cities,
    categories,
    usesFallbackData: locations.some((location) => location.source === "seed-fallback"),
  };
}

export async function getShowcaseLocations(): Promise<ShowcaseLocation[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("is_active", true)
      .order("source_slide", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      const ids = data.map((location) => location.id);
      const [{ data: bookings }, { data: images }] = await Promise.all([
        supabase.from("bookings").select("*").in("location_id", ids),
        supabase.from("location_images").select("*").in("location_id", ids).order("created_at", { ascending: false }),
      ]);

      const bookingsByLocation = new Map<number, Booking[]>();
      for (const booking of bookings ?? []) {
        const list = bookingsByLocation.get(booking.location_id) ?? [];
        list.push(booking);
        bookingsByLocation.set(booking.location_id, list);
      }

      const imagesByLocation = new Map<number, LocationImage[]>();
      for (const image of images ?? []) {
        const list = imagesByLocation.get(image.location_id) ?? [];
        list.push(image);
        imagesByLocation.set(image.location_id, list);
      }

      return data
        .map((location) => ({
          ...location,
          bookings: bookingsByLocation.get(location.id) ?? [],
          location_images: imagesByLocation.get(location.id) ?? [],
        }))
        .map(fromDatabaseLocation)
        .sort((a, b) => (a.slide ?? Number.MAX_SAFE_INTEGER) - (b.slide ?? Number.MAX_SAFE_INTEGER) || a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
    }
  } catch {
    // The public page remains previewable before Supabase environment variables are configured.
  }

  return mediaKitLocations.map(fromMediaKitLocation);
}
