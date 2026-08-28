"use client";

import { useRef, useState, useTransition } from "react";
import { uploadLocationDocuments, deleteLocationDocument } from "@/actions/documents";
import { DeleteConfirmModal } from "@/app/dashboard/components/DeleteConfirmModal";
import { formatDate } from "@/lib/utils";
import type { LocationDocument } from "@/lib/supabase/types";

interface Props {
  locationId: number;
  documents: LocationDocument[];
  /** Short-lived signed URLs keyed by storage path — the bucket is private. */
  urls: Record<string, string>;
}

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

export function LocationDocumentsTab({ locationId, documents, urls }: Props) {
  const [uploading, startUpload] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<LocationDocument | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSelected(Array.from(event.target.files ?? []).map((file) => file.name));
    setError(null);
    setSuccess(false);
  }

  function handleUpload() {
    const files = inputRef.current?.files;
    if (!files?.length) return;

    const data = new FormData();
    Array.from(files).forEach((file) => data.append("documents", file));

    startUpload(async () => {
      setError(null);
      const message = await uploadLocationDocuments(locationId, data);
      if (message) {
        setError(message);
        return;
      }
      setSuccess(true);
      setSelected([]);
      formRef.current?.reset();
    });
  }

  function handleDelete() {
    const target = pendingDelete;
    if (!target) return;
    startDelete(async () => {
      await deleteLocationDocument(target.id, target.storage_path, locationId);
      setPendingDelete(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-slate-100">Upload Legal Documents</h3>
        <p className="mb-4 text-xs text-slate-500">
          Land agreements, NOCs, ownership papers and tax receipts for this site. Only signed-in dashboard users can open them.
        </p>

        <form ref={formRef}>
          <label
            htmlFor="doc-upload"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-8 transition-colors hover:border-amber-400 hover:bg-amber-50/40 dark:border-slate-600 dark:hover:border-amber-400 dark:hover:bg-amber-400/5"
          >
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Click to select documents</p>
            <p className="text-xs text-slate-400">PDF, JPG, PNG, Word or Excel — up to 20 MB each</p>
            <input
              id="doc-upload"
              ref={inputRef}
              type="file"
              name="documents"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              multiple
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>

          {selected.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {selected.map((name) => (
                <li key={name} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <span className="truncate">{name}</span>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Documents uploaded successfully.</p>}

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || selected.length === 0}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                Upload {selected.length > 0 ? `${selected.length} document${selected.length > 1 ? "s" : ""}` : "Documents"}
              </>
            )}
          </button>
        </form>
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
                {["Document", "Type", "Size", "Uploaded", ""].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">No legal documents stored for this location yet.</td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const kind = fileKind(doc.mime_type);
                  const url = urls[doc.storage_path];
                  return (
                    <tr key={doc.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="max-w-xs truncate px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{doc.file_name}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${kind.cls}`}>{kind.label}</span>
                      </td>
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
