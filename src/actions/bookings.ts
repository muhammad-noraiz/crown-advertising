"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildInvoiceSchedule } from "@/lib/invoices";
import type { BillingType, Booking, InvoiceStatus } from "@/lib/supabase/types";
import { requirePermission } from "@/lib/auth/access";

export async function createBooking(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  await requirePermission("bookings");
  const location_id = Number(formData.get("locationId"));
  const client_id = formData.get("clientId") ? Number(formData.get("clientId")) : null;
  const client_name = (formData.get("clientName") as string)?.trim();
  const amount = parseFloat((formData.get("amount") as string) ?? "0") || 0;
  const sale_person = (formData.get("salePerson") as string)?.trim() || null;
  const vendor = (formData.get("vendor") as string)?.trim() || null;
  const locking_ref = (formData.get("lockingRef") as string)?.trim() || null;
  const billing_type = (formData.get("billingType") as BillingType) || "end_of_term";
  const start_date = formData.get("startDate") as string;
  const end_date = formData.get("endDate") as string;
  const duration = (formData.get("duration") as string)?.trim();
  const remarks = (formData.get("remarks") as string)?.trim() || null;

  if (!location_id || !client_name || !start_date || !end_date || !duration) {
    return "Location, client name, dates, and duration are required.";
  }
  if (amount <= 0) return "Contract amount must be greater than zero.";

  if (new Date(end_date) <= new Date(start_date)) {
    return "End date must be after start date.";
  }

  const supabase = await createClient();
  const { data: bookingData, error } = await supabase.from("bookings").insert({
    location_id,
    client_id,
    client_name,
    amount,
    sale_person,
    vendor,
    locking_ref,
    invoice_no: null,
    invoice_status: "PENDING" as InvoiceStatus,
    billing_type,
    start_date: new Date(start_date).toISOString(),
    end_date: new Date(end_date).toISOString(),
    duration,
    remarks,
  }).select("id, amount, billing_type, start_date, end_date").single();

  if (error) return error.message;

  if (formData.get("generateInvoices") === "on") {
    const invoices = buildInvoiceSchedule(bookingData as Pick<Booking, "id" | "amount" | "billing_type" | "start_date" | "end_date">);
    const { error: invoiceError } = await supabase.from("booking_invoices").insert(invoices);
    if (invoiceError) {
      await supabase.from("bookings").delete().eq("id", bookingData.id);
      return invoiceError.message;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/locations/${location_id}`);
  redirect(`/dashboard/locations/${location_id}`);
}

export async function updateBooking(
  id: number,
  location_id: number,
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  await requirePermission("bookings");
  const client_id = formData.get("clientId") ? Number(formData.get("clientId")) : null;
  const client_name = (formData.get("clientName") as string)?.trim();
  const amount = parseFloat((formData.get("amount") as string) ?? "0") || 0;
  const sale_person = (formData.get("salePerson") as string)?.trim() || null;
  const vendor = (formData.get("vendor") as string)?.trim() || null;
  const locking_ref = (formData.get("lockingRef") as string)?.trim() || null;
  const billing_type = (formData.get("billingType") as BillingType) || "end_of_term";
  const start_date = formData.get("startDate") as string;
  const end_date = formData.get("endDate") as string;
  const duration = (formData.get("duration") as string)?.trim();
  const remarks = (formData.get("remarks") as string)?.trim() || null;

  if (!client_name || !start_date || !end_date || !duration) {
    return "Client name, dates, and duration are required.";
  }
  if (amount <= 0) return "Contract amount must be greater than zero.";

  if (new Date(end_date) <= new Date(start_date)) {
    return "End date must be after start date.";
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      client_id,
      client_name,
      amount,
      sale_person,
      vendor,
      locking_ref,
      billing_type,
      start_date: new Date(start_date).toISOString(),
      end_date: new Date(end_date).toISOString(),
      duration,
      remarks,
    })
    .eq("id", id);

  if (error) return error.message;

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/locations/${location_id}`);
  return "ok";
}

export async function deleteBooking(id: number, location_id: number) {
  await requirePermission("bookings");
  const supabase = await createClient();
  await supabase.from("bookings").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/locations/${location_id}`);
  redirect(`/dashboard/locations/${location_id}`);
}

// Modal variant — revalidates without redirecting, returns "ok" on success
export async function createBookingAction(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  await requirePermission("bookings");
  const location_id = Number(formData.get("locationId"));
  const client_id = formData.get("clientId") ? Number(formData.get("clientId")) : null;
  const client_name = (formData.get("clientName") as string)?.trim();
  const amount = parseFloat((formData.get("amount") as string) ?? "0") || 0;
  const sale_person = (formData.get("salePerson") as string)?.trim() || null;
  const vendor = (formData.get("vendor") as string)?.trim() || null;
  const locking_ref = (formData.get("lockingRef") as string)?.trim() || null;
  const billing_type = (formData.get("billingType") as BillingType) || "end_of_term";
  const start_date = formData.get("startDate") as string;
  const end_date = formData.get("endDate") as string;
  const duration = (formData.get("duration") as string)?.trim();
  const remarks = (formData.get("remarks") as string)?.trim() || null;

  if (!location_id || !client_name || !start_date || !end_date || !duration) {
    return "Location, client name, dates, and duration are required.";
  }
  if (amount <= 0) return "Contract amount must be greater than zero.";
  if (new Date(end_date) <= new Date(start_date)) {
    return "End date must be after start date.";
  }

  const supabase = await createClient();
  const { data: bookingData, error } = await supabase.from("bookings").insert({
    location_id,
    client_id,
    client_name,
    amount,
    sale_person,
    vendor,
    locking_ref,
    invoice_no: null,
    invoice_status: "PENDING" as InvoiceStatus,
    billing_type,
    start_date: new Date(start_date).toISOString(),
    end_date: new Date(end_date).toISOString(),
    duration,
    remarks,
  }).select("id, amount, billing_type, start_date, end_date").single();

  if (error) return error.message;

  if (formData.get("generateInvoices") === "on") {
    const invoices = buildInvoiceSchedule(bookingData as Pick<Booking, "id" | "amount" | "billing_type" | "start_date" | "end_date">);
    const { error: invoiceError } = await supabase.from("booking_invoices").insert(invoices);
    if (invoiceError) {
      await supabase.from("bookings").delete().eq("id", bookingData.id);
      return invoiceError.message;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/locations/${location_id}`);
  return "ok";
}
