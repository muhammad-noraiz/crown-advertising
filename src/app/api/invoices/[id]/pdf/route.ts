import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/access";
import { createInvoicePdf, type InvoiceDocumentKind, type InvoicePdfPayment } from "@/lib/invoice-pdf";
import { getInvoiceStatus } from "@/lib/invoices";
import type { Booking, BookingInvoice, Client, InvoicePayment, Location } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fileSafe(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "invoice";
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("bookings");
  } catch {
    return Response.json({ error: "You do not have permission to generate invoice documents." }, { status: 403 });
  }

  const { id } = await params;
  const invoiceId = Number(id);
  const document = new URL(request.url).searchParams.get("document") ?? "invoice";
  if (!Number.isInteger(invoiceId) || invoiceId <= 0 || !["invoice", "receipt"].includes(document)) {
    return Response.json({ error: "Invalid invoice document request." }, { status: 400 });
  }

  const kind = document as InvoiceDocumentKind;
  const supabase = await createClient();
  const { data: invoiceData, error: invoiceError } = await supabase.from("booking_invoices").select("*").eq("id", invoiceId).single();
  if (invoiceError || !invoiceData) return Response.json({ error: "Invoice not found." }, { status: 404 });
  const invoice = invoiceData as BookingInvoice;
  if (invoice.status === "CANCELLED") return Response.json({ error: "Cancelled invoices cannot be issued." }, { status: 409 });
  if (kind === "invoice" && invoice.paid_amount >= invoice.amount) return Response.json({ error: "This invoice is already paid. Generate its payment receipt instead." }, { status: 409 });
  if (kind === "receipt" && invoice.paid_amount <= 0) return Response.json({ error: "Record a payment before generating a receipt." }, { status: 409 });

  const { data: bookingData, error: bookingError } = await supabase.from("bookings").select("*").eq("id", invoice.booking_id).single();
  if (bookingError || !bookingData) return Response.json({ error: "The booking for this invoice was not found." }, { status: 404 });
  const booking = bookingData as Booking;

  const [locationResult, clientResult, paymentsResult] = await Promise.all([
    supabase.from("locations").select("*").eq("id", booking.location_id).single(),
    booking.client_id ? supabase.from("clients").select("*").eq("id", booking.client_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabase.from("invoice_payments").select("*").eq("invoice_id", invoice.id).order("payment_date", { ascending: false }),
  ]);
  if (locationResult.error || !locationResult.data) return Response.json({ error: "The location for this invoice was not found." }, { status: 404 });
  const location = locationResult.data as Location;
  const client = clientResult.data as Client | null;
  const payments = paymentsResult.error ? [] : ((paymentsResult.data ?? []) as InvoicePayment[]);
  const paymentRows: InvoicePdfPayment[] = payments.length > 0
    ? payments.map((payment) => ({ amount: payment.amount, paymentDate: payment.payment_date, reference: payment.payment_reference }))
    : invoice.paid_amount > 0
      ? [{ amount: invoice.paid_amount, paymentDate: invoice.last_payment_date ?? invoice.updated_at, reference: invoice.payment_reference }]
      : [];

  let logoBytes: Uint8Array | undefined;
  try {
    logoBytes = await readFile(path.join(process.cwd(), "public", "crown-assets", "logo.jpg"));
  } catch {
    logoBytes = undefined;
  }

  const pdf = await createInvoicePdf({
    kind,
    invoiceNo: invoice.invoice_no,
    issuedAt: kind === "receipt" ? invoice.last_payment_date ?? invoice.updated_at : invoice.created_at,
    dueDate: invoice.due_date,
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    amount: invoice.amount,
    paidAmount: invoice.paid_amount,
    outstanding: Math.max(0, invoice.amount - invoice.paid_amount),
    invoiceStatus: getInvoiceStatus(invoice),
    notes: invoice.notes,
    client: {
      name: client?.name ?? booking.client_name,
      company: client?.company ?? null,
      email: client?.email ?? null,
      phone: client?.phone ?? null,
      address: client?.address ?? null,
    },
    location: { name: location.name, size: location.size, city: location.city, address: location.address },
    booking: {
      startDate: booking.start_date,
      endDate: booking.end_date,
      duration: booking.duration,
      lockingRef: booking.locking_ref,
      salePerson: booking.sale_person,
    },
    payments: paymentRows,
  }, logoBytes);

  const label = kind === "receipt" ? "payment-receipt" : "payment-request";
  const filename = `${label}-${fileSafe(invoice.invoice_no)}.pdf`;
  return new Response(pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
