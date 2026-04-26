"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ExpenseType } from "@/lib/supabase/types";

export async function createExpense(
  locationId: number,
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const expense_type = (formData.get("expenseType") as ExpenseType);
  const amount = parseFloat(formData.get("amount") as string);
  const expense_date = formData.get("expenseDate") as string;
  const is_recurring = formData.get("isRecurring") === "true";
  const description = (formData.get("description") as string)?.trim() || null;

  if (!expense_type || !amount || !expense_date) {
    return "Type, amount, and date are required.";
  }
  if (isNaN(amount) || amount <= 0) return "Amount must be a positive number.";

  const supabase = await createClient();
  const { error } = await supabase.from("location_expenses").insert({
    location_id: locationId,
    expense_type,
    amount,
    expense_date,
    is_recurring,
    description,
  });

  if (error) return error.message;

  revalidatePath(`/dashboard/locations/${locationId}`);
  revalidatePath("/dashboard/accounts");
  return "ok";
}

export async function updateExpense(
  id: number,
  locationId: number,
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const expense_type = (formData.get("expenseType") as ExpenseType);
  const amount = parseFloat(formData.get("amount") as string);
  const expense_date = formData.get("expenseDate") as string;
  const is_recurring = formData.get("isRecurring") === "true";
  const description = (formData.get("description") as string)?.trim() || null;

  if (!expense_type || !amount || !expense_date) {
    return "Type, amount, and date are required.";
  }
  if (isNaN(amount) || amount <= 0) return "Amount must be a positive number.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("location_expenses")
    .update({ expense_type, amount, expense_date, is_recurring, description })
    .eq("id", id);

  if (error) return error.message;

  revalidatePath(`/dashboard/locations/${locationId}`);
  revalidatePath("/dashboard/accounts");
  return "ok";
}

export async function deleteExpense(id: number, locationId: number) {
  const supabase = await createClient();
  await supabase.from("location_expenses").delete().eq("id", id);
  revalidatePath(`/dashboard/locations/${locationId}`);
  revalidatePath("/dashboard/accounts");
}
