"use server";

import { revalidatePath } from "next/cache";
import { buildInvoiceSchedule } from "@/lib/invoices";
import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingInvoice, InvoiceStatus } from "@/lib/supabase/types";
import { requirePermission } from "@/lib/auth/access";

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function refreshInvoiceViews(bookingId: number) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/accounts");
  revalidatePath(`/dashboard/bookings/${bookingId}`);
}

export async function generateInvoiceSchedule(
  bookingId: number,
  _previousState: string | null
): Promise<string | null> {
  await requirePermission("bookings");
  void _previousState;
  const { supabase, user } = await authenticatedClient();
  if (!user) return "You must be signed in to manage invoices.";

  const [{ data: bookingData, error: bookingError }, { count, error: countError }] = await Promise.all([
    supabase.from("bookings").select("id, amount, billing_type, start_date, end_date").eq("id", bookingId).single(),
    supabase.from("booking_invoices").select("id", { count: "exact", head: true }).eq("booking_id", bookingId),
  ]);

  if (bookingError) return bookingError.message;
  if (countError) return countError.message;
  if ((count ?? 0) > 0) return "This booking already has invoices. Add individual invoices instead.";

  const invoices = buildInvoiceSchedule(bookingData as Pick<Booking, "id" | "amount" | "billing_type" | "start_date" | "end_date">);
  if (invoices.length === 0) return "A positive contract amount and valid booking dates are required.";

  const { error } = await supabase.from("booking_invoices").insert(invoices);
  if (error) return error.message;

  refreshInvoiceViews(bookingId);
  return "ok";
}

export async function createInvoice(
  bookingId: number,
  _previousState: string | null,
  formData: FormData
): Promise<string | null> {
  await requirePermission("bookings");
  void _previousState;
  const { supabase, user } = await authenticatedClient();
  if (!user) return "You must be signed in to manage invoices.";

  const invoiceNo = (formData.get("invoiceNo") as string)?.trim() || `INV-${bookingId}-${Date.now().toString().slice(-6)}`;
  const amount = Number(formData.get("amount"));
  const dueDate = formData.get("dueDate") as string;
  const periodStart = (formData.get("periodStart") as string) || null;
  const periodEnd = (formData.get("periodEnd") as string) || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!Number.isFinite(amount) || amount <= 0 || !dueDate) {
    return "Invoice amount and due date are required.";
  }
  if (periodStart && periodEnd && periodEnd < periodStart) {
    return "Invoice period end must be on or after its start date.";
  }

  const { error } = await supabase.from("booking_invoices").insert({
    booking_id: bookingId,
    invoice_no: invoiceNo,
    period_start: periodStart,
    period_end: periodEnd,
    due_date: dueDate,
    amount,
    paid_amount: 0,
    status: "PENDING" as InvoiceStatus,
    last_payment_date: null,
    payment_reference: null,
    notes,
  });

  if (error) return error.message;

  refreshInvoiceViews(bookingId);
  return "ok";
}

export async function recordInvoicePayment(
  invoiceId: number,
  bookingId: number,
  _previousState: string | null,
  formData: FormData
): Promise<string | null> {
  await requirePermission("bookings");
  void _previousState;
  const { supabase, user } = await authenticatedClient();
  if (!user) return "You must be signed in to manage invoices.";

  const paymentAmount = Number(formData.get("paymentAmount"));
  const paymentDate = (formData.get("paymentDate") as string) || new Date().toISOString().slice(0, 10);
  const paymentReference = (formData.get("paymentReference") as string)?.trim() || null;

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return "Enter a payment amount greater than zero.";
  }

  const { error: ledgerError } = await supabase.rpc("record_invoice_payment", {
    p_invoice_id: invoiceId,
    p_booking_id: bookingId,
    p_amount: paymentAmount,
    p_payment_date: paymentDate,
    p_payment_reference: paymentReference,
  });

  // Keep payment recording functional while the payment-ledger migration is
  // being deployed. Once it exists, the RPC handles both writes atomically.
  if (!ledgerError) {
    refreshInvoiceViews(bookingId);
    return "ok";
  }

  const ledgerUnavailable = ledgerError.code === "PGRST202"
    || ledgerError.code === "42883"
    || ledgerError.message.toLowerCase().includes("record_invoice_payment");
  if (!ledgerUnavailable) return ledgerError.message;

  const { data, error: readError } = await supabase
    .from("booking_invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("booking_id", bookingId)
    .single();

  if (readError) return readError.message;
  const invoice = data as BookingInvoice;
  if (invoice.status === "CANCELLED") return "A cancelled invoice cannot receive payments.";

  const outstanding = Math.max(0, invoice.amount - invoice.paid_amount);
  if (paymentAmount > outstanding) {
    return `Payment cannot exceed the outstanding PKR ${outstanding.toLocaleString()}.`;
  }

  const paidAmount = Math.round((invoice.paid_amount + paymentAmount) * 100) / 100;
  const status: InvoiceStatus = paidAmount >= invoice.amount ? "PAID" : "PARTIAL";
  const { error } = await supabase
    .from("booking_invoices")
    .update({
      paid_amount: paidAmount,
      status,
      last_payment_date: paymentDate,
      payment_reference: paymentReference,
    })
    .eq("id", invoiceId)
    .eq("booking_id", bookingId);

  if (error) return error.message;

  // If the table is already available but the RPC has not reached the API
  // schema cache yet, retain the transaction in the new ledger as well.
  await supabase.from("invoice_payments").insert({
    invoice_id: invoiceId,
    amount: paymentAmount,
    payment_date: paymentDate,
    payment_reference: paymentReference,
    notes: null,
  });

  refreshInvoiceViews(bookingId);
  return "ok";
}

export async function cancelInvoice(invoiceId: number, bookingId: number): Promise<void> {
  await requirePermission("bookings");
  const { supabase, user } = await authenticatedClient();
  if (!user) return;

  await supabase
    .from("booking_invoices")
    .update({ status: "CANCELLED" as InvoiceStatus })
    .eq("id", invoiceId)
    .eq("booking_id", bookingId);
  refreshInvoiceViews(bookingId);
}
