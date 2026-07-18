import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, bookingStatus } from "@/lib/utils";
import {
  billingTypeLabel,
  getBookingInvoiceStatus,
  getInvoiceStatus,
  getInvoiceTotals,
} from "@/lib/invoices";
import type { Booking, BookingInvoice, BookingWithLocation, Location } from "@/lib/supabase/types";
import { AddBookingModal } from "./AddBookingModal";
import { EditBookingModal } from "./EditBookingModal";
import { InvoiceManagerModal } from "./InvoiceManagerModal";
import { Pagination } from "@/app/dashboard/components/Pagination";
import { SearchBox } from "@/app/dashboard/components/SearchBox";

const PAGE_SIZE = 20;
const BOOKING_SEARCH_COLUMNS = ["client_name", "sale_person", "vendor", "locking_ref", "duration", "remarks"];

const paymentStatusLabel = {
  NOT_SETUP: { label: "Not set up", cls: "bg-slate-100 text-slate-600" },
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  PARTIAL: { label: "Part paid", cls: "bg-blue-100 text-blue-700" },
  PAID: { label: "Paid", cls: "bg-emerald-100 text-emerald-700" },
  OVERDUE: { label: "Overdue", cls: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-500" },
};

const bookingStatusLabel = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700" },
  expiring: { label: "Expiring soon", cls: "bg-amber-100 text-amber-700" },
  expired: { label: "Expired", cls: "bg-red-100 text-red-700" },
};

function money(value: number) {
  return `PKR ${Math.round(value).toLocaleString()}`;
}

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

function filterHref(payment: string, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (payment !== "all") params.set("payment", payment);
  const value = params.toString();
  return `/dashboard/bookings${value ? `?${value}` : ""}`;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; payment?: string }>;
}) {
  const { page: pageStr, q: rawQuery, payment: rawPayment } = await searchParams;
  const q = rawQuery?.trim() ?? "";
  const payment = ["all", "outstanding", "overdue", "paid"].includes(rawPayment ?? "") ? rawPayment! : "all";
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const [{ data: locationData }, { data: clientsData }, { data: invoiceData }] = await Promise.all([
    supabase.from("locations").select("id, name, size, city").eq("is_active", true).order("name"),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("booking_invoices").select("*"),
  ]);

  const locations = (locationData ?? []) as { id: number; name: string; size: string; city: string }[];
  const clients = (clientsData ?? []) as { id: number; name: string }[];
  const allInvoices = (invoiceData ?? []) as BookingInvoice[];
  const globalTotals = getInvoiceTotals(allInvoices);
  const invoiceGroups = new Map<number, BookingInvoice[]>();
  allInvoices.forEach((invoice) => {
    const current = invoiceGroups.get(invoice.booking_id) ?? [];
    current.push(invoice);
    invoiceGroups.set(invoice.booking_id, current);
  });

  const matchingLocationIds = q ? locations.filter((location) => matchesLocationSearch(location, q)).map((location) => location.id) : [];
  const filter = q ? bookingSearchFilter(q, matchingLocationIds) : null;
  const bookingsRequest = supabase
    .from("bookings")
    .select("*, locations(id, name, size, city), booking_invoices(*)", { count: "exact" })
    .order("start_date", { ascending: false });

  if (filter) bookingsRequest.or(filter);

  if (payment !== "all") {
    const matchingBookingIds = [...invoiceGroups.entries()]
      .filter(([, invoices]) => {
        if (payment === "paid") return getBookingInvoiceStatus(invoices) === "PAID";
        if (payment === "overdue") return invoices.some((invoice) => getInvoiceStatus(invoice) === "OVERDUE");
        return invoices.some((invoice) => {
          const status = getInvoiceStatus(invoice);
          return status !== "PAID" && status !== "CANCELLED" && invoice.paid_amount < invoice.amount;
        });
      })
      .map(([bookingId]) => bookingId);
    bookingsRequest.in("id", matchingBookingIds.length > 0 ? matchingBookingIds : [-1]);
  }

  const { data, count } = await bookingsRequest.range(from, to);
  const bookings = (data ?? []) as BookingWithLocation[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const overdueCount = allInvoices.filter((invoice) => getInvoiceStatus(invoice) === "OVERDUE").length;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Revenue collection</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Bookings & invoices</h1>
          <p className="mt-1 text-sm text-slate-500">Track monthly rent and combined end-of-term payments by location.</p>
        </div>
        <AddBookingModal locations={locations} clients={clients} />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total invoiced", value: globalTotals.invoiced, detail: `${allInvoices.length} invoices`, cls: "text-slate-900" },
          { label: "Received", value: globalTotals.paid, detail: "Payments recorded", cls: "text-emerald-700" },
          { label: "Outstanding", value: globalTotals.outstanding, detail: "Still to collect", cls: "text-amber-700" },
          { label: "Overdue", value: globalTotals.overdue, detail: `${overdueCount} overdue invoice${overdueCount === 1 ? "" : "s"}`, cls: "text-red-700" },
        ].map((item) => (
          <div key={item.label} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5">
            <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-amber-50" />
            <p className="relative text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            <p className={`relative mt-2 text-xl font-bold ${item.cls}`}>{money(item.value)}</p>
            <p className="relative mt-1 text-xs text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-fit rounded-lg border border-slate-200 bg-white p-1">
          {[
            ["all", "All bookings"],
            ["outstanding", "Outstanding"],
            ["overdue", "Overdue"],
            ["paid", "Paid"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={filterHref(value, q)}
              className={`rounded-md px-3 py-2 text-xs font-semibold transition ${payment === value ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="w-full xl:max-w-xl">
          <SearchBox
            basePath="/dashboard/bookings"
            defaultValue={q}
            placeholder="Search location, client, vendor, reference or remarks..."
            query={{ payment: payment === "all" ? undefined : payment }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Location / client", "Booking period", "Payment plan", "Contract value", "Payment progress", "Invoice status", "Booking", "Actions"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-slate-400">
                    {q || payment !== "all" ? "No bookings match these filters." : "No bookings yet."}
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const invoices = booking.booking_invoices ?? [];
                  const totals = getInvoiceTotals(invoices);
                  const paymentState = getBookingInvoiceStatus(invoices);
                  const paymentStyle = paymentStatusLabel[paymentState];
                  const bookingState = bookingStatus(booking.end_date);
                  const bookingStyle = bookingStatusLabel[bookingState];
                  const location = booking.locations as Pick<Location, "id" | "name" | "size" | "city"> | null;
                  const progress = totals.invoiced > 0 ? Math.min(100, (totals.paid / totals.invoiced) * 100) : 0;

                  return (
                    <tr key={booking.id} className="align-top transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <Link href={`/dashboard/locations/${booking.location_id}`} className="font-semibold text-slate-900 hover:text-amber-700">
                          {location?.name ?? "Unknown location"}
                        </Link>
                        <p className="mt-1 text-xs font-medium text-slate-600">{booking.client_name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">{location ? `${location.size} · ${location.city}` : ""}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-600">
                        <p className="font-medium text-slate-800">{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</p>
                        <p className="mt-1 text-slate-400">{booking.duration}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {billingTypeLabel(booking.billing_type ?? "end_of_term")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">{money(booking.amount)}</td>
                      <td className="min-w-44 px-4 py-4">
                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="font-semibold text-emerald-700">{money(totals.paid)}</span>
                          <span className="text-slate-400">{money(totals.outstanding)} left</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="mt-1.5 text-[10px] text-slate-400">{invoices.length} invoice{invoices.length === 1 ? "" : "s"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentStyle.cls}`}>{paymentStyle.label}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${bookingStyle.cls}`}>{bookingStyle.label}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <InvoiceManagerModal booking={booking as Booking} invoices={invoices} locationName={location?.name} />
                          <EditBookingModal
                            booking={booking as Booking}
                            location={(location ?? { id: booking.location_id, name: "—", size: "—", city: "—" }) as Pick<Location, "id" | "name" | "size" | "city">}
                            clients={clients}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/dashboard/bookings" query={{ q, payment: payment === "all" ? "" : payment }} />
    </div>
  );
}
