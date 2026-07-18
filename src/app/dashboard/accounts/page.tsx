import Link from "next/link";
import { accountPresetRanges, getAccountReport } from "@/lib/account-report";
import { AccountsReportControls } from "./AccountsReportControls";

function money(value: number): string {
  return `PKR ${Math.round(value).toLocaleString("en-PK")}`;
}

function compactMoney(value: number): string {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (absolute >= 1_000_000) return `${sign}PKR ${(absolute / 1_000_000).toFixed(absolute >= 10_000_000 ? 0 : 1)}m`;
  if (absolute >= 100_000) return `${sign}PKR ${(absolute / 1_000).toFixed(0)}k`;
  return money(value);
}

function percentageChange(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function Delta({ current, previous, inverse = false }: { current: number; previous?: number; inverse?: boolean }) {
  const change = percentageChange(current, previous);
  if (previous === undefined) return <span className="text-[11px] font-medium text-slate-400">No comparison</span>;
  if (change === null) return <span className="text-[11px] font-medium text-slate-400">No prior activity</span>;

  const improving = inverse ? change <= 0 : change >= 0;
  const arrow = change >= 0 ? "↗" : "↘";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${improving ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {arrow} {Math.abs(change).toFixed(1)}%
    </span>
  );
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="m4 16 5-5 4 4 7-8M15 7h5v5" />
    </svg>
  );
}

function presetHref(range: { from: string; to: string }, compare: string, preset: string, showAllLocations: boolean): string {
  const params = new URLSearchParams({ from: range.from, to: range.to, compare, preset });
  if (showAllLocations) params.set("view", "all");
  return `/dashboard/accounts?${params.toString()}`;
}

const stateStyles = {
  Overdue: "bg-red-50 text-red-700 ring-red-100",
  "Due soon": "bg-amber-50 text-amber-700 ring-amber-100",
  Partial: "bg-blue-50 text-blue-700 ring-blue-100",
  Pending: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; compare?: string; view?: string; preset?: string }>;
}) {
  const params = await searchParams;
  const report = await getAccountReport(params);
  const presets = accountPresetRanges();
  const quickPresets = [
    { key: "thisMonth", label: "This Month", range: presets.thisMonth },
    { key: "lastMonth", label: "Last Month", range: presets.lastMonth },
    { key: "thisQuarter", label: "This Quarter", range: presets.thisQuarter },
    { key: "thisYear", label: "This Year", range: presets.thisYear },
  ] as const;
  const activePreset = quickPresets.find(({ key, range }) =>
    params.preset === key && report.range.from === range.from && report.range.to === range.to
  )?.key;
  const exportHref = `/api/accounts/export?from=${report.range.from}&to=${report.range.to}&compare=${report.compareMode}`;
  const comparisonRows = [
    { label: "Booked sales", current: report.metrics.bookedSales, previous: report.comparison?.bookedSales, color: "bg-amber-400" },
    { label: "Invoiced", current: report.metrics.invoicedSales, previous: report.comparison?.invoicedSales, color: "bg-blue-500" },
    { label: "Cash received", current: report.metrics.cashReceived, previous: report.comparison?.cashReceived, color: "bg-emerald-500" },
    { label: "Net cash", current: report.metrics.netCash, previous: report.comparison?.netCash, color: "bg-slate-900" },
  ];
  const comparisonMax = Math.max(
    1,
    ...comparisonRows.flatMap((row) => [Math.abs(row.current), Math.abs(row.previous ?? 0)])
  );
  const showAllLocations = params.view === "all";
  const activeLocationRows = report.locationPerformance.filter((row) =>
    row.activeBookings > 0
      || row.bookedSales !== 0
      || row.invoicedSales !== 0
      || row.cashReceived !== 0
      || row.expenses !== 0
      || row.outstanding !== 0
  );
  const visibleLocationRows = showAllLocations ? report.locationPerformance : activeLocationRows;
  const locationViewParams = new URLSearchParams({
    from: report.range.from,
    to: report.range.to,
    compare: report.compareMode,
  });
  if (!showAllLocations) locationViewParams.set("view", "all");
  if (activePreset) locationViewParams.set("preset", activePreset);
  const locationViewHref = `/dashboard/accounts?${locationViewParams.toString()}`;

  const kpis = [
    {
      label: "Booked sales",
      value: report.metrics.bookedSales,
      previous: report.comparison?.bookedSales,
      detail: `${report.metrics.bookingCount} new contract${report.metrics.bookingCount === 1 ? "" : "s"}`,
      accent: "bg-amber-400",
      valueClass: "text-slate-950 dark:text-slate-50",
    },
    {
      label: "Invoiced sales",
      value: report.metrics.invoicedSales,
      previous: report.comparison?.invoicedSales,
      detail: `${report.metrics.invoiceCount} invoice${report.metrics.invoiceCount === 1 ? "" : "s"} due in period`,
      accent: "bg-blue-500",
      valueClass: "text-blue-700",
    },
    {
      label: "Cash received",
      value: report.metrics.cashReceived,
      previous: report.comparison?.cashReceived,
      detail: report.paymentHistoryAvailable ? `${report.periodPayments.length} payment entries` : "Based on latest invoice payments",
      accent: "bg-emerald-500",
      valueClass: "text-emerald-700",
    },
    {
      label: "Net cash",
      value: report.metrics.netCash,
      previous: report.comparison?.netCash,
      detail: `After ${money(report.metrics.expenses)} expenses`,
      accent: report.metrics.netCash >= 0 ? "bg-slate-950" : "bg-red-500",
      valueClass: report.metrics.netCash >= 0 ? "text-slate-950 dark:text-slate-50" : "text-red-700",
    },
  ];

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 pb-10">
      <section className="relative overflow-visible rounded-2xl bg-[#0c1424] text-white shadow-[0_20px_55px_-35px_rgba(15,23,42,0.7)]">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative p-5 lg:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight lg:text-[28px]">Accounts</h1>
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
                  {report.rangeLabel}
                </span>
              </div>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Sales, invoices, collections, expenses and receivables in one view.
              </p>
            </div>
            <a
              href={exportHref}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_8px_24px_-12px_rgba(251,191,36,.75)] transition hover:-translate-y-0.5 hover:bg-amber-300"
            >
              <ExportIcon /> Export Excel
            </a>
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <AccountsReportControls
              key={`${report.range.from}:${report.range.to}`}
              from={report.range.from}
              to={report.range.to}
              compare={report.compareMode}
              showAllLocations={showAllLocations}
              preset={activePreset}
            />
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="mr-1 text-slate-500">Quick Filters</span>
              {quickPresets.map(({ key, label, range }) => {
                const isActive = activePreset === key;
                return (
                  <Link
                    key={key}
                    href={presetHref(range, report.compareMode, key, showAllLocations)}
                    aria-current={isActive ? "page" : undefined}
                    data-active={isActive ? "true" : undefined}
                    className={`rounded-full border px-2.5 py-1 font-semibold transition ${
                      isActive
                        ? "border-amber-300 bg-amber-300 text-slate-950 shadow-[0_5px_16px_-8px_rgba(252,211,77,.9)]"
                        : "border-white/10 text-slate-400 hover:border-white/25 hover:bg-white/[0.05] hover:text-slate-200"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_-28px_rgba(15,23,42,.65)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-28px_rgba(15,23,42,.65)]">
            <span className={`absolute inset-x-0 top-0 h-1 ${kpi.accent}`} />
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{kpi.label}</p>
              <Delta current={kpi.value} previous={kpi.previous} />
            </div>
            <p className={`mt-4 text-2xl font-bold tracking-tight 2xl:text-[28px] ${kpi.valueClass}`}>{compactMoney(kpi.value)}</p>
            <p className="mt-2 text-xs text-slate-500">{kpi.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Period expenses", value: report.metrics.expenses, note: `${report.metrics.expenseCount} effective entries`, color: "text-red-700" },
          { label: "Total receivables", value: report.receivableTotals.outstanding, note: `${report.receivableTotals.openInvoices} open invoices`, color: "text-slate-950 dark:text-slate-50" },
          { label: "Overdue now", value: report.receivableTotals.overdue, note: "Needs collection attention", color: "text-red-700" },
          { label: "Crown net share", value: report.metrics.crownNet, note: "After partner percentages", color: report.metrics.crownNet >= 0 ? "text-amber-700" : "text-red-700" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div>
              <p className="text-xs font-semibold text-slate-500">{item.label}</p>
              <p className="mt-1 text-[11px] text-slate-400">{item.note}</p>
            </div>
            <p className={`text-lg font-bold ${item.color}`}>{compactMoney(item.value)}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-900"><TrendIcon /><h2 className="text-lg font-bold tracking-tight">Period comparison</h2></div>
              <p className="mt-1 text-xs text-slate-500">{report.compareLabel ? `${report.rangeLabel} versus ${report.compareLabel}` : "Enable comparison from the date controls above."}</p>
            </div>
            {report.comparison && <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Current / previous</span>}
          </div>
          <div className="mt-7 space-y-5">
            {comparisonRows.map((item) => {
              const currentWidth = `${Math.max(item.current === 0 ? 0 : 4, (Math.abs(item.current) / comparisonMax) * 100)}%`;
              const previousWidth = `${Math.max((item.previous ?? 0) === 0 ? 0 : 4, (Math.abs(item.previous ?? 0) / comparisonMax) * 100)}%`;
              return (
                <div key={item.label} className="grid gap-2 sm:grid-cols-[120px_1fr_105px] sm:items-center">
                  <p className="text-xs font-semibold text-slate-600">{item.label}</p>
                  <div className="space-y-1.5">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.color}`} style={{ width: currentWidth }} /></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-300" style={{ width: previousWidth }} /></div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${item.current < 0 ? "text-red-700" : "text-slate-900"}`}>{compactMoney(item.current)}</p>
                    {item.previous !== undefined && <p className="mt-0.5 text-[10px] text-slate-400">vs {compactMoney(item.previous)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Receivables watch</h2>
              <p className="mt-0.5 text-xs text-slate-500">Largest and most urgent unpaid invoices</p>
            </div>
            <Link href="/dashboard/bookings?payment=outstanding" className="text-xs font-bold text-amber-700 hover:text-amber-600">View ledger →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {report.receivables.slice(0, 6).map((row) => (
              <div key={row.invoice.id} className="grid grid-cols-[1fr_auto] gap-4 px-5 py-3.5 transition hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{row.booking?.client_name ?? "Unknown client"}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${stateStyles[row.state]}`}>{row.state}</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-400">{row.invoice.invoice_no} · {row.location?.name ?? "Unknown location"} · due {row.invoice.due_date}</p>
                </div>
                <p className="self-center text-sm font-bold text-slate-900">{compactMoney(row.outstanding)}</p>
              </div>
            ))}
            {report.receivables.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-emerald-700">All caught up</p>
                <p className="mt-1 text-xs text-slate-400">There are no unpaid invoices.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-end sm:justify-between lg:px-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Location performance</h2>
            <p className="mt-1 text-xs text-slate-500">Cash and sales performance for {report.rangeLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span><b className="mr-1 text-emerald-600">●</b> Cash in</span>
            <span><b className="mr-1 text-red-500">●</b> Cash out</span>
            <span><b className="mr-1 text-amber-500">●</b> Crown share</span>
            <Link href={locationViewHref} className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:border-amber-300 hover:text-amber-700">
              {showAllLocations ? "Show active only" : `Show all ${report.locationPerformance.length}`}
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                {[
                  "Location", "Active", "Booked sales", "Invoiced", "Cash received", "Expenses", "Net cash", "Outstanding", "Crown net",
                ].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500 first:pl-6">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleLocationRows.map((row) => (
                <tr key={row.location.id} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-4 pl-6">
                    <Link href={`/dashboard/locations/${row.location.id}`} className="font-semibold text-slate-900 hover:text-amber-700">{row.location.name}</Link>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">{row.location.size} · {row.location.city}</p>
                  </td>
                  <td className="px-5 py-4"><span className="inline-flex min-w-7 justify-center rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{row.activeBookings}</span></td>
                  <td className="px-5 py-4 font-medium text-slate-700">{money(row.bookedSales)}</td>
                  <td className="px-5 py-4 font-medium text-blue-700">{money(row.invoicedSales)}</td>
                  <td className="px-5 py-4 font-semibold text-emerald-700">{money(row.cashReceived)}</td>
                  <td className="px-5 py-4 font-medium text-red-600">{money(row.expenses)}</td>
                  <td className={`px-5 py-4 font-bold ${row.netCash >= 0 ? "text-slate-900" : "text-red-700"}`}>{money(row.netCash)}</td>
                  <td className="px-5 py-4 font-medium text-slate-600">{money(row.outstanding)}</td>
                  <td className={`px-5 py-4 font-bold ${row.crownNet >= 0 ? "text-amber-700" : "text-red-700"}`}>
                    {money(row.crownNet)}
                    {row.partnerPercentage > 0 && <p className="mt-0.5 text-[10px] font-normal text-slate-400">after {row.partnerPercentage}% partner share</p>}
                  </td>
                </tr>
              ))}
              {visibleLocationRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">No location activity in this reporting period.</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                <td colSpan={2} className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">Period totals</td>
                <td className="px-5 py-4 text-slate-900">{money(report.metrics.bookedSales)}</td>
                <td className="px-5 py-4 text-blue-700">{money(report.metrics.invoicedSales)}</td>
                <td className="px-5 py-4 text-emerald-700">{money(report.metrics.cashReceived)}</td>
                <td className="px-5 py-4 text-red-600">{money(report.metrics.expenses)}</td>
                <td className={report.metrics.netCash >= 0 ? "px-5 py-4 text-slate-900" : "px-5 py-4 text-red-700"}>{money(report.metrics.netCash)}</td>
                <td className="px-5 py-4 text-slate-600">{money(report.metrics.outstanding)}</td>
                <td className={report.metrics.crownNet >= 0 ? "px-5 py-4 text-amber-700" : "px-5 py-4 text-red-700"}>{money(report.metrics.crownNet)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {!report.paymentHistoryAvailable && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          Exact split-payment history will begin after the payment-ledger migration is applied. Until then, cash received is assigned to each invoice&apos;s latest recorded payment date.
        </div>
      )}
    </div>
  );
}
