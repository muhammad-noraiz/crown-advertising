import Link from "next/link";
import { getCurrentAccess } from "@/lib/auth/access";
import { firstAllowedPath } from "@/lib/permissions";

export default async function AccessDeniedPage() {
  const access = await getCurrentAccess();
  const returnPath = access ? firstAllowedPath(access) : "/login";

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_70px_-42px_rgba(15,23,42,.8)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Dashboard Access Required</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {access
            ? "Your account does not currently have permission to open this dashboard section. Ask the Super Admin to update your access."
            : "Your management profile is not ready yet. Ask the Super Admin to confirm your account setup."}
        </p>
        <Link href={returnPath} className="mt-6 inline-flex rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300">
          {access && returnPath !== "/dashboard/access-denied" ? "Open My Dashboard" : "Return to Login"}
        </Link>
      </section>
    </div>
  );
}
