"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createLocationAction } from "@/actions/locations";

function LocationModalContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createLocationAction, null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.startsWith("ok:")) {
      const id = state.slice(3);
      onClose();
      router.push(`/dashboard/locations/${id}`);
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Add Location</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form action={action} encType="multipart/form-data" className="space-y-5 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Location Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="e.g. 01. Defence Morr Facing DHA Main Boulevard"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Size <span className="text-red-500">*</span>
                </label>
                <input
                  name="size"
                  required
                  placeholder="e.g. 60×40"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  name="city"
                  required
                  placeholder="e.g. Lahore"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
              <input
                name="address"
                placeholder="Full street address (optional)"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Land Type <span className="text-red-500">*</span>
              </label>
              <select
                name="landType"
                defaultValue="crown"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="crown">Crown (Company Owned)</option>
                <option value="private">Private (Rent to landowner)</option>
                <option value="government">Government (Tax applicable)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Images{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <label className="flex items-center justify-center gap-2 w-full px-3.5 py-3 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 cursor-pointer transition-colors">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span>
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} image${selectedFiles.length > 1 ? "s" : ""} selected`
                    : "Click to attach images"}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  name="images"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
                />
              </label>
              {selectedFiles.length > 0 && (
                <p className="mt-1.5 text-xs text-slate-400 truncate">
                  {selectedFiles.map((f) => f.name).join(", ")}
                </p>
              )}
            </div>

            {state && !state.startsWith("ok:") && (
              <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {state}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={pending}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-semibold rounded-lg text-sm transition-colors"
              >
                {pending ? "Saving…" : "Save Location"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AddLocationModal() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm transition-colors"
      >
        + Add Location
      </button>
      {isOpen && <LocationModalContent onClose={() => setIsOpen(false)} />}
    </>
  );
}
