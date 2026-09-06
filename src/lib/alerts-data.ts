import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccess } from "@/lib/auth/access";
import { canAccess } from "@/lib/permissions";
import { ALERT_WINDOW_DAYS, buildAlerts, type Alert, type DocumentAlertRow, type InvoiceAlertRow } from "@/lib/alerts";

/** The feed only reaches a week ahead, so let Postgres drop everything beyond it. */
function horizonDate(): string {
  const horizon = new Date();
  horizon.setUTCDate(horizon.getUTCDate() + ALERT_WINDOW_DAYS);
  return horizon.toISOString().slice(0, 10);
}

/**
 * Everything the signed-in user is allowed to be warned about. Cached per
 * request because the sidebar badge and the alerts page both ask for it.
 */
export const getAlerts = cache(async (): Promise<Alert[]> => {
  const access = await getCurrentAccess();
  if (!access) return [];

  const supabase = await createClient();
  const horizon = horizonDate();

  // Each half of the feed is gated by the permission that owns that data.
  const [documentRows, invoiceRows] = await Promise.all([
    canAccess(access, "locations")
      ? supabase
          .from("location_documents")
          .select("id, location_id, file_name, document_type, valid_until, locations(name)")
          .not("valid_until", "is", null)
          .lte("valid_until", horizon)
          .then(({ data }) => (data ?? []) as unknown as DocumentAlertRow[])
      : Promise.resolve<DocumentAlertRow[]>([]),
    canAccess(access, "bookings")
      ? // Settled invoices are dropped by buildAlerts rather than in SQL: the stored
        // status can lag the ledger, so paid_amount is the value worth trusting.
        supabase
          .from("booking_invoices")
          .select("id, invoice_no, due_date, amount, paid_amount, status, bookings(id, client_name, location_id, locations(name))")
          .neq("status", "CANCELLED")
          .lte("due_date", horizon)
          .then(({ data }) => (data ?? []) as unknown as InvoiceAlertRow[])
      : Promise.resolve<InvoiceAlertRow[]>([]),
  ]);

  return buildAlerts(documentRows, invoiceRows);
});
