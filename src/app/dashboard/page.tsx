import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingInvoice, InvoicePayment, Location } from "@/lib/supabase/types";
import { formatDate, bookingStatus } from "@/lib/utils";
import { AddLocationModal } from "./locations/AddLocationModal";
import { AddBookingModal } from "./bookings/AddBookingModal";
import { getCurrentAccess } from "@/lib/auth/access";
import { canAccess } from "@/lib/permissions";

type DashboardBooking = Booking & {
  locations: Pick<Location, "id" | "name" | "size" | "city"> | null;
};

interface TrendPoint {
  key: string;
  label: string;
  sales: number;
  collected: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * DAY_MS);
}

function money(value: number): string {
  return `PKR ${Math.round(value).toLocaleString("en-PK")}`;
}

function compactMoney(value: number): string {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (absolute >= 1_000_000) return `${sign}PKR ${(absolute / 1_000_000).toFixed(absolute >= 10_000_000 ? 0 : 1)}m`;
  if (absolute >= 100_000) return `${sign}PKR ${(absolute / 1_000).toFixed(0)}k`;
  return money(value);
}

function shortNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}m`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

function buildTrend(
  bookings: DashboardBooking[],
  payments: InvoicePayment[],
  invoices: BookingInvoice[],
  paymentHistoryAvailable: boolean,
  now: Date
): TrendPoint[] {
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const points = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 5 + index, 1));
    return {
      key: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString("en-PK", { month: "short", timeZone: "UTC" }),
      sales: 0,
      collected: 0,
    };
  });
  const pointByKey = new Map(points.map((point) => [point.key, point]));

  for (const booking of bookings) {
    const point = pointByKey.get(booking.created_at.slice(0, 7));
    if (point) point.sales += booking.amount;
  }

  if (paymentHistoryAvailable) {
    for (const payment of payments) {
      const point = pointByKey.get(payment.payment_date.slice(0, 7));
      if (point) point.collected += payment.amount;
    }
  } else {
    for (const invoice of invoices) {
      if (!invoice.last_payment_date || invoice.paid_amount <= 0) continue;
      const point = pointByKey.get(invoice.last_payment_date.slice(0, 7));
      if (point) point.collected += invoice.paid_amount;
    }
  }

  return points;
}

function MetricIcon({ type }: { type: "location" | "booking" | "occupancy" | "payment" }) {
  const paths = {
    location: <><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></>,
    booking: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6" /></>,
    occupancy: <><path d="M4 19V9l8-5 8 5v10" /><path d="M8 19v-6h8v6M2 19h20" /></>,
    payment: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="m4 16 5-5 4 4 7-8M15 7h5v5" />
    </svg>
  );
}

function RevenueTrendChart({ data }: { data: TrendPoint[] }) {
  const width = 760;
  const height = 250;
  const left = 52;
  const right = 18;
  const top = 18;
  const bottom = 38;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const columnWidth = plotWidth / data.length;
  const maxValue = Math.max(1, ...data.flatMap((point) => [point.sales, point.collected]));
  const yFor = (value: number) => top + plotHeight - (value / maxValue) * plotHeight;
  const collectedPoints = data.map((point, index) => `${left + columnWidth * index + columnWidth / 2},${yFor(point.collected)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Six month booked sales and cash collections chart">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = top + plotHeight - ratio * plotHeight;
        return (
          <g key={ratio}>
            <line x1={left} x2={width - right} y1={y} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="4 6" />
            <text x={left - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] dark:fill-slate-500">{shortNumber(maxValue * ratio)}</text>
          </g>
        );
      })}

      {data.map((point, index) => {
        const centerX = left + columnWidth * index + columnWidth / 2;
        const barWidth = Math.min(44, columnWidth * 0.42);
        const salesY = yFor(point.sales);
        return (
          <g key={point.key}>
            <rect
              x={centerX - barWidth / 2}
              y={salesY}
              width={barWidth}
              height={Math.max(0, top + plotHeight - salesY)}
              rx="7"
              className="fill-amber-300/80"
            />
            <text x={centerX} y={height - 12} textAnchor="middle" className="fill-slate-500 text-[11px] font-semibold dark:fill-slate-400">{point.label}</text>
          </g>
        );
      })}

      <polyline points={collectedPoints} fill="none" className="stroke-emerald-500" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((point, index) => {
        const centerX = left + columnWidth * index + columnWidth / 2;
        return <circle key={point.key} cx={centerX} cy={yFor(point.collected)} r="4.5" className="fill-white stroke-emerald-500 dark:fill-slate-900" strokeWidth="3" />;
      })}
    </svg>
  );
}

function OccupancyDonut({ occupied, total }: { occupied: number; total: number }) {
  const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div className="relative mx-auto h-40 w-40">
      <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" role="img" aria-label={`${percentage}% of locations occupied`}>
        <circle cx="21" cy="21" r="15.915" fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="4" />
        <circle cx="21" cy="21" r="15.915" fill="none" className="stroke-amber-400" strokeWidth="4" strokeDasharray={`${percentage} ${100 - percentage}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{percentage}%</p>
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Occupied</p>
      </div>
    </div>
  );
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-700" },
  expiring: { label: "Expiring Soon", cls: "bg-amber-100 text-amber-700" },
  expired: { label: "Expired", cls: "bg-red-100 text-red-700" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const access = await getCurrentAccess();
  const now = new Date();
  const today = dateOnly(now);
  const sevenDaysFromNow = dateOnly(addDays(now, 7));

  const [locationsResult, clientsResult, bookingsResult, invoicesResult, paymentsResult] = await Promise.all([
    supabase.from("locations").select("id, name, size, city").eq("is_active", true).order("name"),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("bookings").select("*, locations(id, name, size, city)").order("created_at", { ascending: false }),
    supabase.from("booking_invoices").select("*").neq("status", "CANCELLED"),
    supabase.from("invoice_payments").select("*").order("payment_date", { ascending: false }),
  ]);

  const locations = (locationsResult.data ?? []) as { id: number; name: string; size: string; city: string }[];
  const clients = (clientsResult.data ?? []) as { id: number; name: string }[];
  const bookings = (bookingsResult.data ?? []) as DashboardBooking[];
  const invoices = (invoicesResult.data ?? []) as BookingInvoice[];
  const payments = paymentsResult.error ? [] : ((paymentsResult.data ?? []) as InvoicePayment[]);
  const paymentHistoryAvailable = !paymentsResult.error;

  const liveBookings = bookings.filter((booking) => booking.start_date <= today && booking.end_date >= today);
  const occupiedLocationIds = new Set(liveBookings.map((booking) => booking.location_id));
  const availableLocations = Math.max(0, locations.length - occupiedLocationIds.size);
  const occupancyRate = locations.length > 0 ? Math.round((occupiedLocationIds.size / locations.length) * 100) : 0;
  const expiringSoon = liveBookings.filter((booking) => booking.end_date <= sevenDaysFromNow).length;
  const totalInvoiced = invoices.reduce((total, invoice) => total + invoice.amount, 0);
  const totalReceived = invoices.reduce((total, invoice) => total + Math.min(invoice.amount, invoice.paid_amount), 0);
  const totalOutstanding = invoices.reduce((total, invoice) => total + Math.max(0, invoice.amount - invoice.paid_amount), 0);
  const overdueOutstanding = invoices.reduce(
    (total, invoice) => total + (invoice.due_date < today ? Math.max(0, invoice.amount - invoice.paid_amount) : 0),
    0
  );
  const overdueInvoiceCount = invoices.filter((invoice) => invoice.due_date < today && invoice.amount > invoice.paid_amount).length;
  const collectionRate = totalInvoiced > 0 ? Math.round((totalReceived / totalInvoiced) * 100) : 0;
  const trend = buildTrend(bookings, payments, invoices, paymentHistoryAvailable, now);
  const sixMonthSales = trend.reduce((total, point) => total + point.sales, 0);
  const sixMonthCollections = trend.reduce((total, point) => total + point.collected, 0);

  const futureBookings = bookings.filter((booking) => booking.end_date >= today);
  const expiryBuckets = [
    { label: "Next 7 Days", count: futureBookings.filter((booking) => booking.end_date <= sevenDaysFromNow).length, color: "bg-red-400" },
    { label: "8–30 Days", count: futureBookings.filter((booking) => booking.end_date > sevenDaysFromNow && booking.end_date <= dateOnly(addDays(now, 30))).length, color: "bg-amber-400" },
    { label: "31–60 Days", count: futureBookings.filter((booking) => booking.end_date > dateOnly(addDays(now, 30)) && booking.end_date <= dateOnly(addDays(now, 60))).length, color: "bg-blue-400" },
    { label: "60+ Days", count: futureBookings.filter((booking) => booking.end_date > dateOnly(addDays(now, 60))).length, color: "bg-emerald-400" },
  ];
  const expiryMax = Math.max(1, ...expiryBuckets.map((bucket) => bucket.count));
  const recentBookings = bookings.slice(0, 7);

  const stats = [
    {
      label: "Total Locations",
      value: String(locations.length),
      detail: `${availableLocations} currently available`,
      icon: "location" as const,
      iconClass: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
      accent: "bg-blue-500",
    },
    {
      label: "Live Bookings",
      value: String(liveBookings.length),
      detail: expiringSoon > 0 ? `${expiringSoon} ending within 7 days` : "No urgent expiries",
      icon: "booking" as const,
      iconClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      accent: "bg-emerald-500",
    },
    {
      label: "Occupancy Rate",
      value: `${occupancyRate}%`,
      detail: `${occupiedLocationIds.size} of ${locations.length} locations occupied`,
      icon: "occupancy" as const,
      iconClass: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      accent: "bg-amber-400",
    },
    {
      label: "Outstanding",
      value: compactMoney(totalOutstanding),
      detail: overdueInvoiceCount > 0 ? `${overdueInvoiceCount} overdue invoice${overdueInvoiceCount === 1 ? "" : "s"}` : "Nothing overdue",
      icon: "payment" as const,
      iconClass: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
      accent: totalOutstanding > 0 ? "bg-red-400" : "bg-slate-300",
    },
  ];

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1323] p-6 text-white shadow-[0_24px_70px_-38px_rgba(15,23,42,.9)] lg:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.9)]" /> Live Operations
            </div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Business Overview</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              A live view of inventory, campaigns, collections and the bookings that need attention.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-slate-300">As of {now.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span className={`rounded-full border px-3 py-1.5 ${overdueInvoiceCount > 0 ? "border-red-300/20 bg-red-300/10 text-red-200" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"}`}>
                {overdueInvoiceCount > 0 ? `${overdueInvoiceCount} payment${overdueInvoiceCount === 1 ? "" : "s"} need attention` : "Collections are on track"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {access && canAccess(access, "locations") && <AddLocationModal />}
            {access && canAccess(access, "bookings") && (
              <AddBookingModal
                locations={locations}
                clients={clients}
                buttonClassName="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_10px_28px_-14px_rgba(251,191,36,.9)] transition hover:-translate-y-0.5 hover:bg-amber-300"
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_-30px_rgba(15,23,42,.8)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-30px_rgba(15,23,42,.8)]">
            <span className={`absolute inset-x-0 top-0 h-1 ${stat.accent}`} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{stat.label}</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50 2xl:text-[28px]">{stat.value}</p>
              </div>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${stat.iconClass}`}><MetricIcon type={stat.icon} /></span>
            </div>
            <p className="mt-3 text-xs text-slate-500">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.65fr_.85fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900"><TrendIcon /><h2 className="text-lg font-bold tracking-tight">Sales & Collections</h2></div>
              <p className="mt-1 text-xs text-slate-500">Six-month movement of new contract value and cash received.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span><b className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-amber-300" />Booked Sales</span>
              <span><b className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />Cash Collected</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">6-Month Sales</p>
              <p className="mt-1 text-lg font-bold text-slate-950 dark:text-slate-50">{compactMoney(sixMonthSales)}</p>
            </div>
            <div className="border-l border-slate-100 pl-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">6-Month Collections</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">{compactMoney(sixMonthCollections)}</p>
            </div>
          </div>
          <div className="mt-5"><RevenueTrendChart data={trend} /></div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Inventory Health</h2>
            <p className="mt-1 text-xs text-slate-500">Live utilization across active advertising locations.</p>
          </div>
          <div className="mt-6"><OccupancyDonut occupied={occupiedLocationIds.size} total={locations.length} /></div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-500/10">
              <p className="text-2xl font-bold text-amber-700">{occupiedLocationIds.size}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Occupied</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-2xl font-bold text-slate-900">{availableLocations}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Available</p>
            </div>
          </div>
          <Link href="/dashboard/locations" className="mt-5 inline-flex text-xs font-bold text-amber-700 hover:text-amber-600">Review all locations →</Link>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Booking Expiry Pipeline</h2>
              <p className="mt-1 text-xs text-slate-500">Future booking endings grouped by urgency.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{futureBookings.length} Open</span>
          </div>
          <div className="mt-7 space-y-5">
            {expiryBuckets.map((bucket) => (
              <div key={bucket.label} className="grid grid-cols-[90px_1fr_28px] items-center gap-3">
                <p className="text-xs font-semibold text-slate-600">{bucket.label}</p>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${bucket.color}`} style={{ width: `${bucket.count === 0 ? 0 : Math.max(8, (bucket.count / expiryMax) * 100)}%` }} />
                </div>
                <p className="text-right text-sm font-bold text-slate-900">{bucket.count}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="text-xs font-semibold text-amber-700">{expiringSoon > 0 ? `${expiringSoon} live booking${expiringSoon === 1 ? "" : "s"} should be renewed or released this week.` : "No live bookings expire in the next seven days."}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Collection Health</h2>
              <p className="mt-1 text-xs text-slate-500">Paid versus outstanding value across active invoices.</p>
            </div>
            <Link href="/dashboard/accounts" className="text-xs font-bold text-amber-700 hover:text-amber-600">Open accounts →</Link>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{collectionRate}%</p>
              <p className="mt-1 text-xs font-medium text-slate-500">of invoiced value collected</p>
            </div>
            <p className="text-right text-xs text-slate-500">Total invoiced<br /><b className="mt-1 inline-block text-sm text-slate-900">{compactMoney(totalInvoiced)}</b></p>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-red-100 dark:bg-red-500/15">
            <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-700" style={{ width: `${collectionRate}%` }} />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Received</p>
              <p className="mt-2 text-sm font-bold text-emerald-700">{compactMoney(totalReceived)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{compactMoney(totalOutstanding)}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 dark:bg-red-500/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue</p>
              <p className="mt-2 text-sm font-bold text-red-700">{compactMoney(overdueOutstanding)}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 lg:px-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Recent Bookings</h2>
            <p className="mt-0.5 text-xs text-slate-500">The latest contracts added to the system.</p>
          </div>
          <Link href="/dashboard/bookings" className="text-xs font-bold text-amber-700 hover:text-amber-600">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Location', 'Client', 'Contract Value', 'Start', 'End', 'Status'].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 first:pl-6">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No bookings yet.
                    {access && canAccess(access, "bookings") && (
                      <> {' '}<AddBookingModal locations={locations} clients={clients} buttonClassName="text-sm font-bold text-amber-600 hover:underline" buttonLabel="Add the first one →" /></>
                    )}
                  </td>
                </tr>
              ) : recentBookings.map((booking) => {
                const status = bookingStatus(booking.end_date);
                const statusDisplay = statusLabel[status];
                return (
                  <tr key={booking.id} className="transition hover:bg-slate-50">
                    <td className="max-w-60 truncate px-5 py-4 pl-6 font-semibold text-slate-900">
                      <Link href={`/dashboard/locations/${booking.location_id}`} className="hover:text-amber-700">{booking.locations?.name ?? 'Unknown location'}</Link>
                      <p className="mt-0.5 text-[10px] font-normal uppercase tracking-wide text-slate-400">{booking.locations?.city ?? '—'}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-600">{booking.client_name}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{money(booking.amount)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(booking.start_date)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(booking.end_date)}</td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusDisplay.cls}`}>{statusDisplay.label}</span></td>
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
