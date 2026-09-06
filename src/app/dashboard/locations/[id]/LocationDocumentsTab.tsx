"use client";

import { useState, useTransition } from "react";
import { deleteLocationDocument } from "@/actions/documents";
import { DeleteConfirmModal } from "@/app/dashboard/components/DeleteConfirmModal";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { ALERT_WINDOW_DAYS, daysUntil } from "@/lib/alerts";
import { documentTypeLabel } from "@/lib/documents";
import { formatDate } from "@/lib/utils";
import type { LocationDocument } from "@/lib/supabase/types";

interface Props {
  locationId: number;
  documents: LocationDocument[];
  /** Short-lived signed URLs keyed by storage path — the bucket is private. */
  urls: Record<string, string>;
}

const typeBadge: Record<string, string> = {
  noc: "bg-purple-100 text-purple-700",
  stability_certificate: "bg-blue-100 text-blue-700",
  rental: "bg-emerald-100 text-emerald-700",
  tax: "bg-amber-100 text-amber-700",
  other: "bg-slate-100 text-slate-600",
};

function fileKind(mimeType: string): { label: string; cls: string } {
  if (mimeType === "application/pdf") return { label: "PDF", cls: "bg-red-100 text-red-700" };
  if (mimeType.startsWith("image/")) return { label: "Image", cls: "bg-blue-100 text-blue-700" };
  if (/word/.test(mimeType)) return { label: "Word", cls: "bg-indigo-100 text-indigo-700" };
  if (/sheet|excel/.test(mimeType)) return { label: "Excel", cls: "bg-emerald-100 text-emerald-700" };
  return { label: "File", cls: "bg-slate-100 text-slate-600" };
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit > 0 && value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

function Validity({ validFrom, validUntil }: { validFrom: string | null; validUntil: string | null }) {
  if (!validUntil) {
    return <span className="text-xs text-slate-400">{validFrom ? `From ${formatDate(validFrom)}` : "No expiry"}</span>;
  }

  const daysLeft = daysUntil(validUntil);
  const tone =
    daysLeft < 0 ? "bg-red-100 text-red-700"
    : daysLeft <= ALERT_WINDOW_DAYS ? "bg-amber-100 text-amber-700"
    : "bg-slate-100 text-slate-600";
  const note =
    daysLeft < 0 ? `Expired ${formatDate(validUntil)}`
    : daysLeft === 0 ? "Expires today"
    : daysLeft <= ALERT_WINDOW_DAYS ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
    : `Until ${formatDate(validUntil)}`;

  return (
    <div>
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{note}</span>
      {validFrom && <p className="mt-0.5 text-[11px] text-slate-400">From {formatDate(validFrom)}</p>}
    </div>
  );
}

export function LocationDocumentsTab({ locationId, documents, urls }: Props) {
  const [deleting, startDelete] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<LocationDocument | null>(null);

  function handleDelete() {
    const target = pendingDelete;
    if (!target) return;
    startDelete(async () => {
      await deleteLocationDocument(target.id, target.storage_path, locationId);
      setPendingDelete(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {documents.filter((doc) => doc.valid_until).length} with a validity period ·{" "}
          {documents.filter((doc) => !doc.valid_until).length} without
        </p>
        <UploadDocumentModal locationId={locationId} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <h3 className="font-bold text-slate-950 dark:text-slate-50">Document Library</h3>
          <span className="text-sm text-slate-400">{documents.length} document{documents.length === 1 ? "" : "s"}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
                {["Document", "Category", "File", "Validity", "Size", "Uploaded", ""].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">No legal documents stored for this location yet.</td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const kind = fileKind(doc.mime_type);
                  const url = urls[doc.storage_path];
                  return (
                    <tr key={doc.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="max-w-xs truncate px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{doc.file_name}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge[doc.document_type] ?? typeBadge.other}`}>
                          {documentTypeLabel[doc.document_type] ?? "Other"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full whitespace-nowrap px-2 py-0.5 text-xs font-medium ${kind.cls}`}>{kind.label}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3"><Validity validFrom={doc.valid_from} validUntil={doc.valid_until} /></td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatBytes(doc.size_bytes)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDate(doc.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-500"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                              Open
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">Link unavailable</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setPendingDelete(doc)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-400"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmModal
        open={pendingDelete !== null}
        title="Delete Document"
        description={`"${pendingDelete?.file_name ?? ""}" will be permanently removed from storage.`}
        confirmLabel="Delete Document"
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
