import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DashboardPermission, ManagementAccess, ManagementRole } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";

interface ManagementProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  role: ManagementRole;
  permissions: DashboardPermission[];
}

export async function getCurrentAccess(): Promise<ManagementAccess | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("management_users")
    .select("id, email, display_name, role, permissions")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ManagementProfileRow | null;
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    role: profile.role,
    permissions: profile.permissions ?? [],
  };
}

export async function requirePermission(permission: DashboardPermission): Promise<ManagementAccess> {
  const access = await getCurrentAccess();
  if (!access || !canAccess(access, permission)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return access;
}

export async function requireSuperAdmin(): Promise<ManagementAccess> {
  const access = await getCurrentAccess();
  if (!access || access.role !== "super_admin") {
    throw new Error("Only a Super Admin can perform this action.");
  }
  return access;
}
