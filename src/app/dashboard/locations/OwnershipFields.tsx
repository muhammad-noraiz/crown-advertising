"use client";

import { useState } from "react";

/**
 * Location type plus the two fields that only apply to bought-in inventory.
 * Shared by the add and edit modals so the pair stays in step. The sale price is
 * deliberately absent: it is agreed per booking, for owned and outsourced sites alike.
 */
export function OwnershipFields({
  defaultOutsourced = false,
  defaultOwner = "",
  defaultPurchasePrice = "",
}: {
  defaultOutsourced?: boolean;
  defaultOwner?: string;
  defaultPurchasePrice?: string | number;
}) {
  const [outsourced, setOutsourced] = useState(defaultOutsourced);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Location Type <span className="text-red-500">*</span>
        </label>
        <select
          name="ownership"
          value={outsourced ? "outsourced" : "crown"}
          onChange={(event) => setOutsourced(event.target.value === "outsourced")}
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        >
          <option value="crown">Crown Owned</option>
          <option value="outsourced">Outsourced (bought from another owner)</option>
        </select>
      </div>

      {outsourced && (
        <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Original Owner <span className="text-red-500">*</span>
            </label>
            <input
              name="outsourcedFrom"
              required
              defaultValue={defaultOwner}
              placeholder="e.g. Skyline Media (Pvt) Ltd"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Purchase Price (PKR)</label>
            <input
              name="purchasePrice"
              type="number"
              min="0"
              step="1"
              defaultValue={defaultPurchasePrice}
              placeholder="e.g. 450000"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              What Crown pays the owner. The sale price is not fixed here — it is set on each booking, with your commission on top.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
