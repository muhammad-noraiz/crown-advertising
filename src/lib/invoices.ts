import type { BillingType, Booking, BookingInvoice, InvoiceStatus } from "@/lib/supabase/types";

export type InvoiceDisplayStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";

type InvoiceScheduleRow = Omit<
  BookingInvoice,
  "id" | "created_at" | "updated_at" | "last_payment_date" | "payment_reference" | "notes"
> & {
  last_payment_date: null;
  payment_reference: null;
  notes: null;
};

function dateOnly(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

function fromDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addMonthClamped(value: Date): Date {
  const result = new Date(value);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function subtractDay(value: Date): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() - 1);
  return result;
}

export function billingTypeLabel(type: BillingType): string {
  return type === "monthly" ? "Monthly rent" : "Combined at end";
}

export function getInvoiceStatus(invoice: Pick<BookingInvoice, "amount" | "paid_amount" | "due_date" | "status">): InvoiceDisplayStatus {
  if (invoice.status === "CANCELLED") return "CANCELLED";
  if (invoice.paid_amount >= invoice.amount) return "PAID";
  if (invoice.paid_amount > 0) return "PARTIAL";
  if (fromDateOnly(invoice.due_date).getTime() < fromDateOnly(dateOnly(new Date())).getTime()) return "OVERDUE";
  return "PENDING";
}

export function getInvoiceTotals(invoices: BookingInvoice[]) {
  return invoices.reduce(
    (totals, invoice) => {
      if (getInvoiceStatus(invoice) === "CANCELLED") return totals;
      totals.invoiced += invoice.amount;
      totals.paid += invoice.paid_amount;
      totals.outstanding += Math.max(0, invoice.amount - invoice.paid_amount);
      if (getInvoiceStatus(invoice) === "OVERDUE") {
        totals.overdue += Math.max(0, invoice.amount - invoice.paid_amount);
      }
      return totals;
    },
    { invoiced: 0, paid: 0, outstanding: 0, overdue: 0 }
  );
}

export function getBookingInvoiceStatus(invoices: BookingInvoice[]): InvoiceDisplayStatus | "NOT_SETUP" {
  const active = invoices.filter((invoice) => getInvoiceStatus(invoice) !== "CANCELLED");
  if (active.length === 0) return "NOT_SETUP";
  const statuses = active.map(getInvoiceStatus);
  if (statuses.every((status) => status === "PAID")) return "PAID";
  if (statuses.includes("OVERDUE")) return "OVERDUE";
  if (statuses.includes("PARTIAL") || statuses.includes("PAID")) return "PARTIAL";
  return "PENDING";
}

/**
 * Continues a manual invoice number across a schedule: "CR - AD 187" over three
 * months becomes 187, 188, 189, because accounting needs distinct sequential
 * numbers rather than one number with -001 suffixes. Bases with no trailing
 * digits fall back to numbered suffixes.
 */
export function sequenceInvoiceNumber(base: string, index: number): string {
  const trimmed = base.trim();
  const match = trimmed.match(/^(.*?)(\d+)(\D*)$/);
  if (!match) return index === 0 ? trimmed : `${trimmed}-${String(index + 1).padStart(3, "0")}`;
  const [, prefix, digits, suffix] = match;
  return `${prefix}${String(Number(digits) + index).padStart(digits.length, "0")}${suffix}`;
}

function invoiceNumberAt(bookingId: number, base: string | null | undefined, index: number): string {
  const trimmed = base?.trim();
  if (trimmed) return sequenceInvoiceNumber(trimmed, index);
  return `INV-${bookingId}-${String(index + 1).padStart(3, "0")}`;
}

export function buildInvoiceSchedule(
  booking: Pick<Booking, "id" | "amount" | "billing_type" | "start_date" | "end_date">,
  invoiceNoBase?: string | null
): InvoiceScheduleRow[] {
  if (booking.amount <= 0) return [];

  const bookingStart = fromDateOnly(dateOnly(booking.start_date));
  const bookingEnd = fromDateOnly(dateOnly(booking.end_date));

  if (booking.billing_type === "end_of_term") {
    return [
      {
        booking_id: booking.id,
        invoice_no: invoiceNumberAt(booking.id, invoiceNoBase, 0),
        period_start: dateOnly(bookingStart),
        period_end: dateOnly(bookingEnd),
        due_date: dateOnly(bookingEnd),
        amount: booking.amount,
        paid_amount: 0,
        status: "PENDING" as InvoiceStatus,
        last_payment_date: null,
        payment_reference: null,
        notes: null,
      },
    ];
  }

  const periods: { start: Date; end: Date }[] = [];
  let cursor = bookingStart;

  while (cursor < bookingEnd && periods.length < 120) {
    const next = addMonthClamped(cursor);
    const periodEnd = next < bookingEnd ? subtractDay(next) : bookingEnd;
    periods.push({ start: cursor, end: periodEnd });
    cursor = next;
  }

  if (periods.length === 0) return [];
  const baseAmount = Math.floor((booking.amount / periods.length) * 100) / 100;
  let allocated = 0;

  return periods.map((period, index) => {
    const amount = index === periods.length - 1
      ? Math.round((booking.amount - allocated) * 100) / 100
      : baseAmount;
    allocated += amount;

    return {
      booking_id: booking.id,
      invoice_no: invoiceNumberAt(booking.id, invoiceNoBase, index),
      period_start: dateOnly(period.start),
      period_end: dateOnly(period.end),
      due_date: dateOnly(period.start),
      amount,
      paid_amount: 0,
      status: "PENDING" as InvoiceStatus,
      last_payment_date: null,
      payment_reference: null,
      notes: null,
    };
  });
}
