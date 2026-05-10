import { createClient } from "@/lib/supabase/server";
import { bookingStatus } from "@/lib/utils";
import type { LocationWithBookings } from "@/lib/supabase/types";
import { AddLocationModal } from "./AddLocationModal";
import { Pagination } from "@/app/dashboard/components/Pagination";
import { SearchBox } from "@/app/dashboard/components/SearchBox";
import Link from "next/link";

const PAGE_SIZE = 12;
const LOCATION_SEARCH_COLUMNS = ["name", "size", "city", "address", "price_label", "facing_from", "facing_towards", "media_category"];

function searchFilter(columns: string[], query: string) {
  const value = query.replace(/[%(),]/g, " ").trim().replace(/\s+/g, "%");
  if (!value) return null;
  return columns.map((column) => `${column}.ilike.%${value}%`).join(",");
}

function formatLocationPrice(location: LocationWithBookings) {
  if (location.price_label) return location.price_label;
  if (location.price_per_month === null) return "Price on request";

  const amount = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(location.price_per_month);
  if (location.pricing_basis === "slot") return `PKR ${amount} / slot`;
  if (location.pricing_basis === "on_request") return `PKR ${amount}`;
  return `PKR ${amount} / month`;
}

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageStr, q: rawQuery } = await searchParams;
  const q = rawQuery?.trim() ?? "";
  const filter = searchFilter(LOCATION_SEARCH_COLUMNS, q);
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  // Total count for pagination
  const countRequest = supabase
    .from("locations")
    .select("id", { count: "exact", head: true });
  if (filter) countRequest.or(filter);
  const { count, error: countError } = await countRequest;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Paginated locations with bookings
  const locationsRequest = supabase
    .from("locations")
    .select("*, bookings(*)")
    .order("name");
  if (filter) locationsRequest.or(filter);
  const { data, error: locationsError } = await locationsRequest.range(from, to);
  const locations = (data ?? []) as LocationWithBookings[];
  const queryError = countError ?? locationsError;

  const now = new Date();
  const locationsWithActive = locations.map((loc) => ({
    ...loc,
    activeBooking: loc.bookings
      .filter((b) => new Date(b.start_date) <= now && new Date(b.end_date) >= now)
      .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())[0] ?? null,
  }));

  const occupied = locationsWithActive.filter((l) => l.activeBooking).length;
  const available = total - occupied;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Locations</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {total} total · {occupied} occupied · {available} available
          </p>
        </div>
        <AddLocationModal />
      </div>

      <SearchBox
        basePath="/dashboard/locations"
        defaultValue={q}
        placeholder="Search locations by name, city, size, route, price..."
      />

      {/* Grid */}
      {queryError ? (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <p className="font-semibold text-red-700">Could not load locations from Supabase.</p>
          <p className="mt-1 text-sm text-red-600">{queryError.message}</p>
          <p className="mt-3 text-sm text-red-500">
            Check that the app and seed command are using the same Supabase environment and that the latest migration has been applied.
          </p>
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <p className="text-slate-400 mb-4">No locations added yet.</p>
          <p className="mb-6 text-sm text-slate-400">
            {q ? "No locations match your search." : "If you already seeded, confirm the seed command and the running app point to the same Supabase environment."}
          </p>
          <AddLocationModal />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locationsWithActive.map((loc) => {
            const { activeBooking } = loc;
            const isOccupied = !!activeBooking;
            const status = activeBooking ? bookingStatus(activeBooking.end_date) : null;

            return (
              <Link
                key={loc.id}
                href={`/dashboard/locations/${loc.id}`}
                className="bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      !isOccupied
                        ? "bg-green-100 text-green-700"
                        : status === "expiring"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {!isOccupied ? "Available" : status === "expiring" ? "Expiring Soon" : "Occupied"}
                  </span>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1 group-hover:text-amber-700 transition-colors">
                  {loc.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">{loc.size}</span>
                  <span>·</span>
                  <span>{loc.city}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-800">{formatLocationPrice(loc)}</p>

                {activeBooking && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">Current client</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5">{activeBooking.client_name}</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/dashboard/locations" query={{ q }} />
    </div>
  );
}
