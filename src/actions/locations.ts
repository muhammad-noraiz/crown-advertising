"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLocation(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const name = (formData.get("name") as string)?.trim();
  const size = (formData.get("size") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  const land_type = (formData.get("landType") as string) || "crown";

  if (!name || !size || !city) return "Name, size, and city are required.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .insert({ name, size, city, address, land_type, is_active: true });

  if (error) return error.message;

  revalidatePath("/dashboard/locations");
  redirect("/dashboard/locations");
}

export async function updateLocation(
  id: number,
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const name = (formData.get("name") as string)?.trim();
  const size = (formData.get("size") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  const land_type = (formData.get("landType") as string) || "crown";

  if (!name || !size || !city) return "Name, size, and city are required.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update({ name, size, city, address, land_type })
    .eq("id", id);

  if (error) return error.message;

  revalidatePath("/dashboard/locations");
  revalidatePath(`/dashboard/locations/${id}`);
  revalidatePath("/dashboard");
  return "ok";
}

export async function deleteLocation(id: number) {
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
  const name = (formData.get("name") as string)?.trim();
  const size = (formData.get("size") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  const land_type = (formData.get("landType") as string) || "crown";

  if (!name || !size || !city) return "Name, size, and city are required.";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .insert({ name, size, city, address, land_type, is_active: true })
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

