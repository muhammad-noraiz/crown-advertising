export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(new Date(date));
}

export function toInputDate(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0];
}

export function bookingStatus(endDate: Date | string): "active" | "expiring" | "expired" {
  const end = new Date(endDate);
  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 7) return "expiring";
  return "active";
}

export const DURATION_PRESETS = [
  "1 Week",
  "10 Days",
  "15 Days",
  "1 Month",
  "1 Month (Ext)",
  "2 Months",
  "3 Months",
  "6 Months",
  "1 Year",
];

export function addDuration(startDate: string, duration: string): string {
  const d = new Date(startDate);
  const map: Record<string, () => void> = {
    "1 Week": () => d.setDate(d.getDate() + 7),
    "10 Days": () => d.setDate(d.getDate() + 10),
    "15 Days": () => d.setDate(d.getDate() + 15),
    "1 Month": () => d.setMonth(d.getMonth() + 1),
    "1 Month (Ext)": () => d.setMonth(d.getMonth() + 1),
    "2 Months": () => d.setMonth(d.getMonth() + 2),
    "3 Months": () => d.setMonth(d.getMonth() + 3),
    "6 Months": () => d.setMonth(d.getMonth() + 6),
    "1 Year": () => d.setFullYear(d.getFullYear() + 1),
  };
  map[duration]?.();
  return d.toISOString().split("T")[0];
}

export function getLocationImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/location-images/${storagePath}`;
}
