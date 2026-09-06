import type { BookingInvoice, LocationDocument, LocationDocumentType } from "@/lib/supabase/types";

/** How far ahead the dashboard warns about an expiry or a payment falling due. */
export const ALERT_WINDOW_DAYS = 7;

export type AlertSeverity = "overdue" | "due-soon";

export interface DocumentAlert {
  kind: "document";
  id: number;
  severity: AlertSeverity;
  daysLeft: number;
  date: string;
  documentType: LocationDocumentType;
  fileName: string;
  locationId: number;
  locationName: string;
}

export interface InvoiceAlert {
  kind: "invoice";
  id: number;
  severity: AlertSeverity;
  daysLeft: number;
  date: string;
  invoiceNo: string;
  outstanding: number;
  clientName: string;
  bookingId: number;
  locationId: number | null;
  locationName: string;
}

export type Alert = DocumentAlert | InvoiceAlert;

export type DocumentAlertRow = Pick<
  LocationDocument,
  "id" | "location_id" | "file_name" | "document_type" | "valid_until"
> & { locations: { name: string } | null };

export type InvoiceAlertRow = Pick<
  BookingInvoice,
  "id" | "invoice_no" | "due_date" | "amount" | "paid_amount" | "status"
> & {
  bookings: { id: number; client_name: string; location_id: number; locations: { name: string } | null } | null;
};

/**
 * Whole days from today to a `YYYY-MM-DD` column. Both sides are pinned to UTC
 * midnight so a document expiring today reads as 0 rather than a fraction of a
 * day either side of it.
 */
export function daysUntil(date: string, today: Date = new Date()): number {
  const target = Date.parse(`${date.slice(0, 10)}T00:00:00.000Z`);
  const start = Date.parse(`${today.toISOString().slice(0, 10)}T00:00:00.000Z`);
  return Math.round((target - start) / 86_400_000);
}

function severity(daysLeft: number): AlertSeverity {
  return daysLeft < 0 ? "overdue" : "due-soon";
}

function documentAlerts(rows: DocumentAlertRow[], today: Date): DocumentAlert[] {
  return rows.flatMap((row) => {
    if (!row.valid_until) return [];
    const daysLeft = daysUntil(row.valid_until, today);
    if (daysLeft > ALERT_WINDOW_DAYS) return [];
    return [{
      kind: "document" as const,
      id: row.id,
      severity: severity(daysLeft),
      daysLeft,
      date: row.valid_until,
      documentType: row.document_type,
      fileName: row.file_name,
      locationId: row.location_id,
      locationName: row.locations?.name ?? "Unknown location",
    }];
  });
}

function invoiceAlerts(rows: InvoiceAlertRow[], today: Date): InvoiceAlert[] {
  return rows.flatMap((row) => {
    if (row.status === "CANCELLED") return [];
    const outstanding = row.amount - row.paid_amount;
    if (outstanding <= 0) return [];
    const daysLeft = daysUntil(row.due_date, today);
    if (daysLeft > ALERT_WINDOW_DAYS) return [];
    return [{
      kind: "invoice" as const,
      id: row.id,
      severity: severity(daysLeft),
      daysLeft,
      date: row.due_date,
      invoiceNo: row.invoice_no,
      outstanding,
      clientName: row.bookings?.client_name ?? "Unknown client",
      bookingId: row.bookings?.id ?? 0,
      locationId: row.bookings?.location_id ?? null,
      locationName: row.bookings?.locations?.name ?? "Unknown location",
    }];
  });
}

/** Everything expiring or falling due inside the window, most urgent first. */
export function buildAlerts(
  documents: DocumentAlertRow[],
  invoices: InvoiceAlertRow[],
  today: Date = new Date()
): Alert[] {
  return [...documentAlerts(documents, today), ...invoiceAlerts(invoices, today)]
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
