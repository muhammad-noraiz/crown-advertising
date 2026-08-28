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
import type { LocationWithBookings, Booking, LocationExpense, LocationPartner, LocationImage, LocationDocument } from "@/lib/supabase/types";
import { AddBookingModal } from "@/app/dashboard/bookings/AddBookingModal";
import { EditLocationModal } from "@/app/dashboard/locations/EditLocationModal";
import { EditBookingModal } from "@/app/dashboard/bookings/EditBookingModal";
import { InvoiceManagerModal } from "@/app/dashboard/bookings/InvoiceManagerModal";
import { LocationImagesTab } from "./LocationImagesTab";
import { LocationDocumentsTab } from "./LocationDocumentsTab";
import { locationCategoryLabels } from "@/lib/location-showcase-types";
import { getBookingInvoiceStatus, getInvoiceTotals } from "@/lib/invoices";
import { ManagementMetric, ManagementPageHero } from "@/app/dashboard/components/ManagementPage";

const invoiceStatusLabel: Record<string, { label: string; cls: string }> = {
  NOT_SETUP: { label: "Not set up", cls: "bg-slate-100 text-slate-600" },
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  PARTIAL: { label: "Part paid", cls: "bg-blue-100 text-blue-700" },
  PAID: { label: "Paid", cls: "bg-emerald-100 text-emerald-700" },
  OVERDUE: { label: "Overdue", cls: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-500" },
};

const bookingStatusLabel: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-700" },
  expiring: { label: "Expiring Soon", cls: "bg-amber-100 text-amber-700" },
  expired: { label: "Expired", cls: "bg-red-100 text-red-700" },
};

const expenseTypeLabel: Record<string, string> = {
  rent: "RENT",
  tax: "TAX",
  electricity_bills_lights_charges: "Electricity Bills / Lights Charges",
  pr_commission: "PR Commission",
  noc_fees: "NOC Fees",
  labour_installation_cost: "Labour / Installation Cost",
  installation: "Labour / Installation Cost",
  land_rent: "RENT",
};

const landTypeLabel: Record<string, { label: string; cls: string }> = {
  crown: { label: "Company Owned", cls: "bg-slate-100 text-slate-600" },
  private: { label: "Private Land", cls: "bg-blue-100 text-blue-700" },
  government: { label: "Govt. Land", cls: "bg-purple-100 text-purple-700" },
};

function formatLocationPrice(location: LocationWithBookings) {
  if (location.price_label) return location.price_label;
  if (location.price_per_month === null) return "Price on request";

  const amount = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(location.price_per_month);
  if (location.pricing_basis === "slot") return `PKR ${amount} / slot`;
  if (location.pricing_basis === "on_request") return `PKR ${amount}`;
  return `PKR ${amount} / month`;
}

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
  const [{ data: location }, { data: allLocations }, { data: expensesData }, { data: partnersData }, { data: clientsData }, { data: imagesData }, { data: documentsData }] =
    await Promise.all([
      supabase.from("locations").select("*, bookings(*, booking_invoices(*))").eq("id", Number(id)).single(),
      supabase.from("locations").select("id, name, size, city").eq("is_active", true).order("name"),
      supabase.from("location_expenses").select("*").eq("location_id", Number(id)).order("expense_date", { ascending: false }),
      supabase.from("location_partners").select("*").eq("location_id", Number(id)).order("partner_name"),
      supabase.from("clients").select("id, name, email").order("name"),
      supabase.from("location_images").select("*").eq("location_id", Number(id)).order("created_at", { ascending: false }),
      supabase.from("location_documents").select("*").eq("location_id", Number(id)).order("created_at", { ascending: false }),
    ]);

  if (!location) notFound();

  const loc = location as LocationWithBookings;
  const locations = (allLocations ?? []) as { id: number; name: string; size: string; city: string }[];
  const expenses = (expensesData ?? []) as LocationExpense[];
  const partners = (partnersData ?? []) as LocationPartner[];
  const clients = (clientsData ?? []) as { id: number; name: string; email: string | null }[];
  const clientEmailById = new Map(clients.map((client) => [client.id, client.email]));
  const images = (imagesData ?? []) as LocationImage[];
  const documents = (documentsData ?? []) as LocationDocument[];

  // The documents bucket is private, so each row needs a short-lived signed URL.
  // Only worth minting them when that tab is the one being rendered.
  let documentUrls: Record<string, string> = {};
  if (tab === "documents" && documents.length > 0) {
    const { data: signed } = await supabase.storage
      .from("location-documents")
      .createSignedUrls(documents.map((doc) => doc.storage_path), 60 * 60);
    documentUrls = Object.fromEntries(
      (signed ?? []).flatMap((entry) => (entry.path && entry.signedUrl ? [[entry.path, entry.signedUrl] as [string, string]] : []))
    );
  }

  const now = new Date();
  const activeBooking = loc.bookings.find((b) => new Date(b.start_date) <= now && new Date(b.end_date) >= now);
  const totalPartnersPercent = partners.reduce((s, p) => s + p.percentage, 0);
  const crownPercent = Math.max(0, 100 - totalPartnersPercent);
  const llt = landTypeLabel[loc.land_type ?? "crown"];
  const tabBase = `/dashboard/locations/${id}`;
  const totalBookingValue = loc.bookings.reduce((sum, booking) => sum + (booking.amount ?? 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const locationInvoiceTotals = getInvoiceTotals(loc.bookings.flatMap((booking) => booking.booking_invoices ?? []));

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 pb-10">
      <ManagementPageHero
        eyebrow="Location workspace"
        title={loc.name}
        description={`${loc.size} · ${loc.city}${loc.address ? ` · ${loc.address}` : ""}`}
        icon="detail"
        actions={<>
          <AddBookingModal locations={locations} clients={clients} defaultLocationId={loc.id} buttonClassName="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-300" />
          <EditLocationModal location={loc} />
          <DeleteLocationButton id={loc.id} />
        </>}
        meta={<>
          <Link href="/dashboard/locations" className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-amber-300/30 hover:text-amber-200">← Inventory directory</Link>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[11px] font-semibold text-amber-200">{formatLocationPrice(loc)}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-slate-300">{llt.label}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-slate-300">{locationCategoryLabels[loc.media_category]}</span>
          {loc.facing_from && <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-slate-300">From {loc.facing_from}</span>}
          {loc.facing_towards && <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-slate-300">Towards {loc.facing_towards}</span>}
        </>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagementMetric label="Current status" value={activeBooking ? "Occupied" : "Available"} detail={activeBooking ? `Booked by ${activeBooking.client_name}` : "Ready for a new campaign"} tone={activeBooking ? "red" : "emerald"} icon="location" />
        <ManagementMetric label="Booked value" value={`PKR ${Math.round(totalBookingValue).toLocaleString("en-PK")}`} detail={`${loc.bookings.length} lifetime booking${loc.bookings.length === 1 ? "" : "s"}`} tone="blue" icon="booking" />
        <ManagementMetric label="Outstanding" value={`PKR ${Math.round(locationInvoiceTotals.outstanding).toLocaleString("en-PK")}`} detail="Open invoice balance at this site" tone={locationInvoiceTotals.outstanding > 0 ? "red" : "slate"} icon="client" />
        <ManagementMetric label="Recorded expenses" value={`PKR ${Math.round(totalExpenses).toLocaleString("en-PK")}`} detail={`${expenses.length} expense entr${expenses.length === 1 ? "y" : "ies"}`} tone="amber" icon="detail" />
      </section>

      {/* Active booking banner */}
      {activeBooking && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-amber-400/20 dark:bg-amber-400/5">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Currently Booked</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{activeBooking.client_name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {formatDate(activeBooking.start_date)} → {formatDate(activeBooking.end_date)} ({activeBooking.duration})
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bookingStatusLabel[bookingStatus(activeBooking.end_date)].cls}`}>
            {bookingStatusLabel[bookingStatus(activeBooking.end_date)].label}
          </span>
        </div>
      )}

      {/* Tab nav */}
      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-700" aria-label="Location sections">
        {[
          { key: "bookings", label: `Bookings (${loc.bookings.length})` },
          { key: "expenses", label: `Expenses (${expenses.length})` },
          { key: "partners", label: `Partners (${partners.length})` },
          { key: "images", label: `Images (${images.length})` },
          { key: "documents", label: `Legal Documents (${documents.length})` },
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`${tabBase}?tab=${key}`}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === key
                ? "bg-slate-900 text-white shadow-sm dark:bg-amber-400 dark:text-slate-950"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* ── Bookings tab ── */}
      {tab === "bookings" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_-38px_rgba(15,23,42,.75)] dark:border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
            <h2 className="font-bold text-slate-950 dark:text-slate-50">Booking History</h2>
            <span className="text-sm text-slate-400">{loc.bookings.length} bookings</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
                  {["Starting Date", "Duration", "Ending Date", "Display (Client)", "Amount (PKR)", "Sale", "Vendor", "Locking Ref.", "Payment", "Status", "Remarks", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loc.bookings.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-8 text-center text-slate-400">
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
                      const invoices = b.booking_invoices ?? [];
                      const invoiceState = getBookingInvoiceStatus(invoices);
                      const invoiceTotals = getInvoiceTotals(invoices);
                      const isl = invoiceStatusLabel[invoiceState] ?? invoiceStatusLabel.PENDING;
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
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isl.cls}`}>{isl.label}</span>
                            <p className="mt-1 text-[10px] text-slate-400">PKR {Math.round(invoiceTotals.outstanding).toLocaleString()} due</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bsl.cls}`}>{bsl.label}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs max-w-32 truncate">{b.remarks ?? "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <InvoiceManagerModal booking={b as Booking} invoices={invoices} locationName={loc.name} clientEmail={b.client_id ? clientEmailById.get(b.client_id) : null} />
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
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
                    {["Type", "Amount (PKR)", "Date", "Recurring", "Description", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
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
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700">
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

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
                    {["Partner", "Phone", "Email", "Ownership %", "Notes", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
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

      {/* Legal documents tab */}
      {tab === "documents" && (
        <LocationDocumentsTab locationId={loc.id} documents={documents} urls={documentUrls} />
      )}
    </div>
  );
}
