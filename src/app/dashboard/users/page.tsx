import { requireSuperAdmin } from "@/lib/auth/access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ManagementUser } from "@/lib/permissions";
import type { DashboardPermission, ManagementRole } from "@/lib/supabase/types";
import { UserAccessManager } from "./UserAccessManager";

interface ManagementUserRow {
  id: string;
  email: string;
  display_name: string | null;
  role: ManagementRole;
  permissions: DashboardPermission[];
  created_at: string;
  updated_at: string;
}

export default async function UserAccessPage() {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("management_users")
    .select("id, email, display_name, role, permissions, created_at, updated_at")
    .order("created_at");

  if (error) throw new Error(`Unable to load management users: ${error.message}`);

  const users: ManagementUser[] = ((data ?? []) as ManagementUserRow[]).map((user) => ({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    permissions: user.permissions,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }));

  const customUserCount = users.filter((user) => user.role === "custom").length;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1323] p-6 text-white shadow-[0_24px_70px_-38px_rgba(15,23,42,.9)] lg:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Super Admin Control
            </div>
            <h1 className="text-3xl font-bold tracking-tight">User Access</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Create management logins and give each person only the dashboard access required for their role.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Users</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
              <p className="text-2xl font-bold text-amber-300">{customUserCount}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Roles</p>
            </div>
          </div>
        </div>
      </section>

      <UserAccessManager users={users} />
    </div>
  );
}
