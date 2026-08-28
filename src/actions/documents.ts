"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/access";

const BUCKET = "location-documents";
const MAX_BYTES = 20 * 1024 * 1024;
/** Scanned paperwork turns up as images and PDFs, and occasionally as a Word or Excel file. */
const ALLOWED_TYPES = /^(image\/|application\/pdf$|application\/msword$|application\/vnd\.(ms-excel|ms-word|openxmlformats-officedocument\.))/;

/** Extension taken from the uploaded name but never trusted as a path segment. */
function safeExtension(fileName: string): string {
  return (fileName.match(/\.([a-zA-Z0-9]{1,8})$/)?.[1] ?? "bin").toLowerCase();
}

export async function uploadLocationDocuments(
  locationId: number,
  formData: FormData
): Promise<string | null> {
  await requirePermission("locations");
  const supabase = await createClient();

  const files = (formData.getAll("documents") as File[]).filter((file) => file.size > 0);
  if (!files.length) return "Please select at least one document.";

  for (const file of files) {
    if (!ALLOWED_TYPES.test(file.type)) {
      return `"${file.name}" is not an image, PDF or Office document.`;
    }
    if (file.size > MAX_BYTES) {
      return `"${file.name}" exceeds the 20 MB limit.`;
    }
  }

  const errors: string[] = [];

  for (const file of files) {
    const storagePath = `${locationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExtension(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      errors.push(`Upload failed for "${file.name}": ${uploadError.message}`);
      continue;
    }

    const { error: dbError } = await supabase.from("location_documents").insert({
      location_id: locationId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });

    if (dbError) {
      // Drop the orphaned object so storage stays in step with the table.
      await supabase.storage.from(BUCKET).remove([storagePath]);
      errors.push(`Saving "${file.name}" failed: ${dbError.message}`);
    }
  }

  revalidatePath(`/dashboard/locations/${locationId}`);

  return errors.length ? errors.join(" | ") : null;
}

export async function deleteLocationDocument(
  documentId: number,
  storagePath: string,
  locationId: number
): Promise<void> {
  await requirePermission("locations");
  const supabase = await createClient();

  await supabase.storage.from(BUCKET).remove([storagePath]);
  await supabase.from("location_documents").delete().eq("id", documentId);

  revalidatePath(`/dashboard/locations/${locationId}`);
}
