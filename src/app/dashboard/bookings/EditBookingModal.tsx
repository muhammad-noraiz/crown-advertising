"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateBooking } from "@/actions/bookings";
import { DURATION_PRESETS, addDuration, toInputDate } from "@/lib/utils";
import type { Booking, Location } from "@/lib/supabase/types";

interface Props {
  booking: Booking;
  location: Pick<Location, "id" | "name" | "size" | "city">;
  clients: { id: number; name: string }[];
  buttonClassName?: string;
}

function EditBookingModalContent({
  booking,
  location,
  clients,
  onClose,
}: Omit<Props, "buttonClassName"> & { onClose: () => void }) {
  const router = useRouter();
  const boundAction = updateBooking.bind(null, booking.id, booking.location_id);
  const [state, action, pending] = useActionState(boundAction, null);

  const [startDate, setStartDate] = useState(toInputDate(booking.start_date));
  const [duration, setDuration] = useState(
    DURATION_PRESETS.includes(booking.duration) ? booking.duration : "1 Month"
  );
  const [endDate, setEndDate] = useState(toInputDate(booking.end_date));
  const [customDuration, setCustomDuration] = useState(!DURATION_PRESETS.includes(booking.duration));
  const [selectedClientId, setSelectedClientId] = useState(
    booking.client_id ? String(booking.client_id) : "__other__"
  );
  const [clientName, setClientName] = useState(booking.client_name);

  function handleClientChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedClientId(val);
    if (val !== "__other__") {
      setClientName(clients.find((c) => String(c.id) === val)?.name ?? "");
    } else {
      setClientName("");
    }
  }

  useEffect(() => {
    if (startDate && !customDuration) {
      setEndDate(addDuration(startDate, duration));
    }
  }, [startDate, duration, customDuration]);

  useEffect(() => {
    if (state === "ok") {
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Edit Booking</h2>
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
            {/* Location (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                {location.name} ({location.size} · {location.city})
              </div>
            </div>

            {/* Client + Sale */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Display (Client) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={handleClientChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                  <option value="__other__">— Type manually</option>
                </select>
                {selectedClientId === "__other__" && (
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Alif Holdings"
                    className="mt-2 w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                )}
                <input type="hidden" name="clientId" value={selectedClientId !== "__other__" ? selectedClientId : ""} />
                <input type="hidden" name="clientName" value={clientName} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sale (Person)</label>
                <input
                  name="salePerson"
                  defaultValue={booking.sale_person ?? ""}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor</label>
              <input
                name="vendor"
                defaultValue={booking.vendor ?? ""}
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
                    defaultValue={booking.duration}
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
                  defaultValue={booking.locking_ref ?? ""}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice No.</label>
                <input
                  name="invoiceNo"
                  defaultValue={booking.invoice_no ?? ""}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice Status</label>
                <select
                  name="invoiceStatus"
                  defaultValue={booking.invoice_status}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Contract Amount (PKR) <span className="text-red-500">*</span>
              </label>
              <input
                name="amount"
                type="number"
                min="0"
                step="1"
                required
                defaultValue={booking.amount ?? 0}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
              <input
                name="remarks"
                defaultValue={booking.remarks ?? ""}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
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

export function EditBookingModal({ booking, location, clients, buttonClassName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={buttonClassName ?? "inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-500 font-medium"}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
        </svg>
        Edit
      </button>
      {isOpen && (
        <EditBookingModalContent
          booking={booking}
          location={location}
          clients={clients}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
