import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, bookingStatus } from "@/lib/utils";
import type { Client, Booking, Location } from "@/lib/supabase/types";
import { EditClientModal } from "@/app/dashboard/clients/EditClientModal";
import { DeleteClientButton } from "@/app/dashboard/clients/DeleteClientButton";
import { EditBookingModal } from "@/app/dashboard/bookings/EditBookingModal";

const invoiceStatusLabel: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Paid", cls: "bg-green-100 text-green-700" },
  OVERDUE: { label: "Overdue", cls: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-500" },
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: clientData }, { data: bookingsData }, { data: clientsData }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", Number(id)).single(),
    supabase
      .from("bookings")
      .select("*, locations(id, name, size, city)")
      .eq("client_id", Number(id))
      .order("start_date", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  if (!clientData) notFound();

  const client = clientData as Client;
  const bookings = (bookingsData ?? []) as (Booking & {
    locations: Pick<Location, "id" | "name" | "size" | "city"> | null;
  })[];
  const allClients = (clientsData ?? []) as { id: number; name: string }[];

  const now = new Date();
  const activeBookings = bookings.filter((b) => new Date(b.end_date) >= now);
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard/clients" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
              ← Clients
            </Link>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
          {client.company && <p className="text-slate-500 text-sm mt-0.5">{client.company}</p>}
        </div>
        <div className="flex gap-2">
          <EditClientModal client={client} />
          <DeleteClientButton id={client.id} />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Bookings", value: bookings.length },
          { label: "Active Now", value: activeBookings.length },
          { label: "Total Revenue (PKR)", value: totalRevenue.toLocaleString() },
          { label: "Phone", value: client.phone ?? "—" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-lg font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Contact details */}
      {(client.email || client.address || client.notes) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {client.email && (
            <div><p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Email</p><p className="text-slate-700">{client.email}</p></div>
          )}
          {client.address && (
            <div><p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Address</p><p className="text-slate-700">{client.address}</p></div>
          )}
          {client.notes && (
            <div><p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Notes</p><p className="text-slate-600">{client.notes}</p></div>
          )}
        </div>
      )}

      {/* Bookings table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Booking History</h2>
          <span className="text-sm text-slate-400">{bookings.length} bookings</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Location", "Start", "End", "Duration", "Amount (PKR)", "Invoice", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-400">No bookings yet.</td></tr>
              ) : (
                bookings.map((b) => {
                  const bs = bookingStatus(b.end_date);
                  const bsCls = bs === "active" ? "bg-green-100 text-green-700" : bs === "expiring" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                  const bsLabel = bs === "active" ? "Active" : bs === "expiring" ? "Expiring Soon" : "Expired";
                  const isl = invoiceStatusLabel[b.invoice_status] ?? invoiceStatusLabel.PENDING;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {b.locations ? (
                          <Link href={`/dashboard/locations/${b.location_id}`} className="hover:text-amber-600">
                            {b.locations.name}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(b.start_date)}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(b.end_date)}</td>
                      <td className="px-4 py-3 text-slate-500">{b.duration}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{(b.amount ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isl.cls}`}>{isl.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bsCls}`}>{bsLabel}</span>
                      </td>
                      <td className="px-4 py-3">
                        <EditBookingModal
                          booking={b as Booking}
                          location={(b.locations ?? { id: b.location_id, name: "—", size: "—", city: "—" }) as Pick<Location, "id" | "name" | "size" | "city">}
                          clients={allClients}
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
    </div>
  );
}
