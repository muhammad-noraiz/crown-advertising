"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  cancelInvoice,
  createInvoice,
  generateInvoiceSchedule,
  recordInvoicePayment,
} from "@/actions/invoices";
import {
  billingTypeLabel,
  getBookingInvoiceStatus,
  getInvoiceStatus,
  getInvoiceTotals,
} from "@/lib/invoices";
import { formatDate, toInputDate } from "@/lib/utils";
import type { Booking, BookingInvoice } from "@/lib/supabase/types";
import { InvoiceDocumentActions } from "./InvoiceDocumentActions";

const statusStyles = {
  NOT_SETUP: { label: "Not set up", cls: "bg-slate-100 text-slate-600" },
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  PARTIAL: { label: "Part paid", cls: "bg-blue-100 text-blue-700" },
  PAID: { label: "Paid", cls: "bg-emerald-100 text-emerald-700" },
  OVERDUE: { label: "Overdue", cls: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-500" },
};

function money(value: number) {
  return `PKR ${Math.round(value).toLocaleString()}`;
}

function SubmitButton({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-not-allowed disabled:opacity-55`}>
      {pending ? "Saving…" : children}
    </button>
  );
}

function useRefreshOnSuccess(state: string | null) {
  const router = useRouter();
  useEffect(() => {
    if (state === "ok") router.refresh();
  }, [router, state]);
}

function GenerateSchedule({ booking }: { booking: Booking }) {
  const actionWithId = generateInvoiceSchedule.bind(null, booking.id);
  const [state, action] = useActionState(actionWithId, null);
  useRefreshOnSuccess(state);

  return (
    <form action={action} className="rounded-2xl border border-dashed border-amber-300 bg-[#fffbeb] p-5 dark:bg-[#211807]">
      <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">Create the {billingTypeLabel(booking.billing_type)} invoice plan</p>
      <p className="mt-1 text-xs leading-5 text-[#475569] dark:text-[#cbd5e1]">
        {booking.billing_type === "monthly"
          ? "The total contract amount will be divided across the booking months. Each month gets its own due date and payment balance."
          : "One invoice will be created for the full contract amount and will be due on the booking end date."}
      </p>
      {state && state !== "ok" && <p className="mt-3 text-xs font-medium text-red-600">{state}</p>}
      <SubmitButton className="mt-4 rounded-lg bg-[#0f172a] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-[#0f172a] dark:hover:bg-amber-300">
        Generate invoice plan
      </SubmitButton>
    </form>
  );
}

function AddInvoiceForm({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const actionWithId = createInvoice.bind(null, booking.id);
  const [state, action] = useActionState(actionWithId, null);
  useRefreshOnSuccess(state);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-700">
        + Add individual invoice
      </button>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">New invoice</p>
          <p className="mt-0.5 text-xs text-slate-500">Use this for adjustments, extensions, or a custom billing period.</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-medium text-slate-500 hover:text-slate-900">Close</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-slate-600">
          Invoice number
          <input name="invoiceNo" placeholder="Auto if blank" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Amount (PKR)
          <input name="amount" type="number" min="1" step="0.01" required className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Due date
          <input name="dueDate" type="date" required defaultValue={toInputDate(booking.end_date)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Notes
          <input name="notes" placeholder="Optional" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Period start
          <input name="periodStart" type="date" defaultValue={toInputDate(booking.start_date)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Period end
          <input name="periodEnd" type="date" defaultValue={toInputDate(booking.end_date)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
        </label>
      </div>
      {state && state !== "ok" && <p className="mt-3 text-xs font-medium text-red-600">{state}</p>}
      <SubmitButton className="mt-4 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-semibold text-slate-900 hover:bg-amber-400">
        Save invoice
      </SubmitButton>
    </form>
  );
}

function PaymentForm({ invoice }: { invoice: BookingInvoice }) {
  const outstanding = Math.max(0, invoice.amount - invoice.paid_amount);
  const actionWithIds = recordInvoicePayment.bind(null, invoice.id, invoice.booking_id);
  const [state, action] = useActionState(actionWithIds, null);
  useRefreshOnSuccess(state);

  return (
    <form action={action} className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800">Record a payment</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Partial payments are added to the amount already received.</p>
        </div>
        <span className="self-start shrink-0 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
          {money(outstanding)} outstanding
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_auto] xl:items-end">
        <label className="block min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Payment amount</span>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[11px] font-semibold text-slate-400">PKR</span>
            <input name="paymentAmount" type="number" min="0.01" max={outstanding} step="0.01" required placeholder={String(outstanding)} className="block h-11 min-w-0 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
          </div>
        </label>
        <label className="block min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Payment date</span>
          <input name="paymentDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1.5 block h-11 min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
        </label>
        <label className="block min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Payment reference</span>
          <input name="paymentReference" placeholder="Cheque, transfer or receipt number" className="mt-1.5 block h-11 min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
        </label>
        <SubmitButton className="h-11 whitespace-nowrap rounded-lg bg-slate-900 px-5 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 sm:col-span-2 xl:col-span-1">
          Record payment
        </SubmitButton>
      </div>
      {state && state !== "ok" && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 ring-1 ring-red-100">{state}</p>}
    </form>
  );
}

interface Props {
  booking: Booking;
  invoices: BookingInvoice[];
  locationName?: string;
  clientEmail?: string | null;
}

export function InvoiceManagerModal({ booking, invoices, locationName, clientEmail }: Props) {
  const [open, setOpen] = useState(false);
  const totals = getInvoiceTotals(invoices);
  const bookingStatus = getBookingInvoiceStatus(invoices);
  const bookingStatusStyle = statusStyles[bookingStatus];
  const sortedInvoices = [...invoices].sort((a, b) => a.due_date.localeCompare(b.due_date));

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-600">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 8h6M9 12h6" strokeLinecap="round" />
        </svg>
        Invoices
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center whitespace-normal p-3 sm:p-6">
          <button type="button" aria-label="Close invoice manager" className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-[#f8fafc] shadow-2xl dark:border-slate-800 dark:bg-[#07101f]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur dark:bg-[#0f172a]/95 sm:px-7">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">Invoice ledger</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${bookingStatusStyle.cls}`}>{bookingStatusStyle.label}</span>
                </div>
                <p className="mt-1 truncate text-sm text-slate-500" title={`${locationName ? `${locationName} · ` : ""}${booking.client_name} · ${billingTypeLabel(booking.billing_type)}`}>
                  {locationName ? `${locationName} · ` : ""}{booking.client_name} · {billingTypeLabel(booking.billing_type)}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Contract value", value: booking.amount, cls: "text-slate-950 dark:text-slate-50" },
                  { label: "Invoiced", value: totals.invoiced, cls: "text-slate-950 dark:text-slate-50" },
                  { label: "Received", value: totals.paid, cls: "text-emerald-700" },
                  { label: "Outstanding", value: totals.outstanding, cls: totals.overdue > 0 ? "text-red-700" : "text-amber-700" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b] dark:text-[#94a3b8]">{item.label}</p>
                    <p className={`mt-2 text-xl font-bold ${item.cls}`}>{money(item.value)}</p>
                  </div>
                ))}
              </div>

              {invoices.length === 0 && <GenerateSchedule booking={booking} />}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Payment schedule</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{invoices.length} invoice{invoices.length === 1 ? "" : "s"} recorded</p>
                </div>
                <AddInvoiceForm booking={booking} />
              </div>

              <div className="space-y-3">
                {sortedInvoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice);
                  const style = statusStyles[status];
                  const outstanding = Math.max(0, invoice.amount - invoice.paid_amount);
                  const progress = invoice.amount > 0 ? Math.min(100, (invoice.paid_amount / invoice.amount) * 100) : 0;
                  return (
                    <article key={invoice.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr_0.9fr_auto] lg:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950 dark:text-slate-50">{invoice.invoice_no}</p>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${style.cls}`}>{style.label}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {invoice.period_start && invoice.period_end ? `${formatDate(invoice.period_start)} – ${formatDate(invoice.period_end)}` : "Custom invoice"}
                          </p>
                          {invoice.notes && <p className="mt-2 text-xs text-slate-500">{invoice.notes}</p>}
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Due date</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(invoice.due_date)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Balance</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">{money(outstanding)}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">of {money(invoice.amount)}</p>
                        </div>
                        {status !== "CANCELLED" && status !== "PAID" && (
                          <form action={cancelInvoice.bind(null, invoice.id, booking.id)}>
                            <button type="submit" className="text-[11px] font-medium text-slate-400 hover:text-red-600">Cancel invoice</button>
                          </form>
                        )}
                      </div>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      {outstanding > 0 && status !== "CANCELLED" && <PaymentForm invoice={invoice} />}
                      {invoice.last_payment_date && (
                        <p className="mt-3 text-[11px] text-slate-400">Last payment {formatDate(invoice.last_payment_date)}{invoice.payment_reference ? ` · ${invoice.payment_reference}` : ""}</p>
                      )}
                      <InvoiceDocumentActions
                        invoiceId={invoice.id}
                        invoiceNo={invoice.invoice_no}
                        clientName={booking.client_name}
                        clientEmail={clientEmail}
                        outstanding={outstanding}
                        paidAmount={invoice.paid_amount}
                        cancelled={status === "CANCELLED"}
                      />
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
