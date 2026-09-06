import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, bookingStatus } from "@/lib/utils";
import type { Client, Booking, BookingInvoice, Location } from "@/lib/supabase/types";
import { EditClientModal } from "@/app/dashboard/clients/EditClientModal";
import { DeleteClientButton } from "@/app/dashboard/clients/DeleteClientButton";
import { EditBookingModal } from "@/app/dashboard/bookings/EditBookingModal";
import { InvoiceManagerModal } from "@/app/dashboard/bookings/InvoiceManagerModal";
import { ManagementMetric, ManagementPageHero } from "@/app/dashboard/components/ManagementPage";
import { clientDisplayNames } from "@/lib/clients";
import { getBookingInvoiceStatus, getInvoiceTotals } from "@/lib/invoices";

const invoiceStatusLabel: Record<string, { label: string; cls: string }> = {
  NOT_SETUP: { label: "Not set up", cls: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300" },
  PARTIAL: { label: "Part paid", cls: "bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300" },
  PAID: { label: "Paid", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" },
  OVERDUE: { label: "Overdue", cls: "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" },
};

function money(value: number) {
  return `PKR ${Math.round(value).toLocaleString("en-PK")}`;
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: clientData }, { data: bookingsData }, { data: clientsData }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", Number(id)).single(),
    supabase.from("bookings").select("*, locations(id, name, size, city), booking_invoices(*)").eq("client_id", Number(id)).order("start_date", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  if (!clientData) notFound();
  const client = clientData as Client;
  const bookings = (bookingsData ?? []) as (Booking & { locations: Pick<Location, "id" | "name" | "size" | "city"> | null; booking_invoices: BookingInvoice[] })[];
  const allClients = (clientsData ?? []) as { id: number; name: string }[];
  const today = new Date().toISOString().slice(0, 10);
  const activeBookings = bookings.filter((booking) => booking.start_date <= today && booking.end_date >= today);
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount ?? 0), 0);
  const invoiceTotals = getInvoiceTotals(bookings.flatMap((booking) => booking.booking_invoices ?? []));
  const collectionRate = invoiceTotals.invoiced > 0 ? Math.round((invoiceTotals.paid / invoiceTotals.invoiced) * 100) : 0;

  const clientNames = clientDisplayNames(client);

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 pb-10">
      <ManagementPageHero
        eyebrow="Client profile"
        title={clientNames.primary}
        description={`${clientNames.secondary} · Complete campaign, contract and collection history.`}
        icon="client"
        actions={<><EditClientModal client={client} /><DeleteClientButton id={client.id} /></>}
        meta={<>
          <Link href="/dashboard/clients" className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-amber-300/30 hover:text-amber-200">← Client directory</Link>
          <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${activeBookings.length > 0 ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[0.05] text-slate-300"}`}>{activeBookings.length > 0 ? `${activeBookings.length} live campaign${activeBookings.length === 1 ? "" : "s"}` : "No live campaigns"}</span>
        </>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagementMetric label="Total bookings" value={String(bookings.length)} detail={`${activeBookings.length} currently active`} tone="blue" icon="booking" />
        <ManagementMetric label="Contract value" value={money(totalRevenue)} detail="All-time booked sales" tone="amber" icon="detail" />
        <ManagementMetric label="Cash received" value={money(invoiceTotals.paid)} detail={`${collectionRate}% of invoiced value collected`} tone="emerald" icon="booking" />
        <ManagementMetric label="Outstanding" value={money(invoiceTotals.outstanding)} detail="Open invoice balance" tone={invoiceTotals.outstanding > 0 ? "red" : "slate"} icon="client" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Phone", value: client.phone ?? "Not provided", href: client.phone ? `tel:${client.phone}` : undefined },
          { label: "Email", value: client.email ?? "Not provided", href: client.email ? `mailto:${client.email}` : undefined },
          { label: "Address", value: client.address ?? "Not provided", href: undefined },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            {item.href ? <a href={item.href} className="mt-2 block break-words text-sm font-semibold text-slate-900 hover:text-amber-700 dark:text-slate-100 dark:hover:text-amber-300">{item.value}</a> : <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>}
          </article>
        ))}
      </section>

      {client.notes && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-400/20 dark:bg-amber-400/5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">Relationship notes</p><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{client.notes}</p></section>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_-38px_rgba(15,23,42,.75)] dark:border-slate-700">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
          <div><h2 className="font-bold text-slate-950 dark:text-slate-50">Campaign history</h2><p className="mt-0.5 text-xs text-slate-500">Every site booked by this client with collection progress.</p></div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-300">{bookings.length} bookings</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">{["Location", "Campaign period", "Contract value", "Collection", "Invoice", "Status", "Actions"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {bookings.length === 0 ? <tr><td colSpan={7} className="px-6 py-14 text-center text-slate-400">No bookings have been created for this client.</td></tr> : bookings.map((booking) => {
                const status = bookingStatus(booking.end_date);
                const statusClass = status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" : status === "expiring" ? "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300" : "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300";
                const statusText = status === "active" ? "Active" : status === "expiring" ? "Expiring soon" : "Expired";
                const invoices = booking.booking_invoices ?? [];
                const totals = getInvoiceTotals(invoices);
                const invoiceStyle = invoiceStatusLabel[getBookingInvoiceStatus(invoices)] ?? invoiceStatusLabel.PENDING;
                const progress = totals.invoiced > 0 ? Math.min(100, (totals.paid / totals.invoiced) * 100) : 0;
                return (
                  <tr key={booking.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-4"><Link href={`/dashboard/locations/${booking.location_id}`} className="font-bold text-slate-950 hover:text-amber-700 dark:text-slate-50 dark:hover:text-amber-300">{booking.locations?.name ?? "Unknown location"}</Link><p className="mt-1 text-xs text-slate-400">{booking.locations ? `${booking.locations.size} · ${booking.locations.city}` : ""}</p></td>
                    <td className="whitespace-nowrap px-4 py-4"><p className="font-semibold text-slate-700 dark:text-slate-200">{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</p><p className="mt-1 text-xs text-slate-400">{booking.duration}</p></td>
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900 dark:text-slate-100">{money(booking.amount ?? 0)}</td>
                    <td className="min-w-48 px-4 py-4"><div className="flex justify-between gap-3 text-[11px]"><span className="font-bold text-emerald-600 dark:text-emerald-300">{money(totals.paid)}</span><span className="text-slate-400">{money(totals.outstanding)} left</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} /></div></td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full whitespace-nowrap px-2.5 py-1 text-[11px] font-bold ${invoiceStyle.cls}`}>{invoiceStyle.label}</span></td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full whitespace-nowrap px-2.5 py-1 text-[11px] font-bold ${statusClass}`}>{statusText}</span></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-3 whitespace-nowrap"><InvoiceManagerModal booking={booking as Booking} invoices={invoices} locationName={booking.locations?.name} clientEmail={client.email} /><EditBookingModal booking={booking as Booking} location={(booking.locations ?? { id: booking.location_id, name: "—", size: "—", city: "—" }) as Pick<Location, "id" | "name" | "size" | "city">} clients={allClients} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
