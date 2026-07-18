"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/access";
import { DASHBOARD_PERMISSIONS, isDashboardPermission } from "@/lib/permissions";
import type { DashboardPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export interface UserActionState {
  status: "idle" | "success" | "error";
  message: string;
}

function selectedPermissions(formData: FormData): DashboardPermission[] {
  return formData
    .getAll("permissions")
    .map(String)
    .filter(isDashboardPermission);
}

export async function createManagementUser(
  _previousState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const creator = await requireSuperAdmin();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const permissions = selectedPermissions(formData);

  if (!displayName || !email || !email.includes("@")) {
    return { status: "error", message: "Name and a valid email address are required." };
  }
  if (password.length < 8) {
    return { status: "error", message: "The temporary password must contain at least 8 characters." };
  }
  if (permissions.length === 0) {
    return { status: "error", message: "Select at least one dashboard permission." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (error || !data.user) {
    return { status: "error", message: error?.message ?? "Unable to create the user." };
  }

  const { error: profileError } = await admin
    .from("management_users")
    .update({
      email,
      display_name: displayName,
      role: "custom",
      permissions,
      created_by: creator.id,
    })
    .eq("id", data.user.id);

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { status: "error", message: `The login was rolled back because permissions could not be saved: ${profileError.message}` };
  }

  revalidatePath("/dashboard/users");
  return { status: "success", message: `${displayName} can now sign in with the selected permissions.` };
}

export async function updateManagementUser(
  userId: string,
  _previousState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await requireSuperAdmin();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const permissions = selectedPermissions(formData);

  if (!displayName) return { status: "error", message: "A display name is required." };
  if (permissions.length === 0) return { status: "error", message: "Select at least one dashboard permission." };
  if (permissions.some((permission) => !DASHBOARD_PERMISSIONS.includes(permission))) {
    return { status: "error", message: "One or more permissions are invalid." };
  }

  const admin = createAdminClient();
  const { data: target } = await admin.from("management_users").select("role").eq("id", userId).maybeSingle();
  if (!target) return { status: "error", message: "User profile not found." };
  if (target.role === "super_admin") return { status: "error", message: "Super Admin access cannot be changed here." };

  const { error } = await admin
    .from("management_users")
    .update({ display_name: displayName, permissions })
    .eq("id", userId);

  if (error) return { status: "error", message: error.message };

  await admin.auth.admin.updateUserById(userId, { user_metadata: { display_name: displayName } });
  revalidatePath("/dashboard/users");
  return { status: "success", message: "Permissions updated." };
}
