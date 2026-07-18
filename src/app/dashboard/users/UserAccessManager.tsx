"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createManagementUser, updateManagementUser } from "@/actions/users";
import type { UserActionState } from "@/actions/users";
import { DASHBOARD_PERMISSIONS, PERMISSION_DETAILS } from "@/lib/permissions";
import type { DashboardPermission, ManagementUser } from "@/lib/permissions";

const initialState: UserActionState = { status: "idle", message: "" };

function StateMessage({ state }: { state: UserActionState }) {
  if (state.status === "idle") return null;
  return (
    <p className={`rounded-lg px-3 py-2 text-xs font-semibold ${state.status === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10" : "bg-red-50 text-red-700 dark:bg-red-500/10"}`}>
      {state.message}
    </p>
  );
}

function PermissionOptions({ defaultPermissions = [] }: { defaultPermissions?: DashboardPermission[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {DASHBOARD_PERMISSIONS.map((permission) => {
        const detail = PERMISSION_DETAILS[permission];
        return (
          <label key={permission} className="group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-500/5">
            <input
              type="checkbox"
              name="permissions"
              value={permission}
              defaultChecked={defaultPermissions.includes(permission)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-amber-500"
            />
            <span className="min-w-0">
              <span className="block text-xs font-bold text-slate-900">{detail.label}</span>
              <span className="mt-1 block text-[10px] leading-4 text-slate-500">{detail.description}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function AddUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createManagementUser, initialState);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Add Management User</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Create a confirmed login and choose exactly which dashboard modules it can access.</p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Custom Access</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="text-xs font-semibold text-slate-600">
          Full Name
          <input name="displayName" required placeholder="e.g. Ayesha Khan" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Email Address
          <input name="email" type="email" required placeholder="name@crownadvertising.com" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Temporary Password
          <input name="password" type="password" minLength={8} required placeholder="Minimum 8 characters" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
        </label>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Dashboard Permissions</p>
        <PermissionOptions />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-[11px] leading-5 text-slate-500">The password is not shown again. Share it securely and ask the user to sign in at the normal login page.</p>
        <div className="flex items-center gap-3">
          <StateMessage state={state} />
          <button disabled={pending} type="submit" className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? "Creating User…" : "Create User"}
          </button>
        </div>
      </div>
    </form>
  );
}

function CustomUserEditor({ user }: { user: ManagementUser }) {
  const [editing, setEditing] = useState(false);
  const actionWithId = updateManagementUser.bind(null, user.id);
  const [state, action, pending] = useActionState(actionWithId, initialState);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white dark:bg-slate-700">
            {(user.displayName || user.email)[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{user.displayName || user.email.split("@")[0]}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">Custom Access</span>
          <button type="button" onClick={() => setEditing((value) => !value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-amber-300 hover:text-amber-700">
            {editing ? "Cancel" : "Edit Permissions"}
          </button>
        </div>
      </div>

      {!editing && (
        <div className="mt-4 flex flex-wrap gap-2">
          {user.permissions.map((permission) => (
            <span key={permission} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10">{PERMISSION_DETAILS[permission].label}</span>
          ))}
        </div>
      )}

      {editing && (
        <form action={action} className="mt-5 border-t border-slate-100 pt-5">
          <label className="block max-w-sm text-xs font-semibold text-slate-600">
            Display Name
            <input name="displayName" required defaultValue={user.displayName ?? ""} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
          </label>
          <div className="mt-4"><PermissionOptions defaultPermissions={user.permissions} /></div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <StateMessage state={state} />
            <button disabled={pending} type="submit" className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">
              {pending ? "Saving…" : "Save Permissions"}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

export function UserAccessManager({ users }: { users: ManagementUser[] }) {
  const superAdmins = users.filter((user) => user.role === "super_admin");
  const customUsers = users.filter((user) => user.role === "custom");

  return (
    <div className="space-y-6">
      <AddUserForm />

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Management Team</h2>
            <p className="mt-1 text-xs text-slate-500">Review roles and revise custom dashboard access.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{users.length} user{users.length === 1 ? "" : "s"}</span>
        </div>

        <div className="space-y-3">
          {superAdmins.map((user) => (
            <article key={user.id} className="relative overflow-hidden rounded-2xl border border-amber-200 bg-white p-5">
              <span className="absolute inset-y-0 left-0 w-1 bg-amber-400" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400 text-sm font-bold text-slate-950">{(user.displayName || user.email)[0].toUpperCase()}</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{user.displayName || user.email.split("@")[0]}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">Super Admin</span>
                  <p className="mt-2 text-[10px] text-slate-500">Full access · User management</p>
                </div>
              </div>
            </article>
          ))}
          {customUsers.map((user) => <CustomUserEditor key={user.id} user={user} />)}
        </div>
      </section>
    </div>
  );
}
