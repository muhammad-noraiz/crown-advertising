import type { ReactNode } from "react";

type HeroIcon = "location" | "booking" | "client" | "detail";
type MetricTone = "amber" | "blue" | "emerald" | "red" | "slate";

const heroPaths: Record<HeroIcon, ReactNode> = {
  location: <><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></>,
  booking: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6" /></>,
  client: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 8h5M18.5 5.5v5" /></>,
  detail: <><path d="M4 19V9l8-5 8 5v10" /><path d="M8 19v-6h8v6M2 19h20" /></>,
};

const toneClasses: Record<MetricTone, { icon: string; line: string }> = {
  amber: { icon: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300", line: "bg-amber-400" },
  blue: { icon: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300", line: "bg-blue-500" },
  emerald: { icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300", line: "bg-emerald-500" },
  red: { icon: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300", line: "bg-red-500" },
  slate: { icon: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300", line: "bg-slate-400" },
};

function Icon({ type, className = "h-5 w-5" }: { type: HeroIcon; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">{heroPaths[type]}</svg>;
}

export function ManagementPageHero({
  eyebrow,
  title,
  description,
  icon,
  actions,
  meta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: HeroIcon;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0b1323] p-6 text-white shadow-[0_24px_70px_-38px_rgba(15,23,42,.9)] lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-amber-300">
              <Icon type={icon} />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">{eyebrow}</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
          {meta && <div className="mt-5 flex flex-wrap gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  );
}

export function ManagementMetric({
  label,
  value,
  detail,
  tone = "slate",
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: MetricTone;
  icon: HeroIcon;
}) {
  const classes = toneClasses[tone];
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_-30px_rgba(15,23,42,.8)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-30px_rgba(15,23,42,.8)] dark:border-slate-700">
      <span className={`absolute inset-x-0 top-0 h-1 ${classes.line}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${classes.icon}`}><Icon type={icon} /></span>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  );
}
