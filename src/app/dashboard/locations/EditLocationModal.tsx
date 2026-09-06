"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateLocation } from "@/actions/locations";
import { OwnershipFields } from "./OwnershipFields";
import type { Location } from "@/lib/supabase/types";

function EditLocationModalContent({
  location,
  onClose,
}: {
  location: Location;
  onClose: () => void;
}) {
  const router = useRouter();
  const boundAction = updateLocation.bind(null, location.id);
  const [state, action, pending] = useActionState(boundAction, null);

  useEffect(() => {
    if (state === "ok") {
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Edit Location</h2>
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

          <form action={action} className="space-y-5 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Location Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                defaultValue={location.name}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <OwnershipFields
              defaultOutsourced={location.is_outsourced}
              defaultOwner={location.outsourced_from ?? ""}
              defaultPurchasePrice={location.purchase_price ?? ""}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Size <span className="text-red-500">*</span>
                </label>
                <input
                  name="size"
                  required
                  defaultValue={location.size}
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
                  defaultValue={location.city}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
              <input
                name="address"
                defaultValue={location.address ?? ""}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Price</label>
                <input
                  name="pricePerMonth"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={location.price_per_month ?? ""}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pricing Basis</label>
                <select
                  name="pricingBasis"
                  defaultValue={location.pricing_basis ?? "monthly"}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="monthly">Monthly rent</option>
                  <option value="slot">Digital slot</option>
                  <option value="on_request">On request</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Price Label</label>
              <input
                name="priceLabel"
                defaultValue={location.price_label ?? ""}
                placeholder="e.g. 1.05 Million or Rate per slot: 600,000"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Facing From</label>
                <input
                  name="facingFrom"
                  defaultValue={location.facing_from ?? ""}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Towards</label>
                <input
                  name="facingTowards"
                  defaultValue={location.facing_towards ?? ""}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Media Category</label>
              <select
                name="mediaCategory"
                defaultValue={location.media_category ?? "static"}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="static">Static OOH</option>
                <option value="motorway">M-2 & Ring Road</option>
                <option value="digital">Digital SMD</option>
                <option value="bridge-panel">Bridge Panels</option>
                <option value="toll-plaza">Toll Plazas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Land Type <span className="text-red-500">*</span>
              </label>
              <select
                name="landType"
                defaultValue={location.land_type ?? "crown"}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="crown">Crown (Company Owned)</option>
                <option value="private">Private (Rent to landowner)</option>
                <option value="government">Government (Tax applicable)</option>
              </select>
            </div>

            {state && state !== "ok" && (
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
                {pending ? "Saving…" : "Save Changes"}
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

export function EditLocationModal({ location }: { location: Location }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
        </svg>
        Edit
      </button>
      {isOpen && (
        <EditLocationModalContent location={location} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
