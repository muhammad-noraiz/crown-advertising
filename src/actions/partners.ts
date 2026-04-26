"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPartner(
  locationId: number,
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const partner_name = (formData.get("partnerName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const percentage = parseFloat(formData.get("percentage") as string);
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!partner_name) return "Partner name is required.";
  if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
    return "Percentage must be between 0.01 and 100.";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("location_partners").insert({
    location_id: locationId,
    partner_name,
    phone,
    email,
    percentage,
    notes,
  });

  if (error) return error.message;

  revalidatePath(`/dashboard/locations/${locationId}`);
  revalidatePath("/dashboard/accounts");
  return "ok";
}

export async function updatePartner(
  id: number,
  locationId: number,
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const partner_name = (formData.get("partnerName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const percentage = parseFloat(formData.get("percentage") as string);
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!partner_name) return "Partner name is required.";
  if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
    return "Percentage must be between 0.01 and 100.";
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("location_partners")
    .update({ partner_name, phone, email, percentage, notes })
    .eq("id", id);

  if (error) return error.message;

  revalidatePath(`/dashboard/locations/${locationId}`);
  revalidatePath("/dashboard/accounts");
  return "ok";
}

export async function deletePartner(id: number, locationId: number) {
  const supabase = await createClient();
  await supabase.from("location_partners").delete().eq("id", id);
  revalidatePath(`/dashboard/locations/${locationId}`);
  revalidatePath("/dashboard/accounts");
}
