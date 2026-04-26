"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createExpense } from "@/actions/expenses";

const EXPENSE_TYPES = [
  { value: "installation", label: "Installation / Labour" },
  { value: "land_rent", label: "Land Rent (Private)" },
  { value: "tax", label: "Government Tax" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

function AddExpenseContent({ locationId, onClose }: { locationId: number; onClose: () => void }) {
  const router = useRouter();
  const boundAction = createExpense.bind(null, locationId);
  const [state, action, pending] = useActionState(boundAction, null);
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (state === "ok") { onClose(); router.refresh(); }
  }, [state, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Add Expense</h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form action={action} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Type <span className="text-red-500">*</span></label>
              <select name="expenseType" required className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                <option value="">Select type…</option>
                {EXPENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (PKR) <span className="text-red-500">*</span></label>
                <input name="amount" type="number" min="1" step="1" required placeholder="e.g. 50000" className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date <span className="text-red-500">*</span></label>
                <input name="expenseDate" type="date" required className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isRecurring}
                onClick={() => setIsRecurring((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${isRecurring ? "bg-amber-500" : "bg-slate-200"}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${isRecurring ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
              <input type="hidden" name="isRecurring" value={isRecurring ? "true" : "false"} />
              <span className="text-sm text-slate-700">Recurring monthly expense</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <input name="description" placeholder="Optional details…" className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            {state && state !== "ok" && (
              <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{state}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={pending} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-semibold rounded-lg text-sm transition-colors">
                {pending ? "Saving…" : "Add Expense"}
              </button>
              <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-sm transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AddExpenseModal({ locationId }: { locationId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm transition-colors">
        + Add Expense
      </button>
      {isOpen && <AddExpenseContent locationId={locationId} onClose={() => setIsOpen(false)} />}
    </>
  );
}
