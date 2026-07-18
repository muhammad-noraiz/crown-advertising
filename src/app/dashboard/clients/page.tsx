import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingInvoice, Client } from "@/lib/supabase/types";
import { AddClientModal } from "./AddClientModal";
import { EditClientModal } from "./EditClientModal";
import { DeleteClientButton } from "./DeleteClientButton";
import { Pagination } from "@/app/dashboard/components/Pagination";
import { SearchBox } from "@/app/dashboard/components/SearchBox";
import { ManagementMetric, ManagementPageHero } from "@/app/dashboard/components/ManagementPage";

const PAGE_SIZE = 20;
const CLIENT_SEARCH_COLUMNS = ["name", "company", "phone", "email", "address", "notes"];

function searchFilter(columns: string[], query: string) {
  const value = query.replace(/[%(),]/g, " ").trim().replace(/\s+/g, "%");
  if (!value) return null;
  return columns.map((column) => `${column}.ilike.%${value}%`).join(",");
}

function money(value: number) {
  return `PKR ${Math.round(value).toLocaleString("en-PK")}`;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

type ClientBooking = Pick<Booking, "id" | "client_id" | "amount" | "start_date" | "end_date">;
type ClientInvoice = Pick<BookingInvoice, "booking_id" | "amount" | "paid_amount" | "status">;

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { page: pageStr, q: rawQuery } = await searchParams;
  const q = rawQuery?.trim() ?? "";
  const filter = searchFilter(CLIENT_SEARCH_COLUMNS, q);
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();

  const clientsRequest = supabase.from("clients").select("*", { count: "exact" }).order("name");
  if (filter) clientsRequest.or(filter);

  const [clientsResult, globalCountResult, bookingsResult, invoicesResult] = await Promise.all([
    clientsRequest.range(from, to),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id, client_id, amount, start_date, end_date"),
    supabase.from("booking_invoices").select("booking_id, amount, paid_amount, status").neq("status", "CANCELLED"),
  ]);

  const clients = (clientsResult.data ?? []) as Client[];
  const bookings = (bookingsResult.data ?? []) as ClientBooking[];
  const invoices = (invoicesResult.data ?? []) as ClientInvoice[];
  const total = clientsResult.count ?? 0;
  const totalClients = globalCountResult.count ?? total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
  const bookingsByClient = new Map<number, ClientBooking[]>();
  bookings.forEach((booking) => {
    if (!booking.client_id) return;
    const current = bookingsByClient.get(booking.client_id) ?? [];
    current.push(booking);
    bookingsByClient.set(booking.client_id, current);
  });
  const outstandingByClient = new Map<number, number>();
  invoices.forEach((invoice) => {
    const clientId = bookingById.get(invoice.booking_id)?.client_id;
    if (!clientId) return;
    outstandingByClient.set(clientId, (outstandingByClient.get(clientId) ?? 0) + Math.max(0, invoice.amount - invoice.paid_amount));
  });

  const activeClientIds = new Set(bookings.filter((booking) => booking.start_date <= today && booking.end_date >= today).map((booking) => booking.client_id).filter(Boolean));
  const totalContractValue = bookings.reduce((sum, booking) => sum + (booking.amount ?? 0), 0);
  const totalOutstanding = invoices.reduce((sum, invoice) => sum + Math.max(0, invoice.amount - invoice.paid_amount), 0);
  const queryError = clientsResult.error ?? globalCountResult.error ?? bookingsResult.error ?? invoicesResult.error;

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 pb-10">
      <ManagementPageHero
        eyebrow="Customer relationships"
        title="Clients"
        description="Keep every advertiser, campaign relationship and payment exposure connected in one clear customer directory."
        icon="client"
        actions={
          <AddClientModal buttonClassName="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_12px_30px_-15px_rgba(251,191,36,.95)] transition hover:-translate-y-0.5 hover:bg-amber-300" />
        }
        meta={<>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-slate-300">{totalClients} customer records</span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200">{activeClientIds.size} with live campaigns</span>
        </>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagementMetric label="Total clients" value={String(totalClients)} detail="Customer records in the system" tone="blue" icon="client" />
        <ManagementMetric label="Active clients" value={String(activeClientIds.size)} detail="Running a campaign today" tone="emerald" icon="booking" />
        <ManagementMetric label="Contract value" value={money(totalContractValue)} detail={`${bookings.length} booking${bookings.length === 1 ? "" : "s"} across all clients`} tone="amber" icon="detail" />
        <ManagementMetric label="Receivables" value={money(totalOutstanding)} detail="Open invoice balance" tone={totalOutstanding > 0 ? "red" : "slate"} icon="booking" />
      </section>

      <SearchBox basePath="/dashboard/clients" defaultValue={q} placeholder="Search by client, company, phone or email..." />

      {queryError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="font-semibold text-red-700 dark:text-red-300">Could not load the client directory.</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{queryError.message}</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_-38px_rgba(15,23,42,.75)] dark:border-slate-700">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
            <div><h2 className="font-bold text-slate-950 dark:text-slate-50">Client directory</h2><p className="mt-0.5 text-xs text-slate-500">Contact, campaign and collection context for every customer.</p></div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-300">{total} results</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
                  {["Client", "Contact", "Engagement", "Contract value", "Outstanding", "Actions"].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {clients.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center"><p className="font-semibold text-slate-700 dark:text-slate-200">{q ? "No clients match this search" : "No clients yet"}</p><p className="mt-1 text-sm text-slate-400">Try another search or create a customer record.</p><div className="mt-5"><AddClientModal /></div></td></tr>
                ) : clients.map((client) => {
                  const clientBookings = bookingsByClient.get(client.id) ?? [];
                  const active = clientBookings.filter((booking) => booking.start_date <= today && booking.end_date >= today).length;
                  const contractValue = clientBookings.reduce((sum, booking) => sum + (booking.amount ?? 0), 0);
                  const outstanding = outstandingByClient.get(client.id) ?? 0;
                  return (
                    <tr key={client.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                      <td className="px-5 py-4">
                        <div className="flex min-w-56 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-xs font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{initials(client.name)}</span>
                          <div className="min-w-0"><Link href={`/dashboard/clients/${client.id}`} className="font-bold text-slate-950 hover:text-amber-700 dark:text-slate-50 dark:hover:text-amber-300">{client.name}</Link><p className="mt-0.5 truncate text-xs text-slate-500">{client.company ?? "Independent advertiser"}</p></div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{client.phone ?? "No phone"}</p><p className="mt-1 text-xs text-slate-400">{client.email ?? "No email"}</p></td>
                      <td className="px-5 py-4"><p className="font-bold text-slate-900 dark:text-slate-100">{clientBookings.length} booking{clientBookings.length === 1 ? "" : "s"}</p><p className={`mt-1 text-xs font-semibold ${active > 0 ? "text-emerald-600 dark:text-emerald-300" : "text-slate-400"}`}>{active > 0 ? `${active} active now` : "No live campaign"}</p></td>
                      <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900 dark:text-slate-100">{money(contractValue)}</td>
                      <td className="whitespace-nowrap px-5 py-4"><span className={`font-bold ${outstanding > 0 ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>{money(outstanding)}</span></td>
                      <td className="px-5 py-4"><div className="flex items-center gap-3 whitespace-nowrap"><Link href={`/dashboard/clients/${client.id}`} className="text-xs font-bold text-amber-700 hover:text-amber-500 dark:text-amber-300">View profile</Link><EditClientModal client={client} /><DeleteClientButton id={client.id} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/dashboard/clients" query={{ q }} />
    </div>
  );
}
