"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadLocationDocuments } from "@/actions/documents";
import { DOCUMENT_TYPES } from "@/lib/documents";

function UploadDocumentForm({ locationId, onClose }: { locationId: number; onClose: () => void }) {
  const router = useRouter();
  const [pending, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  // Held only so the end date's native `min` can follow the start date.
  const [validFrom, setValidFrom] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const files = inputRef.current?.files;
    if (!files?.length) {
      setError("Please select at least one document.");
      return;
    }

    const data = new FormData(event.currentTarget);
    startUpload(async () => {
      setError(null);
      const message = await uploadLocationDocuments(locationId, data);
      if (message) {
        setError(message);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Upload Legal Documents</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Land agreements, NOCs, ownership papers and tax receipts. Only signed-in dashboard users can open them.
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label htmlFor="documentType" className="mb-1.5 block text-sm font-medium text-slate-700">
                Document type <span className="text-red-500">*</span>
              </label>
              <select
                id="documentType"
                name="documentType"
                required
                defaultValue=""
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="" disabled>Select type…</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="doc-upload"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-6 transition-colors hover:border-amber-400 hover:bg-amber-50/40"
              >
                <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p className="text-sm font-medium text-slate-600">Click to select documents</p>
                <p className="text-xs text-slate-400">PDF, JPG, PNG, Word or Excel — up to 20 MB each</p>
                <input
                  id="doc-upload"
                  ref={inputRef}
                  type="file"
                  name="documents"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    setSelected(Array.from(event.target.files ?? []).map((file) => file.name));
                    setError(null);
                  }}
                />
              </label>

              {selected.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {selected.map((name) => (
                    <li key={name} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      <span className="truncate">{name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Validity period <span className="font-normal text-slate-400">(optional)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="validFrom" className="mb-1 block text-xs text-slate-500">Valid from</label>
                  <input
                    id="validFrom"
                    name="validFrom"
                    type="date"
                    value={validFrom}
                    onChange={(event) => setValidFrom(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="validUntil" className="mb-1 block text-xs text-slate-500">Valid until</label>
                  <input
                    id="validUntil"
                    name="validUntil"
                    type="date"
                    min={validFrom || undefined}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Leave empty for paperwork that never expires. Documents with an end date raise an alert a week before they lapse.
              </p>
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</div>}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400 disabled:opacity-60">
                {pending && (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {pending ? "Uploading…" : `Upload ${selected.length > 1 ? `${selected.length} Documents` : "Document"}`}
              </button>
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function UploadDocumentModal({ locationId }: { locationId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        Upload Documents
      </button>
      {isOpen && <UploadDocumentForm locationId={locationId} onClose={() => setIsOpen(false)} />}
    </>
  );
}
