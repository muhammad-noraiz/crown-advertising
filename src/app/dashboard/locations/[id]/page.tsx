import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, bookingStatus } from "@/lib/utils";
import { DeleteBookingButton } from "./DeleteBookingButton";
import { DeleteLocationButton } from "./DeleteLocationButton";
import { AddExpenseModal } from "./AddExpenseModal";
import { EditExpenseModal } from "./EditExpenseModal";
import { DeleteExpenseButton } from "./DeleteExpenseButton";
import { AddPartnerModal } from "./AddPartnerModal";
import { EditPartnerModal } from "./EditPartnerModal";
import { DeletePartnerButton } from "./DeletePartnerButton";
import type { LocationWithBookings, Booking, LocationExpense, LocationPartner, LocationImage } from "@/lib/supabase/types";
import { AddBookingModal } from "@/app/dashboard/bookings/AddBookingModal";
import { EditLocationModal } from "@/app/dashboard/locations/EditLocationModal";
import { EditBookingModal } from "@/app/dashboard/bookings/EditBookingModal";
import { LocationImagesTab } from "./LocationImagesTab";

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

const expenseTypeLabel: Record<string, string> = {
  installation: "Installation / Labour",
  land_rent: "Land Rent",
  tax: "Gov. Tax",
  maintenance: "Maintenance",
  other: "Other",
};

const landTypeLabel: Record<string, { label: string; cls: string }> = {
  crown: { label: "Company Owned", cls: "bg-slate-100 text-slate-600" },
  private: { label: "Private Land", cls: "bg-blue-100 text-blue-700" },
  government: { label: "Govt. Land", cls: "bg-purple-100 text-purple-700" },
};

export default async function LocationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab: rawTab }] = await Promise.all([params, searchParams]);
  const tab = rawTab ?? "bookings";

  const supabase = await createClient();
  const [{ data: location }, { data: allLocations }, { data: expensesData }, { data: partnersData }, { data: clientsData }, { data: imagesData }] =
    await Promise.all([
      supabase.from("locations").select("*, bookings(*)").eq("id", Number(id)).single(),
      supabase.from("locations").select("id, name, size, city").eq("is_active", true).order("name"),
      supabase.from("location_expenses").select("*").eq("location_id", Number(id)).order("expense_date", { ascending: false }),
      supabase.from("location_partners").select("*").eq("location_id", Number(id)).order("partner_name"),
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("location_images").select("*").eq("location_id", Number(id)).order("created_at", { ascending: false }),
    ]);

  if (!location) notFound();

  const loc = location as LocationWithBookings;
  const locations = (allLocations ?? []) as { id: number; name: string; size: string; city: string }[];
  const expenses = (expensesData ?? []) as LocationExpense[];
  const partners = (partnersData ?? []) as LocationPartner[];
  const clients = (clientsData ?? []) as { id: number; name: string }[];
  const images = (imagesData ?? []) as LocationImage[];
  const now = new Date();
  const activeBooking = loc.bookings.find((b) => new Date(b.end_date) >= now);
  const totalPartnersPercent = partners.reduce((s, p) => s + p.percentage, 0);
  const crownPercent = Math.max(0, 100 - totalPartnersPercent);
  const llt = landTypeLabel[loc.land_type ?? "crown"];
  const tabBase = `/dashboard/locations/${id}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard/locations" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
              ← Locations
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{loc.name}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${llt.cls}`}>
              {llt.label}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            {loc.size} · {loc.city}
            {loc.address && ` · ${loc.address}`}
          </p>
        </div>
        <div className="flex gap-2">
          <AddBookingModal locations={locations} clients={clients} defaultLocationId={loc.id} />
          <EditLocationModal location={loc} />
          <DeleteLocationButton id={loc.id} />
        </div>
      </div>

      {/* Active booking banner */}
      {activeBooking && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Currently Booked</p>
            <p className="font-semibold text-slate-900">{activeBooking.client_name}</p>
            <p className="text-sm text-slate-600">
              {formatDate(activeBooking.start_date)} → {formatDate(activeBooking.end_date)} ({activeBooking.duration})
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bookingStatusLabel[bookingStatus(activeBooking.end_date)].cls}`}>
            {bookingStatusLabel[bookingStatus(activeBooking.end_date)].label}
          </span>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {[
          { key: "bookings", label: `Bookings (${loc.bookings.length})` },
          { key: "expenses", label: `Expenses (${expenses.length})` },
          { key: "partners", label: `Partners (${partners.length})` },
          { key: "images", label: `Images (${images.length})` },
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`${tabBase}?tab=${key}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* ── Bookings tab ── */}
      {tab === "bookings" && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Booking History</h2>
            <span className="text-sm text-slate-400">{loc.bookings.length} bookings</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Starting Date", "Duration", "Ending Date", "Display (Client)", "Amount (PKR)", "Sale", "Vendor", "Locking Ref.", "Invoice No.", "Invoice", "Status", "Remarks", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loc.bookings.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-8 text-center text-slate-400">
                      No bookings yet. <AddBookingModal locations={locations} clients={clients} defaultLocationId={loc.id} />
                    </td>
                  </tr>
                ) : (
                  loc.bookings
                    .slice()
                    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                    .map((b) => {
                      const bs = bookingStatus(b.end_date);
                      const bsl = bookingStatusLabel[bs];
                      const isl = invoiceStatusLabel[b.invoice_status] ?? invoiceStatusLabel.PENDING;
                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(b.start_date)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600">{b.duration}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(b.end_date)}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{b.client_name}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{(b.amount ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-500">{b.sale_person ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-500">{b.vendor ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{b.locking_ref ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{b.invoice_no ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isl.cls}`}>{isl.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bsl.cls}`}>{bsl.label}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs max-w-32 truncate">{b.remarks ?? "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <EditBookingModal booking={b as Booking} location={loc} clients={clients} />
                              <DeleteBookingButton id={b.id} locationId={loc.id} />
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
      )}

      {/* ── Expenses tab ── */}
      {tab === "expenses" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              {expenses.filter((e) => e.is_recurring).length} recurring ·{" "}
              {expenses.filter((e) => !e.is_recurring).length} one-time
            </p>
            <AddExpenseModal locationId={loc.id} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Type", "Amount (PKR)", "Date", "Recurring", "Description", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No expenses recorded yet.</td></tr>
                  ) : (
                    expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-800">{expenseTypeLabel[e.expense_type] ?? e.expense_type}</td>
                        <td className="px-5 py-3 text-slate-800">{e.amount.toLocaleString()}</td>
                        <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{e.expense_date}</td>
                        <td className="px-5 py-3">
                          {e.is_recurring
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Monthly</span>
                            : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">One-time</span>
                          }
                        </td>
                        <td className="px-5 py-3 text-slate-500 max-w-48 truncate">{e.description ?? "—"}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <EditExpenseModal expense={e} locationId={loc.id} />
                            <DeleteExpenseButton id={e.id} locationId={loc.id} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Partners tab ── */}
      {tab === "partners" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              Partners hold <span className="font-semibold text-slate-800">{totalPartnersPercent.toFixed(1)}%</span> · Crown retains{" "}
              <span className="font-semibold text-amber-600">{crownPercent.toFixed(1)}%</span>
            </p>
            <AddPartnerModal locationId={loc.id} />
          </div>

          {partners.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Ownership Split</p>
              <div className="flex h-4 rounded-full overflow-hidden gap-px">
                {partners.map((p, i) => {
                  const colors = ["bg-blue-400", "bg-purple-400", "bg-pink-400", "bg-teal-400", "bg-orange-400"];
                  return (
                    <div key={p.id} className={`${colors[i % colors.length]}`} style={{ width: `${p.percentage}%` }} title={`${p.partner_name}: ${p.percentage}%`} />
                  );
                })}
                <div className="bg-amber-400 flex-1" title={`Crown: ${crownPercent.toFixed(1)}%`} />
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                {partners.map((p, i) => {
                  const dotColors = ["bg-blue-400","bg-purple-400","bg-pink-400","bg-teal-400","bg-orange-400"];
                  const txtColors = ["text-blue-600","text-purple-600","text-pink-600","text-teal-600","text-orange-600"];
                  return (
                    <div key={p.id} className="flex items-center gap-1.5 text-xs">
                      <div className={`w-2.5 h-2.5 rounded-full ${dotColors[i % 5]}`} />
                      <span className={`font-medium ${txtColors[i % 5]}`}>{p.partner_name}</span>
                      <span className="text-slate-400">{p.percentage}%</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="font-medium text-amber-600">Crown</span>
                  <span className="text-slate-400">{crownPercent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Partner", "Phone", "Email", "Ownership %", "Notes", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {partners.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No partners for this location.</td></tr>
                  ) : (
                    partners.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-900">{p.partner_name}</td>
                        <td className="px-5 py-3 text-slate-500">{p.phone ?? "—"}</td>
                        <td className="px-5 py-3 text-slate-500">{p.email ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-amber-50 text-amber-700">{p.percentage}%</span>
                        </td>
                        <td className="px-5 py-3 text-slate-500 max-w-48 truncate">{p.notes ?? "—"}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <EditPartnerModal partner={p} locationId={loc.id} />
                            <DeletePartnerButton id={p.id} locationId={loc.id} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Images tab */}
      {tab === "images" && (
        <LocationImagesTab locationId={loc.id} images={images} />
      )}
    </div>
  );
}
