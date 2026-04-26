import { createClient } from "@/lib/supabase/server";
import { bookingStatus } from "@/lib/utils";
import type { LocationWithBookings } from "@/lib/supabase/types";
import { AddLocationModal } from "./AddLocationModal";
import { Pagination } from "@/app/dashboard/components/Pagination";
import Link from "next/link";

const PAGE_SIZE = 12;

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  // Total count for pagination
  const { count } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true });
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Paginated locations with bookings
  const { data } = await supabase
    .from("locations")
    .select("*, bookings(*)")
    .order("name")
    .range(from, to);
  const locations = (data ?? []) as LocationWithBookings[];

  const now = new Date();
  const locationsWithActive = locations.map((loc) => ({
    ...loc,
    activeBooking: loc.bookings
      .filter((b) => new Date(b.end_date) >= now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0] ?? null,
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

      {/* Grid */}
      {locations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <p className="text-slate-400 mb-4">No locations added yet.</p>
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

      <Pagination page={page} totalPages={totalPages} basePath="/dashboard/locations" />
    </div>
  );
}

