"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePartner } from "@/actions/partners";
import type { LocationPartner } from "@/lib/supabase/types";

function EditPartnerContent({
  partner,
  locationId,
  onClose,
}: { partner: LocationPartner; locationId: number; onClose: () => void }) {
  const router = useRouter();
  const boundAction = updatePartner.bind(null, partner.id, locationId);
  const [state, action, pending] = useActionState(boundAction, null);

  useEffect(() => {
    if (state === "ok") { onClose(); router.refresh(); }
  }, [state, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Edit Partner</h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form action={action} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Partner Name <span className="text-red-500">*</span></label>
              <input name="partnerName" required defaultValue={partner.partner_name} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input name="phone" type="tel" defaultValue={partner.phone ?? ""} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ownership % <span className="text-red-500">*</span></label>
                <input name="percentage" type="number" min="0.01" max="100" step="0.01" required defaultValue={partner.percentage} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input name="email" type="email" defaultValue={partner.email ?? ""} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
              <textarea name="notes" rows={2} defaultValue={partner.notes ?? ""} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
            </div>

            {state && state !== "ok" && (
              <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{state}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={pending} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-semibold rounded-lg text-sm transition-colors">
                {pending ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-sm transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function EditPartnerModal({ partner, locationId }: { partner: LocationPartner; locationId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 font-medium">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
        </svg>
        Edit
      </button>
      {isOpen && <EditPartnerContent partner={partner} locationId={locationId} onClose={() => setIsOpen(false)} />}
    </>
  );
}
