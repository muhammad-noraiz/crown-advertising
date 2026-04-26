"use client";

import { useActionState, useState, useEffect } from "react";
import { createBooking } from "@/actions/bookings";
import { DURATION_PRESETS, addDuration } from "@/lib/utils";
import Link from "next/link";

interface Location {
  id: number;
  name: string;
  size: string;
  city: string;
}

interface Props {
  locations: Location[];
  defaultLocationId?: number;
}

export function BookingForm({ locations, defaultLocationId }: Props) {
  const [error, action, pending] = useActionState(createBooking, null);
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("1 Month");
  const [endDate, setEndDate] = useState("");
  const [customDuration, setCustomDuration] = useState(false);

  useEffect(() => {
    if (startDate && !customDuration) {
      setEndDate(addDuration(startDate, duration));
    }
  }, [startDate, duration, customDuration]);

  return (
    <form action={action} className="space-y-5 text-left">
      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Location <span className="text-red-500">*</span>
        </label>
        <select
          name="locationId"
          required
          defaultValue={defaultLocationId ?? ""}
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        >
          <option value="" disabled>Select a location…</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({l.size} · {l.city})
            </option>
          ))}
        </select>
      </div>

      {/* Client + Sale */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Display (Client) <span className="text-red-500">*</span>
          </label>
          <input
            name="clientName"
            required
            placeholder="e.g. Alif Holdings"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Sale (Person)</label>
          <input
            name="salePerson"
            placeholder="e.g. AdMaxx"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Vendor */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor</label>
        <input
          name="vendor"
          placeholder="e.g. AdMaxx"
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Dates + Duration */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            name="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Duration <span className="text-red-500">*</span>
          </label>
          <select
            name="duration"
            value={customDuration ? "custom" : duration}
            onChange={(e) => {
              if (e.target.value === "custom") {
                setCustomDuration(true);
              } else {
                setCustomDuration(false);
                setDuration(e.target.value);
              }
            }}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            {DURATION_PRESETS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
            <option value="custom">Custom…</option>
          </select>
          {customDuration && (
            <input
              name="duration"
              placeholder="e.g. 45 Days"
              required
              className="mt-2 w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            name="endDate"
            type="date"
            required
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCustomDuration(true);
            }}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Invoice fields */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Locking Ref.</label>
          <input
            name="lockingRef"
            placeholder="e.g. AdMaxx Hoarding Group"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice No.</label>
          <input
            name="invoiceNo"
            placeholder="Invoice number"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice Status</label>
          <select
            name="invoiceStatus"
            defaultValue="PENDING"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Remarks */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
        <input
          name="remarks"
          placeholder="e.g. Booked for 01 Year"
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {error && (
        <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-semibold rounded-lg text-sm transition-colors"
        >
          {pending ? "Saving…" : "Save Booking"}
        </button>
        <Link
          href="/dashboard/bookings"
          className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-sm transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
