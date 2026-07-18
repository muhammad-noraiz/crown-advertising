import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Booking,
  BookingInvoice,
  InvoicePayment,
  Location,
  LocationExpense,
  LocationPartner,
} from "@/lib/supabase/types";

export type ComparisonMode = "previous" | "year" | "none";

export interface DateRange {
  from: string;
  to: string;
}

export interface PeriodMetrics {
  bookedSales: number;
  invoicedSales: number;
  cashReceived: number;
  expenses: number;
  netCash: number;
  crownNet: number;
  outstanding: number;
  bookingCount: number;
  invoiceCount: number;
  expenseCount: number;
  activeBookings: number;
}

export interface EffectiveExpense {
  expense: LocationExpense;
  occurrenceDate: string;
}

export interface LocationPerformance {
  location: Location;
  activeBookings: number;
  bookedSales: number;
  invoicedSales: number;
  cashReceived: number;
  expenses: number;
  netCash: number;
  outstanding: number;
  crownNet: number;
  partnerPercentage: number;
}

export interface ReceivableRow {
  invoice: BookingInvoice;
  booking: Booking | null;
  location: Location | null;
  outstanding: number;
  state: "Overdue" | "Due soon" | "Pending" | "Partial";
}

export interface AccountReport {
  range: DateRange;
  compareMode: ComparisonMode;
  compareRange: DateRange | null;
  rangeLabel: string;
  compareLabel: string | null;
  metrics: PeriodMetrics;
  comparison: PeriodMetrics | null;
  locationPerformance: LocationPerformance[];
  receivables: ReceivableRow[];
  receivableTotals: {
    outstanding: number;
    overdue: number;
    dueSoon: number;
    openInvoices: number;
  };
  periodBookings: Booking[];
  periodInvoices: BookingInvoice[];
  periodPayments: InvoicePayment[];
  effectiveExpenses: EffectiveExpense[];
  locations: Location[];
  bookings: Booking[];
  partners: LocationPartner[];
  paymentHistoryAvailable: boolean;
}

interface ReportData {
  locations: Location[];
  bookings: Booking[];
  invoices: BookingInvoice[];
  payments: InvoicePayment[];
  expenses: LocationExpense[];
  partners: LocationPartner[];
  paymentHistoryAvailable: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function dateOnly(value: string | Date): string {
  if (typeof value === "string" && DATE_PATTERN.test(value.slice(0, 10))) return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function fromDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function isValidDateOnly(value: string | undefined): value is string {
  if (!value || !DATE_PATTERN.test(value)) return false;
  return dateOnly(fromDateOnly(value)) === value;
}

function addDays(value: string, days: number): string {
  const date = fromDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return dateOnly(date);
}

function addMonthsClamped(value: string, months: number): string {
  const date = fromDateOnly(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return dateOnly(date);
}

function shiftYearClamped(value: string, years: number): string {
  const date = fromDateOnly(value);
  const month = date.getUTCMonth();
  date.setUTCFullYear(date.getUTCFullYear() + years);
  if (date.getUTCMonth() !== month) date.setUTCDate(0);
  return dateOnly(date);
}

function inRange(value: string | null, range: DateRange): boolean {
  if (!value) return false;
  const valueDate = dateOnly(value);
  return valueDate >= range.from && valueDate <= range.to;
}

function overlapsRange(start: string, end: string, range: DateRange): boolean {
  return dateOnly(start) <= range.to && dateOnly(end) >= range.from;
}

function formatRangeLabel(range: DateRange): string {
  const from = fromDateOnly(range.from);
  const to = fromDateOnly(range.to);
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const fromLabel = from.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
  const toLabel = to.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${fromLabel} – ${toLabel}`;
}

export function resolveDateRange(
  params: { from?: string; to?: string; compare?: string },
  today = new Date()
): { range: DateRange; compareMode: ComparisonMode; compareRange: DateRange | null } {
  const todayValue = dateOnly(today);
  const currentMonthStart = `${todayValue.slice(0, 7)}-01`;
  let from = isValidDateOnly(params.from) ? params.from : currentMonthStart;
  let to = isValidDateOnly(params.to) ? params.to : todayValue;

  if (from > to) [from, to] = [to, from];

  const compareMode: ComparisonMode = params.compare === "year"
    ? "year"
    : params.compare === "none"
      ? "none"
      : "previous";

  let compareRange: DateRange | null = null;
  if (compareMode === "previous") {
    const days = Math.round((fromDateOnly(to).getTime() - fromDateOnly(from).getTime()) / DAY_MS) + 1;
    const compareTo = addDays(from, -1);
    compareRange = { from: addDays(compareTo, -(days - 1)), to: compareTo };
  } else if (compareMode === "year") {
    compareRange = { from: shiftYearClamped(from, -1), to: shiftYearClamped(to, -1) };
  }

  return { range: { from, to }, compareMode, compareRange };
}

export function accountPresetRanges(today = new Date()) {
  const todayValue = dateOnly(today);
  const year = Number(todayValue.slice(0, 4));
  const month = Number(todayValue.slice(5, 7));
  const thisMonthEnd = dateOnly(new Date(Date.UTC(year, month, 0)));
  const lastMonthEnd = dateOnly(new Date(Date.UTC(year, month - 1, 0)));
  const lastMonthStart = `${lastMonthEnd.slice(0, 7)}-01`;
  const quarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
  const quarterEnd = dateOnly(new Date(Date.UTC(year, quarterMonth + 2, 0)));

  return {
    thisMonth: { from: `${todayValue.slice(0, 7)}-01`, to: thisMonthEnd },
    lastMonth: { from: lastMonthStart, to: lastMonthEnd },
    thisQuarter: { from: `${year}-${String(quarterMonth).padStart(2, "0")}-01`, to: quarterEnd },
    thisYear: { from: `${year}-01-01`, to: `${year}-12-31` },
  } satisfies Record<string, DateRange>;
}

function expenseOccurrences(expenses: LocationExpense[], range: DateRange): EffectiveExpense[] {
  const rows: EffectiveExpense[] = [];

  for (const expense of expenses) {
    const anchor = dateOnly(expense.expense_date);
    if (!expense.is_recurring) {
      if (inRange(anchor, range)) rows.push({ expense, occurrenceDate: anchor });
      continue;
    }

    let occurrenceIndex = 0;
    let occurrence = addMonthsClamped(anchor, occurrenceIndex);
    let safety = 0;
    while (occurrence < range.from && safety < 1200) {
      occurrenceIndex += 1;
      occurrence = addMonthsClamped(anchor, occurrenceIndex);
      safety += 1;
    }
    while (occurrence <= range.to && safety < 1200) {
      rows.push({ expense, occurrenceDate: occurrence });
      occurrenceIndex += 1;
      occurrence = addMonthsClamped(anchor, occurrenceIndex);
      safety += 1;
    }
  }

  return rows.sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate));
}

function invoicePaymentsForRange(data: ReportData, range: DateRange): InvoicePayment[] {
  if (data.paymentHistoryAvailable) {
    return data.payments.filter((payment) => inRange(payment.payment_date, range));
  }

  return data.invoices
    .filter((invoice) => invoice.paid_amount > 0 && inRange(invoice.last_payment_date, range))
    .map((invoice) => ({
      id: -invoice.id,
      invoice_id: invoice.id,
      amount: invoice.paid_amount,
      payment_date: invoice.last_payment_date ?? range.to,
      payment_reference: invoice.payment_reference,
      notes: "Legacy aggregated payment",
      created_at: invoice.updated_at,
    }));
}

function metricsForRange(data: ReportData, range: DateRange): PeriodMetrics {
  const activeInvoices = data.invoices.filter((invoice) => invoice.status !== "CANCELLED");
  const periodBookings = data.bookings.filter((booking) => inRange(booking.created_at, range));
  const periodInvoices = activeInvoices.filter((invoice) => inRange(invoice.due_date, range));
  const periodPayments = invoicePaymentsForRange(data, range);
  const effectiveExpenses = expenseOccurrences(data.expenses, range);
  const bookingById = new Map(data.bookings.map((booking) => [booking.id, booking]));
  const partnerPercentageByLocation = new Map<number, number>();

  for (const partner of data.partners) {
    partnerPercentageByLocation.set(
      partner.location_id,
      (partnerPercentageByLocation.get(partner.location_id) ?? 0) + partner.percentage
    );
  }

  const locationCash = new Map<number, number>();
  for (const payment of periodPayments) {
    const invoice = data.invoices.find((row) => row.id === payment.invoice_id);
    const booking = invoice ? bookingById.get(invoice.booking_id) : null;
    if (booking) locationCash.set(booking.location_id, (locationCash.get(booking.location_id) ?? 0) + payment.amount);
  }
  for (const row of effectiveExpenses) {
    locationCash.set(row.expense.location_id, (locationCash.get(row.expense.location_id) ?? 0) - row.expense.amount);
  }

  const crownNet = [...locationCash.entries()].reduce((total, [locationId, cash]) => {
    const partnerPercentage = Math.min(100, partnerPercentageByLocation.get(locationId) ?? 0);
    return total + cash * ((100 - partnerPercentage) / 100);
  }, 0);

  const invoicedSales = periodInvoices.reduce((total, invoice) => total + invoice.amount, 0);
  const cashReceived = periodPayments.reduce((total, payment) => total + payment.amount, 0);
  const expenseTotal = effectiveExpenses.reduce((total, row) => total + row.expense.amount, 0);

  return {
    bookedSales: periodBookings.reduce((total, booking) => total + booking.amount, 0),
    invoicedSales,
    cashReceived,
    expenses: expenseTotal,
    netCash: cashReceived - expenseTotal,
    crownNet,
    outstanding: periodInvoices.reduce((total, invoice) => total + Math.max(0, invoice.amount - invoice.paid_amount), 0),
    bookingCount: periodBookings.length,
    invoiceCount: periodInvoices.length,
    expenseCount: effectiveExpenses.length,
    activeBookings: data.bookings.filter((booking) => overlapsRange(booking.start_date, booking.end_date, range)).length,
  };
}

async function loadReportData(): Promise<ReportData> {
  const supabase = await createClient();
  const [
    locationsResult,
    bookingsResult,
    invoicesResult,
    paymentsResult,
    expensesResult,
    partnersResult,
  ] = await Promise.all([
    supabase.from("locations").select("*").eq("is_active", true).order("name"),
    supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    supabase.from("booking_invoices").select("*").order("due_date", { ascending: false }),
    supabase.from("invoice_payments").select("*").order("payment_date", { ascending: false }),
    supabase.from("location_expenses").select("*").order("expense_date", { ascending: false }),
    supabase.from("location_partners").select("*"),
  ]);

  const requiredErrors = [
    locationsResult.error,
    bookingsResult.error,
    invoicesResult.error,
    expensesResult.error,
    partnersResult.error,
  ].filter(Boolean);

  if (requiredErrors.length > 0) throw new Error(requiredErrors[0]?.message ?? "Unable to load accounts data.");

  return {
    locations: (locationsResult.data ?? []) as Location[],
    bookings: (bookingsResult.data ?? []) as Booking[],
    invoices: (invoicesResult.data ?? []) as BookingInvoice[],
    payments: paymentsResult.error ? [] : ((paymentsResult.data ?? []) as InvoicePayment[]),
    expenses: (expensesResult.data ?? []) as LocationExpense[],
    partners: (partnersResult.data ?? []) as LocationPartner[],
    paymentHistoryAvailable: !paymentsResult.error,
  };
}

export async function getAccountReport(params: {
  from?: string;
  to?: string;
  compare?: string;
}): Promise<AccountReport> {
  const data = await loadReportData();
  const { range, compareMode, compareRange } = resolveDateRange(params);
  const metrics = metricsForRange(data, range);
  const comparison = compareRange ? metricsForRange(data, compareRange) : null;
  const periodBookings = data.bookings.filter((booking) => inRange(booking.created_at, range));
  const periodInvoices = data.invoices.filter(
    (invoice) => invoice.status !== "CANCELLED" && inRange(invoice.due_date, range)
  );
  const periodPayments = invoicePaymentsForRange(data, range);
  const effectiveExpenses = expenseOccurrences(data.expenses, range);
  const bookingById = new Map(data.bookings.map((booking) => [booking.id, booking]));
  const locationById = new Map(data.locations.map((location) => [location.id, location]));
  const invoiceById = new Map(data.invoices.map((invoice) => [invoice.id, invoice]));
  const paymentsByLocation = new Map<number, number>();

  for (const payment of periodPayments) {
    const invoice = invoiceById.get(payment.invoice_id);
    const booking = invoice ? bookingById.get(invoice.booking_id) : null;
    if (booking) paymentsByLocation.set(booking.location_id, (paymentsByLocation.get(booking.location_id) ?? 0) + payment.amount);
  }

  const locationPerformance = data.locations
    .map((location) => {
      const locationBookings = data.bookings.filter((booking) => booking.location_id === location.id);
      const locationBookingIds = new Set(locationBookings.map((booking) => booking.id));
      const locationInvoices = periodInvoices.filter((invoice) => locationBookingIds.has(invoice.booking_id));
      const bookedSales = periodBookings
        .filter((booking) => booking.location_id === location.id)
        .reduce((total, booking) => total + booking.amount, 0);
      const invoicedSales = locationInvoices.reduce((total, invoice) => total + invoice.amount, 0);
      const cashReceived = paymentsByLocation.get(location.id) ?? 0;
      const locationExpenses = effectiveExpenses
        .filter((row) => row.expense.location_id === location.id)
        .reduce((total, row) => total + row.expense.amount, 0);
      const netCash = cashReceived - locationExpenses;
      const partnerPercentage = Math.min(
        100,
        data.partners
          .filter((partner) => partner.location_id === location.id)
          .reduce((total, partner) => total + partner.percentage, 0)
      );

      return {
        location,
        activeBookings: locationBookings.filter((booking) => overlapsRange(booking.start_date, booking.end_date, range)).length,
        bookedSales,
        invoicedSales,
        cashReceived,
        expenses: locationExpenses,
        netCash,
        outstanding: locationInvoices.reduce((total, invoice) => total + Math.max(0, invoice.amount - invoice.paid_amount), 0),
        crownNet: netCash * ((100 - partnerPercentage) / 100),
        partnerPercentage,
      };
    })
    .sort((a, b) => {
      const activityA = a.invoicedSales + a.cashReceived + a.expenses + a.bookedSales;
      const activityB = b.invoicedSales + b.cashReceived + b.expenses + b.bookedSales;
      return activityB - activityA || a.location.name.localeCompare(b.location.name);
    });

  const today = dateOnly(new Date());
  const dueSoonLimit = addDays(today, 30);
  const receivables = data.invoices
    .filter((invoice) => invoice.status !== "CANCELLED" && invoice.paid_amount < invoice.amount)
    .map((invoice): ReceivableRow => {
      const booking = bookingById.get(invoice.booking_id) ?? null;
      const outstanding = Math.max(0, invoice.amount - invoice.paid_amount);
      let state: ReceivableRow["state"] = invoice.paid_amount > 0 ? "Partial" : "Pending";
      if (invoice.due_date < today) state = "Overdue";
      else if (invoice.due_date <= dueSoonLimit) state = "Due soon";
      return {
        invoice,
        booking,
        location: booking ? locationById.get(booking.location_id) ?? null : null,
        outstanding,
        state,
      };
    })
    .sort((a, b) => {
      const priority = { Overdue: 0, "Due soon": 1, Partial: 2, Pending: 3 };
      return priority[a.state] - priority[b.state]
        || a.invoice.due_date.localeCompare(b.invoice.due_date)
        || b.outstanding - a.outstanding;
    });

  return {
    range,
    compareMode,
    compareRange,
    rangeLabel: formatRangeLabel(range),
    compareLabel: compareRange ? formatRangeLabel(compareRange) : null,
    metrics,
    comparison,
    locationPerformance,
    receivables,
    receivableTotals: {
      outstanding: receivables.reduce((total, row) => total + row.outstanding, 0),
      overdue: receivables.filter((row) => row.state === "Overdue").reduce((total, row) => total + row.outstanding, 0),
      dueSoon: receivables.filter((row) => row.state === "Due soon").reduce((total, row) => total + row.outstanding, 0),
      openInvoices: receivables.length,
    },
    periodBookings,
    periodInvoices,
    periodPayments,
    effectiveExpenses,
    locations: data.locations,
    bookings: data.bookings,
    partners: data.partners,
    paymentHistoryAvailable: data.paymentHistoryAvailable,
  };
}
