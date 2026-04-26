"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BUCKET = "location-images";

export async function uploadLocationImages(
  locationId: number,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient();

  const files = formData.getAll("images") as File[];
  if (!files.length || files.every((f) => f.size === 0)) {
    return "Please select at least one image.";
  }

  // Validate each file
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return `"${file.name}" is not an image file.`;
    }
    if (file.size > 10 * 1024 * 1024) {
      return `"${file.name}" exceeds the 10 MB limit.`;
    }
  }

  const errors: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `${locationId}/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      errors.push(`Upload failed for "${file.name}": ${uploadError.message}`);
      continue;
    }

    const { error: dbError } = await supabase.from("location_images").insert({
      location_id: locationId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });

    if (dbError) {
      // Clean up orphaned storage object
      await supabase.storage.from(BUCKET).remove([storagePath]);
      errors.push(`DB record failed for "${file.name}": ${dbError.message}`);
    }
  }

  revalidatePath(`/dashboard/locations/${locationId}`);

  if (errors.length) return errors.join(" | ");
  return null;
}

export async function deleteLocationImage(
  imageId: number,
  storagePath: string,
  locationId: number
): Promise<void> {
  const supabase = await createClient();

  // Remove from storage first
  await supabase.storage.from(BUCKET).remove([storagePath]);

  // Remove DB record
  await supabase.from("location_images").delete().eq("id", imageId);

  revalidatePath(`/dashboard/locations/${locationId}`);
}
