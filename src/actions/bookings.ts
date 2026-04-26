"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { InvoiceStatus } from "@/lib/supabase/types";

export async function createBooking(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const location_id = Number(formData.get("locationId"));
  const client_id = formData.get("clientId") ? Number(formData.get("clientId")) : null;
  const client_name = (formData.get("clientName") as string)?.trim();
  const amount = parseFloat((formData.get("amount") as string) ?? "0") || 0;
  const sale_person = (formData.get("salePerson") as string)?.trim() || null;
  const vendor = (formData.get("vendor") as string)?.trim() || null;
  const locking_ref = (formData.get("lockingRef") as string)?.trim() || null;
  const invoice_no = (formData.get("invoiceNo") as string)?.trim() || null;
  const invoice_status = (formData.get("invoiceStatus") as InvoiceStatus) || "PENDING";
  const start_date = formData.get("startDate") as string;
  const end_date = formData.get("endDate") as string;
  const duration = (formData.get("duration") as string)?.trim();
  const remarks = (formData.get("remarks") as string)?.trim() || null;

  if (!location_id || !client_name || !start_date || !end_date || !duration) {
    return "Location, client name, dates, and duration are required.";
  }

  if (new Date(end_date) <= new Date(start_date)) {
    return "End date must be after start date.";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bookings").insert({
    location_id,
    client_id,
    client_name,
    amount,
    sale_person,
    vendor,
    locking_ref,
    invoice_no,
    invoice_status,
    start_date: new Date(start_date).toISOString(),
    end_date: new Date(end_date).toISOString(),
    duration,
    remarks,
  });

  if (error) return error.message;

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
  const client_id = formData.get("clientId") ? Number(formData.get("clientId")) : null;
  const client_name = (formData.get("clientName") as string)?.trim();
  const amount = parseFloat((formData.get("amount") as string) ?? "0") || 0;
  const sale_person = (formData.get("salePerson") as string)?.trim() || null;
  const vendor = (formData.get("vendor") as string)?.trim() || null;
  const locking_ref = (formData.get("lockingRef") as string)?.trim() || null;
  const invoice_no = (formData.get("invoiceNo") as string)?.trim() || null;
  const invoice_status = (formData.get("invoiceStatus") as InvoiceStatus) || "PENDING";
  const start_date = formData.get("startDate") as string;
  const end_date = formData.get("endDate") as string;
  const duration = (formData.get("duration") as string)?.trim();
  const remarks = (formData.get("remarks") as string)?.trim() || null;

  if (!client_name || !start_date || !end_date || !duration) {
    return "Client name, dates, and duration are required.";
  }

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
      invoice_no,
      invoice_status,
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
  const location_id = Number(formData.get("locationId"));
  const client_id = formData.get("clientId") ? Number(formData.get("clientId")) : null;
  const client_name = (formData.get("clientName") as string)?.trim();
  const amount = parseFloat((formData.get("amount") as string) ?? "0") || 0;
  const sale_person = (formData.get("salePerson") as string)?.trim() || null;
  const vendor = (formData.get("vendor") as string)?.trim() || null;
  const locking_ref = (formData.get("lockingRef") as string)?.trim() || null;
  const invoice_no = (formData.get("invoiceNo") as string)?.trim() || null;
  const invoice_status = (formData.get("invoiceStatus") as InvoiceStatus) || "PENDING";
  const start_date = formData.get("startDate") as string;
  const end_date = formData.get("endDate") as string;
  const duration = (formData.get("duration") as string)?.trim();
  const remarks = (formData.get("remarks") as string)?.trim() || null;

  if (!location_id || !client_name || !start_date || !end_date || !duration) {
    return "Location, client name, dates, and duration are required.";
  }
  if (new Date(end_date) <= new Date(start_date)) {
    return "End date must be after start date.";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bookings").insert({
    location_id,
    client_id,
    client_name,
    amount,
    sale_person,
    vendor,
    locking_ref,
    invoice_no,
    invoice_status,
    start_date: new Date(start_date).toISOString(),
    end_date: new Date(end_date).toISOString(),
    duration,
    remarks,
  });

  if (error) return error.message;

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/locations/${location_id}`);
  return "ok";
}

