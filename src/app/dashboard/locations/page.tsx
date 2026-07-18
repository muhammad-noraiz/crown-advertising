import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { bookingStatus } from "@/lib/utils";
import type { LocationWithBookings } from "@/lib/supabase/types";
import { AddLocationModal } from "./AddLocationModal";
import { Pagination } from "@/app/dashboard/components/Pagination";
import { SearchBox } from "@/app/dashboard/components/SearchBox";
import { ManagementMetric, ManagementPageHero } from "@/app/dashboard/components/ManagementPage";

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

export default async function LocationsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { page: pageStr, q: rawQuery } = await searchParams;
  const q = rawQuery?.trim() ?? "";
  const filter = searchFilter(LOCATION_SEARCH_COLUMNS, q);
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();

  const countRequest = supabase.from("locations").select("id", { count: "exact", head: true });
  const locationsRequest = supabase.from("locations").select("*, bookings(*)").order("name");
  if (filter) {
    countRequest.or(filter);
    locationsRequest.or(filter);
  }

  const [countResult, locationsResult, inventoryResult, liveBookingsResult] = await Promise.all([
    countRequest,
    locationsRequest.range(from, to),
    supabase.from("locations").select("id, is_active"),
    supabase.from("bookings").select("location_id").lte("start_date", today).gte("end_date", today),
  ]);

  const total = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const locations = (locationsResult.data ?? []) as LocationWithBookings[];
  const inventory = inventoryResult.data ?? [];
  const activeInventory = inventory.filter((location) => location.is_active !== false).length;
  const occupiedIds = new Set((liveBookingsResult.data ?? []).map((booking) => booking.location_id));
  const occupied = occupiedIds.size;
  const available = Math.max(0, activeInventory - occupied);
  const occupancyRate = activeInventory > 0 ? Math.round((occupied / activeInventory) * 100) : 0;
  const queryError = countResult.error ?? locationsResult.error ?? inventoryResult.error ?? liveBookingsResult.error;
  const now = new Date();
  const locationsWithActive = locations.map((loc) => ({
    ...loc,
    activeBooking: loc.bookings
      .filter((booking) => new Date(booking.start_date) <= now && new Date(booking.end_date) >= now)
      .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())[0] ?? null,
  }));

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 pb-10">
      <ManagementPageHero
        eyebrow="Media inventory"
        title="Locations"
        description="Manage every advertising site, see live availability and move from inventory to booking without losing operational context."
        icon="location"
        actions={
          <AddLocationModal
            buttonClassName="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_12px_30px_-15px_rgba(251,191,36,.95)] transition hover:-translate-y-0.5 hover:bg-amber-300"
          />
        }
        meta={<>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-slate-300">{activeInventory} active sites</span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200">{available} ready to book</span>
        </>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagementMetric label="Active inventory" value={String(activeInventory)} detail={`${inventory.length - activeInventory} inactive locations`} tone="blue" icon="location" />
        <ManagementMetric label="Occupied now" value={String(occupied)} detail="Locations with a live campaign" tone="red" icon="booking" />
        <ManagementMetric label="Available now" value={String(available)} detail="Ready for a new booking" tone="emerald" icon="detail" />
        <ManagementMetric label="Occupancy rate" value={`${occupancyRate}%`} detail={`${occupied} of ${activeInventory} active sites`} tone="amber" icon="detail" />
      </section>

      <SearchBox basePath="/dashboard/locations" defaultValue={q} placeholder="Search by name, city, size, route or price..." />

      {queryError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="font-semibold text-red-700 dark:text-red-300">Could not load locations from Supabase.</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{queryError.message}</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center dark:border-slate-700">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>
          </div>
          <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{q ? "No locations match this search" : "No locations added yet"}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Try a different route or city, or add a new advertising location.</p>
          <div className="mt-6"><AddLocationModal /></div>
        </div>
      ) : (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-slate-50">Inventory directory</h2>
              <p className="mt-1 text-xs text-slate-500">Showing {locations.length} of {total} matching locations</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {locationsWithActive.map((loc) => {
              const { activeBooking } = loc;
              const isOccupied = !!activeBooking;
              const status = activeBooking ? bookingStatus(activeBooking.end_date) : null;
              const statusClass = !loc.is_active
                ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                : !isOccupied
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                : status === "expiring"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                : "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300";
              const statusText = !loc.is_active ? "Inactive" : !isOccupied ? "Available" : status === "expiring" ? "Expiring soon" : "Occupied";

              return (
                <Link key={loc.id} href={`/dashboard/locations/${loc.id}`} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_-32px_rgba(15,23,42,.8)] transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_22px_46px_-30px_rgba(15,23,42,.75)] dark:border-slate-700 dark:hover:border-amber-400/50">
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-bl from-amber-100/80 to-transparent opacity-70 dark:from-amber-400/10" />
                  <div className="relative flex items-start justify-between gap-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>{statusText}</span>
                    <svg className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                  <div className="relative mt-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{loc.city}</p>
                    <h3 className="mt-1 min-h-10 text-base font-bold leading-5 text-slate-950 transition group-hover:text-amber-700 dark:text-slate-50 dark:group-hover:text-amber-300">{loc.name}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800 dark:text-slate-300">{loc.size}</span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 capitalize dark:bg-slate-800 dark:text-slate-300">{loc.media_category.replaceAll("_", " ")}</span>
                    </div>
                    <p className="mt-5 text-sm font-bold text-slate-900 dark:text-slate-100">{formatLocationPrice(loc)}</p>
                  </div>
                  <div className="relative mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
                    {activeBooking ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current client</p><p className="mt-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{activeBooking.client_name}</p></div>
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-400 shadow-[0_0_0_4px_rgba(248,113,113,.12)]" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Open for booking</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/dashboard/locations" query={{ q }} />
    </div>
  );
}
