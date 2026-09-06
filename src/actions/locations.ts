"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LandType, LocationMediaCategory, PricingBasis } from "@/lib/supabase/types";
import { requirePermission } from "@/lib/auth/access";

function parseLocationForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const size = (formData.get("size") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  const land_type = ((formData.get("landType") as LandType) || "crown") as LandType;
  const priceRaw = (formData.get("pricePerMonth") as string)?.trim();
  const price_per_month = priceRaw ? Number(priceRaw.replace(/,/g, "")) : null;
  const pricing_basis = ((formData.get("pricingBasis") as PricingBasis) || "monthly") as PricingBasis;
  const price_label = (formData.get("priceLabel") as string)?.trim() || null;
  const facing_from = (formData.get("facingFrom") as string)?.trim() || null;
  const facing_towards = (formData.get("facingTowards") as string)?.trim() || null;
  const media_category = ((formData.get("mediaCategory") as LocationMediaCategory) || "static") as LocationMediaCategory;
  const public_image_path = (formData.get("publicImagePath") as string)?.trim() || null;

  // Owner and purchase price belong to outsourced sites only, so switching a site
  // back to company-owned clears them rather than leaving stale numbers behind.
  const is_outsourced = formData.get("ownership") === "outsourced";
  const purchaseRaw = (formData.get("purchasePrice") as string)?.trim();
  const purchasePrice = purchaseRaw ? Number(purchaseRaw.replace(/,/g, "")) : null;

  return {
    name,
    size,
    city,
    address,
    land_type,
    price_per_month: Number.isFinite(price_per_month) ? price_per_month : null,
    price_label,
    pricing_basis,
    facing_from,
    facing_towards,
    media_category,
    public_image_path,
    is_outsourced,
    outsourced_from: is_outsourced ? (formData.get("outsourcedFrom") as string)?.trim() || null : null,
    purchase_price: is_outsourced && Number.isFinite(purchasePrice) ? purchasePrice : null,
  };
}

/** One gate for all three write paths — create, update and the modal variant. */
function validateLocation(payload: ReturnType<typeof parseLocationForm>): string | null {
  if (!payload.name || !payload.size || !payload.city) return "Name, size, and city are required.";
  if (payload.is_outsourced && !payload.outsourced_from) {
    return "An outsourced location needs the original owner it is bought from.";
  }
  return null;
}

export async function createLocation(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  await requirePermission("locations");
  const payload = parseLocationForm(formData);
  const invalid = validateLocation(payload);
  if (invalid) return invalid;

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .insert({ ...payload, is_active: true });

  if (error) return error.message;

  revalidatePath("/dashboard/locations");
  redirect("/dashboard/locations");
}

export async function updateLocation(
  id: number,
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  await requirePermission("locations");
  const payload = parseLocationForm(formData);
  const invalid = validateLocation(payload);
  if (invalid) return invalid;

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update(payload)
    .eq("id", id);

  if (error) return error.message;

  revalidatePath("/dashboard/locations");
  revalidatePath(`/dashboard/locations/${id}`);
  revalidatePath("/dashboard");
  return "ok";
}

export async function deleteLocation(id: number) {
  await requirePermission("locations");
  const supabase = await createClient();
  await supabase.from("locations").delete().eq("id", id);
  revalidatePath("/dashboard/locations");
  redirect("/dashboard/locations");
}

// Modal variant — revalidates without redirecting, returns "ok:{id}" on success
export async function createLocationAction(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  await requirePermission("locations");
  const payload = parseLocationForm(formData);
  const invalid = validateLocation(payload);
  if (invalid) return invalid;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .insert({ ...payload, is_active: true })
    .select("id")
    .single();

  if (error) return error.message;

  const locationId = data.id as number;

  // Upload any images attached at creation time
  const files = (formData.getAll("images") as File[]).filter((f) => f.size > 0);
  for (const file of files) {
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) continue;
    const ext = file.name.split(".").pop() ?? "jpg";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `${locationId}/${uniqueName}`;
    const { error: upErr } = await supabase.storage
      .from("location-images")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (!upErr) {
      await supabase.from("location_images").insert({
        location_id: locationId,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
    }
  }

  revalidatePath("/dashboard/locations");
  revalidatePath("/dashboard");
  return `ok:${locationId}`;
}
