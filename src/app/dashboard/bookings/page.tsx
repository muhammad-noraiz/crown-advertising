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
import { ManagementMetric, ManagementPageHero } from "@/app/dashboard/components/ManagementPage";

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
    supabase.from("clients").select("id, name, email").order("name"),
    supabase.from("booking_invoices").select("*"),
  ]);

  const locations = (locationData ?? []) as { id: number; name: string; size: string; city: string }[];
  const clients = (clientsData ?? []) as { id: number; name: string; email: string | null }[];
  const clientEmailById = new Map(clients.map((client) => [client.id, client.email]));
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
    <div className="mx-auto max-w-[1800px] space-y-6 pb-10">
      <ManagementPageHero
        eyebrow="Campaign operations"
        title="Bookings & Invoices"
        description="Manage campaign schedules and follow every invoice from contract setup to the final collection."
        icon="booking"
        actions={
          <AddBookingModal
            locations={locations}
            clients={clients}
            buttonClassName="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_12px_30px_-15px_rgba(251,191,36,.95)] transition hover:-translate-y-0.5 hover:bg-amber-300"
          />
        }
        meta={<>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-slate-300">{total} booking{total === 1 ? "" : "s"} in this view</span>
          <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${overdueCount > 0 ? "border-red-300/20 bg-red-300/10 text-red-200" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"}`}>
            {overdueCount > 0 ? `${overdueCount} overdue invoice${overdueCount === 1 ? "" : "s"}` : "Collections are on track"}
          </span>
        </>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagementMetric label="Total invoiced" value={money(globalTotals.invoiced)} detail={`${allInvoices.length} invoice${allInvoices.length === 1 ? "" : "s"} raised`} tone="blue" icon="booking" />
        <ManagementMetric label="Cash received" value={money(globalTotals.paid)} detail="Payments recorded to date" tone="emerald" icon="detail" />
        <ManagementMetric label="Outstanding" value={money(globalTotals.outstanding)} detail="Still waiting to be collected" tone="amber" icon="client" />
        <ManagementMetric label="Overdue" value={money(globalTotals.overdue)} detail={`${overdueCount} invoice${overdueCount === 1 ? "" : "s"} need attention`} tone="red" icon="booking" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_14px_38px_-32px_rgba(15,23,42,.75)] dark:border-slate-700">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 xl:w-fit dark:bg-slate-900">
          {[
            ["all", "All bookings"],
            ["outstanding", "Outstanding"],
            ["overdue", "Overdue"],
            ["paid", "Paid"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={filterHref(value, q)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2.5 text-xs font-bold transition ${payment === value ? "bg-slate-900 text-white shadow-sm dark:bg-amber-400 dark:text-slate-950" : "text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"}`}
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
            className="m-0 border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_-38px_rgba(15,23,42,.75)] dark:border-slate-700">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
          <div><h2 className="font-bold text-slate-950 dark:text-slate-50">Booking register</h2><p className="mt-0.5 text-xs text-slate-500">Contract, collection and campaign status in one place.</p></div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-300">{total} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
                {["Location / client", "Booking period", "Payment plan", "Contract value", "Payment progress", "Invoice status", "Booking", "Actions"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
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
                    <tr key={booking.id} className="align-top transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-4">
                        <Link href={`/dashboard/locations/${booking.location_id}`} className="font-semibold text-slate-900 hover:text-amber-700">
                          {location?.name ?? "Unknown location"}
                        </Link>
                        <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">{booking.client_name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">{location ? `${location.size} · ${location.city}` : ""}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-600">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</p>
                        <p className="mt-1 text-slate-400">{booking.duration}</p>
                      </td>
                      <td className="min-w-[158px] px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] font-bold leading-none ${
                          booking.billing_type === "monthly"
                            ? "border-[#f4d98c] bg-[#fff8e6] text-[#8a5a00] dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300"
                            : "border-[#dbe6f3] bg-[#f2f6fb] text-[#425b78] dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-200"
                        }`}>
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                            {booking.billing_type === "monthly" ? <><path d="M4 5.5h12v10H4z" /><path d="M6.5 3.5v4M13.5 3.5v4M4 8.5h12" /></> : <><path d="M4 4.5h12v11H4z" /><path d="M7 8h6M7 11h6" /><path d="m12.5 13.5 1.5 1.5 2.5-3" /></>}
                          </svg>
                          {billingTypeLabel(booking.billing_type ?? "end_of_term")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900 dark:text-slate-100">{money(booking.amount)}</td>
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
                          <InvoiceManagerModal booking={booking as Booking} invoices={invoices} locationName={location?.name} clientEmail={booking.client_id ? clientEmailById.get(booking.client_id) : null} />
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
      </section>

      <Pagination page={page} totalPages={totalPages} basePath="/dashboard/bookings" query={{ q, payment: payment === "all" ? "" : payment }} />
    </div>
  );
}
