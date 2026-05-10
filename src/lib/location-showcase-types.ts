import type { LocationMediaCategory, PricingBasis } from "@/lib/supabase/types";

export type ShowcaseLocationStatus = "available" | "booked" | "expiring";

export interface ShowcaseLocation {
  id: string;
  databaseId: number | null;
  slide: number | null;
  city: string;
  section: string | null;
  category: LocationMediaCategory;
  name: string;
  size: string;
  from: string | null;
  toward: string | null;
  priceLabel: string | null;
  priceValue: number | null;
  pricingBasis: PricingBasis;
  availabilityLabel: string;
  status: ShowcaseLocationStatus;
  freeOn: string | null;
  freeDateLabel: string | null;
  details: string | null;
  image: string;
  source: "database" | "seed-fallback";
  activeBooking: {
    id: number;
    startDate: string;
    endDate: string;
    duration: string;
  } | null;
}

export const locationCategoryLabels: Record<LocationMediaCategory, string> = {
  static: "Static OOH",
  motorway: "M-2 & Ring Road",
  digital: "Digital SMD",
  "bridge-panel": "Bridge Panels",
  "toll-plaza": "Toll Plazas",
};
