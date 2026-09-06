"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBookingAction } from "@/actions/bookings";
import { DURATION_PRESETS, addDuration } from "@/lib/utils";
import type { BookingFormLocation } from "@/lib/supabase/types";

interface Props {
  locations: BookingFormLocation[];
  clients: { id: number; name: string }[];
  defaultLocationId?: number;
  buttonClassName?: string;
  buttonLabel?: string;
}

function BookingModalContent({
  locations,
  clients,
  defaultLocationId,
  onClose,
}: Omit<Props, "buttonClassName" | "buttonLabel"> & { onClose: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createBookingAction, null);
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("1 Month");
  const [endDate, setEndDate] = useState("");
  const [customDuration, setCustomDuration] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [billingType, setBillingType] = useState<"monthly" | "end_of_term">("monthly");
  const [locationId, setLocationId] = useState(defaultLocationId ? String(defaultLocationId) : "");

  // Outsourced sites are bought in, so the buy price is the floor for this sale.
  const selectedLocation = locations.find((location) => String(location.id) === locationId);
  const buyPrice =
    selectedLocation?.is_outsourced && selectedLocation.purchase_price !== null
      ? `PKR ${Math.round(selectedLocation.purchase_price).toLocaleString("en-PK")}`
      : null;

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
    if (state === "ok") {
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Add Booking</h2>
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
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                name="locationId"
                required
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="" disabled>Select a location…</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.size} · {l.city})
                  </option>
                ))}
              </select>

              {selectedLocation?.is_outsourced && (
                <p className="mt-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-800">
                  Outsourced from <span className="font-semibold">{selectedLocation.outsourced_from}</span>
                  {buyPrice
                    ? <> · purchase price <span className="font-semibold">{buyPrice}</span>. Price the sale above it to keep your commission.</>
                    : <> · no purchase price recorded on this location yet.</>}
                </p>
              )}
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
                  <option value="" disabled>Select a client…</option>
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setStartDate(value);
                    if (value && !customDuration) setEndDate(addDuration(value, duration));
                  }}
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
                      if (startDate) setEndDate(addDuration(startDate, e.target.value));
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Locking Ref.</label>
              <input
                name="lockingRef"
                placeholder="e.g. AdMaxx Hoarding Group"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Billing plan */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-900">Payment plan</p>
                <p className="mt-0.5 text-xs text-slate-500">Choose how this client pays for the booking.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "monthly", title: "Monthly rent", copy: "Create one invoice for every booking month." },
                  { value: "end_of_term", title: "Combined at end", copy: "Create one invoice for the full contract amount." },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-xl border p-4 transition ${billingType === option.value ? "border-amber-500 bg-amber-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <input
                      type="radio"
                      name="billingType"
                      value={option.value}
                      checked={billingType === option.value}
                      onChange={() => setBillingType(option.value as "monthly" | "end_of_term")}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-900">{option.title}</span>
                      <span className={`h-3 w-3 rounded-full ring-2 ring-offset-2 ${billingType === option.value ? "bg-amber-500 ring-amber-500" : "bg-white ring-slate-300"}`} />
                    </span>
                    <span className="mt-1.5 block text-xs leading-5 text-slate-500">{option.copy}</span>
                  </label>
                ))}
              </div>

              <label className="mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-amber-300 hover:bg-amber-50/40">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">Create invoice schedule now</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {billingType === "monthly" ? "Generate the monthly invoices when this booking is saved." : "Generate the final combined invoice when this booking is saved."}
                  </span>
                </span>
                <input name="generateInvoices" type="checkbox" defaultChecked className="peer sr-only" />
                <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-amber-500 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500 peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
              </label>

              <label className="mt-3 block text-sm font-medium text-slate-700">
                Invoice No.
                <input
                  name="invoiceNoBase"
                  placeholder="Auto if blank, e.g. CR - AD 187"
                  className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  {billingType === "monthly"
                    ? "Numbering continues from here for each month, so CR - AD 187 becomes 187, 188, 189…"
                    : "Used as the invoice number for this booking."}
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Total Contract Amount (PKR) <span className="text-red-500">*</span>
              </label>
              <input
                name="amount"
                type="number"
                min="1"
                step="0.01"
                required
                placeholder="e.g. 150000"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                {billingType === "monthly" ? "The total will be divided evenly across the monthly invoices." : "The full amount will be due on the booking end date."}
                {buyPrice && <span className="font-semibold text-purple-700"> Purchase price on this location: {buyPrice}.</span>}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
              <input
                name="remarks"
                placeholder="e.g. Booked for 01 Year"
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
                {pending ? "Saving…" : "Save Booking"}
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

export function AddBookingModal({ locations, clients, defaultLocationId, buttonClassName, buttonLabel }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={buttonClassName ?? "px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm transition-colors"}
      >
        {buttonLabel ?? "+ Add Booking"}
      </button>
      {isOpen && (
        <BookingModalContent
          locations={locations}
          clients={clients}
          defaultLocationId={defaultLocationId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
