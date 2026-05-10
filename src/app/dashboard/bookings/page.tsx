import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, bookingStatus } from "@/lib/utils";
import type { BookingWithLocation, Booking, Location } from "@/lib/supabase/types";
import { AddBookingModal } from "./AddBookingModal";
import { EditBookingModal } from "./EditBookingModal";
import { Pagination } from "@/app/dashboard/components/Pagination";
import { SearchBox } from "@/app/dashboard/components/SearchBox";

const PAGE_SIZE = 20;
const BOOKING_SEARCH_COLUMNS = ["client_name", "sale_person", "vendor", "locking_ref", "invoice_no", "duration", "remarks"];

const invoiceStatusLabel: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Paid", cls: "bg-green-100 text-green-700" },
  OVERDUE: { label: "Overdue", cls: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-500" },
};

const bookingStatusLabel: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-700" },
  expiring: { label: "Expiring Soon", cls: "bg-amber-100 text-amber-700" },
  expired: { label: "Expired", cls: "bg-red-100 text-red-700" },
};

function cleanSearchValue(query: string) {
  return query.replace(/[%(),]/g, " ").trim().replace(/\s+/g, "%");
}

function matchesLocationSearch(location: { name: string; size: string; city: string }, query: string) {
  const needle = query.toLowerCase();
  return [location.name, location.size, location.city].some((value) => value.toLowerCase().includes(needle));
}

function bookingSearchFilter(query: string, locationIds: number[]) {
  const value = cleanSearchValue(query);
  if (!value) return null;
  const filters = BOOKING_SEARCH_COLUMNS.map((column) => `${column}.ilike.%${value}%`);
  if (locationIds.length > 0) filters.push(`location_id.in.(${locationIds.join(",")})`);
  return filters.join(",");
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageStr, q: rawQuery } = await searchParams;
  const q = rawQuery?.trim() ?? "";
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const [{ data: locationData }, { data: clientsData }] = await Promise.all([
    supabase.from("locations").select("id, name, size, city").eq("is_active", true).order("name"),
    supabase.from("clients").select("id, name").order("name"),
  ]);
  const locations = (locationData ?? []) as { id: number; name: string; size: string; city: string }[];
  const clients = (clientsData ?? []) as { id: number; name: string }[];
  const matchingLocationIds = q ? locations.filter((location) => matchesLocationSearch(location, q)).map((location) => location.id) : [];
  const filter = q ? bookingSearchFilter(q, matchingLocationIds) : null;
  const bookingsRequest = supabase
    .from("bookings")
    .select("*, locations(id, name)", { count: "exact" })
    .order("start_date", { ascending: false });
  if (filter) bookingsRequest.or(filter);

  const { data, count } = await bookingsRequest.range(from, to);
  const bookings = (data ?? []) as BookingWithLocation[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Bookings</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} total records</p>
        </div>
        <AddBookingModal locations={locations} clients={clients} />
      </div>

      <SearchBox
        basePath="/dashboard/bookings"
        defaultValue={q}
        placeholder="Search bookings by location, client, invoice, vendor, remarks..."
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Location", "Starting Date", "Duration", "Ending Date", "Display (Client)", "Sale", "Vendor", "Locking Ref.", "Invoice No.", "Invoice", "Status", "Remarks", ""].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-slate-400">
                    {q ? "No bookings match your search." : "No bookings yet."}{" "}
                    <AddBookingModal
                      locations={locations}
                      clients={clients}
                      buttonClassName="text-amber-600 hover:underline text-sm"
                      buttonLabel="Add the first one →"
                    />
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const bs = bookingStatus(b.end_date);
                  const bsl = bookingStatusLabel[bs];
                  const isl = invoiceStatusLabel[b.invoice_status] ?? invoiceStatusLabel.PENDING;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-40 truncate">
                        <Link href={`/dashboard/locations/${b.location_id}`} className="hover:text-amber-600">
                          {(b.locations as { name: string } | null)?.name ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(b.start_date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{b.duration}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(b.end_date)}</td>
                      <td className="px-4 py-3 text-slate-800 font-medium">{b.client_name}</td>
                      <td className="px-4 py-3 text-slate-500">{b.sale_person ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{b.vendor ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{b.locking_ref ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{b.invoice_no ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isl.cls}`}>
                          {isl.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bsl.cls}`}>
                          {bsl.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-28 truncate">{b.remarks ?? "—"}</td>
                      <td className="px-4 py-3">
                        <EditBookingModal
                          booking={b as Booking}
                          location={(b.locations ?? { id: b.location_id, name: "—", size: "—", city: "—" }) as Pick<Location, "id" | "name" | "size" | "city">}
                          clients={clients}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/dashboard/bookings" query={{ q }} />
    </div>
  );
}
