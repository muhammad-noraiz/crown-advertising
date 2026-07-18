"use client";

import { useState } from "react";

type DocumentKind = "invoice" | "receipt";

interface Props {
  invoiceId: number;
  invoiceNo: string;
  clientName: string;
  clientEmail?: string | null;
  outstanding: number;
  paidAmount: number;
  cancelled?: boolean;
}

function documentDetails(kind: DocumentKind, invoiceNo: string, outstanding: number) {
  if (kind === "receipt") {
    return {
      title: "Payment receipt",
      subject: `Crown Advertising - Payment Receipt ${invoiceNo}`,
      message: `Payment against invoice ${invoiceNo} has been recorded by Crown Advertising. Please keep the attached receipt for your records.`,
      fileName: `payment-receipt-${invoiceNo}.pdf`,
    };
  }
  return {
    title: "Payment request",
    subject: `Crown Advertising - Invoice ${invoiceNo}`,
    message: `Please find the Crown Advertising invoice ${invoiceNo}. The current amount due is PKR ${Math.round(outstanding).toLocaleString("en-PK")}.`,
    fileName: `payment-request-${invoiceNo}.pdf`,
  };
}

export function InvoiceDocumentActions({ invoiceId, invoiceNo, clientName, clientEmail, outstanding, paidAmount, cancelled = false }: Props) {
  const [busy, setBusy] = useState<DocumentKind | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function shareDocument(kind: DocumentKind) {
    setBusy(kind);
    setNotice(null);
    const details = documentDetails(kind, invoiceNo, outstanding);
    const url = `/api/invoices/${invoiceId}/pdf?document=${kind}`;
    try {
      const response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? "Could not generate this document.");
      }
      const blob = await response.blob();
      const file = new File([blob], details.fileName, { type: "application/pdf" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: details.subject, text: details.message, files: [file] });
        setNotice(`${details.title} shared.`);
        return;
      }

      const link = window.document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = details.fileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);

      if (clientEmail) {
        const body = `Dear ${clientName},\n\n${details.message}\n\nThe PDF has been downloaded. Please attach it to this email before sending.\n\nRegards,\nCrown Advertising`;
        window.location.href = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(details.subject)}&body=${encodeURIComponent(body)}`;
        setNotice("PDF downloaded and email draft opened.");
      } else {
        setNotice("PDF downloaded. Add a client email to open an addressed draft automatically.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice(error instanceof Error ? error.message : "Could not prepare this document.");
    } finally {
      setBusy(null);
    }
  }

  if (cancelled || (outstanding <= 0 && paidAmount <= 0)) return null;

  return (
    <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Client documents</p>
          <p className="mt-1 text-xs text-slate-500">Download a PDF or share it through Mail, WhatsApp and other supported apps.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {outstanding > 0 && (
            <>
              <a href={`/api/invoices/${invoiceId}/pdf?document=invoice`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 text-[11px] font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
                <DocumentIcon /> Invoice PDF
              </a>
              <button type="button" onClick={() => shareDocument("invoice")} disabled={busy !== null} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-400 px-3 text-[11px] font-bold text-slate-950 transition hover:bg-amber-300 disabled:opacity-50">
                <ShareIcon /> {busy === "invoice" ? "Preparing..." : "Send request"}
              </button>
            </>
          )}
          {paidAmount > 0 && (
            <>
              <a href={`/api/invoices/${invoiceId}/pdf?document=receipt`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
                <DocumentIcon /> Receipt PDF
              </a>
              <button type="button" onClick={() => shareDocument("receipt")} disabled={busy !== null} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
                <ShareIcon /> {busy === "receipt" ? "Preparing..." : "Send receipt"}
              </button>
            </>
          )}
        </div>
      </div>
      {notice && <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{notice}</p>}
    </div>
  );
}

function DocumentIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>;
}

function ShareIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.5-4.4M8.2 13.2l7.5 4.4" /></svg>;
}
