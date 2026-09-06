import Link from "next/link";
import { getAlerts } from "@/lib/alerts-data";
import { ALERT_WINDOW_DAYS, type Alert } from "@/lib/alerts";
import { documentTypeLabel } from "@/lib/documents";
import { formatDate } from "@/lib/utils";
import { ManagementMetric, ManagementPageHero } from "@/app/dashboard/components/ManagementPage";

function money(value: number) {
  return `PKR ${Math.round(value).toLocaleString()}`;
}

function whenLabel(daysLeft: number): string {
  if (daysLeft === 0) return "today";
  if (daysLeft === 1) return "tomorrow";
  if (daysLeft === -1) return "yesterday";
  return daysLeft > 0 ? `in ${daysLeft} days` : `${Math.abs(daysLeft)} days ago`;
}

function describe(alert: Alert) {
  if (alert.kind === "document") {
    const type = documentTypeLabel[alert.documentType] ?? "Document";
    return {
      title: alert.severity === "overdue" ? `${type} expired ${whenLabel(alert.daysLeft)}` : `${type} expires ${whenLabel(alert.daysLeft)}`,
      subtitle: `${alert.fileName} · ${alert.locationName}`,
      meta: `Valid until ${formatDate(alert.date)}`,
      href: `/dashboard/locations/${alert.locationId}?tab=documents`,
      tag: "Legal document",
    };
  }
  return {
    title: alert.severity === "overdue" ? `Invoice ${alert.invoiceNo} was due ${whenLabel(alert.daysLeft)}` : `Invoice ${alert.invoiceNo} due ${whenLabel(alert.daysLeft)}`,
    subtitle: `${alert.clientName} · ${alert.locationName}`,
    meta: `${money(alert.outstanding)} outstanding · due ${formatDate(alert.date)}`,
    href: `/dashboard/bookings?q=${encodeURIComponent(alert.clientName)}`,
    tag: "Payment",
  };
}

export default async function AlertsPage() {
  const alerts = await getAlerts();
  const overdue = alerts.filter((alert) => alert.severity === "overdue");
  const documentCount = alerts.filter((alert) => alert.kind === "document").length;
  const outstanding = alerts.reduce((sum, alert) => sum + (alert.kind === "invoice" ? alert.outstanding : 0), 0);

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 pb-10">
      <ManagementPageHero
        eyebrow="Compliance & collections"
        title="Alerts"
        description={`Legal paperwork about to lapse and invoices about to fall due. Everything within ${ALERT_WINDOW_DAYS} days, plus anything already past its date.`}
        icon="detail"
        meta={<>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-slate-300">{alerts.length} open alert{alerts.length === 1 ? "" : "s"}</span>
          {overdue.length > 0 && (
            <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-[11px] font-semibold text-red-200">{overdue.length} past due</span>
          )}
        </>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagementMetric label="Past due" value={String(overdue.length)} detail="Expired papers and missed payments" tone={overdue.length > 0 ? "red" : "emerald"} icon="detail" />
        <ManagementMetric label="Due this week" value={String(alerts.length - overdue.length)} detail={`Within the next ${ALERT_WINDOW_DAYS} days`} tone="amber" icon="booking" />
        <ManagementMetric label="Documents expiring" value={String(documentCount)} detail="NOCs, certificates, agreements, tax papers" tone="blue" icon="location" />
        <ManagementMetric label="Payments at risk" value={money(outstanding)} detail="Outstanding on the invoices listed" tone={outstanding > 0 ? "red" : "slate"} icon="client" />
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <h2 className="font-bold text-slate-950 dark:text-slate-50">Alert Feed</h2>
          <span className="text-sm text-slate-400">Most urgent first</span>
        </div>

        {alerts.length === 0 ? (
          <p className="px-6 py-12 text-center text-slate-400">
            Nothing expires or falls due in the next {ALERT_WINDOW_DAYS} days.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {alerts.map((alert) => {
              const info = describe(alert);
              const overdueAlert = alert.severity === "overdue";
              return (
                <li key={`${alert.kind}-${alert.id}`}>
                  <Link href={info.href} className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${overdueAlert ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        {alert.kind === "document" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        )}
                      </svg>
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{info.title}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${overdueAlert ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {overdueAlert ? "Past due" : "Due soon"}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{info.tag}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{info.subtitle}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{info.meta}</p>
                    </div>

                    <svg className="mt-2 h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
