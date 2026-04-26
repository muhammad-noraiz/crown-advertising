"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClient_(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const name = (formData.get("name") as string)?.trim();
  const company = (formData.get("company") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) return "Client name is required.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .insert({ name, company, phone, email, address, notes });

  if (error) return error.message;

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");
  return "ok";
}

export async function updateClient(
  id: number,
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const name = (formData.get("name") as string)?.trim();
  const company = (formData.get("company") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) return "Client name is required.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ name, company, phone, email, address, notes })
    .eq("id", id);

  if (error) return error.message;

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return "ok";
}

export async function deleteClient(id: number) {
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");
  redirect("/dashboard/clients");
}
