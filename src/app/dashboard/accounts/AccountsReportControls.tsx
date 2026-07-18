"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { DayPicker, type DateRange } from "@daypicker/react";
import { useRouter } from "next/navigation";

interface Props {
  from: string;
  to: string;
  compare: "previous" | "year" | "none";
  showAllLocations: boolean;
  preset?: string;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateOnly(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatRange(range: DateRange | undefined): string {
  if (!range?.from) return "Select reporting period";
  const from = range.from.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  if (!range.to) return `${from} – select end date`;
  const to = range.to.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  return `${from} – ${to}`;
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M6.5 3v3M17.5 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="m6 8 4 4 4-4" />
    </svg>
  );
}

export function AccountsReportControls({ from, to, compare, showAllLocations, preset }: Props) {
  const router = useRouter();
  const pickerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [numberOfMonths, setNumberOfMonths] = useState(2);
  const [range, setRange] = useState<DateRange>({ from: parseDateOnly(from), to: parseDateOnly(to) });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const updateMonths = () => setNumberOfMonths(media.matches ? 1 : 2);
    updateMonths();
    media.addEventListener("change", updateMonths);
    return () => media.removeEventListener("change", updateMonths);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function navigate(nextFrom: string, nextTo: string, nextCompare: Props["compare"], preservePreset = false) {
    const params = new URLSearchParams({ from: nextFrom, to: nextTo, compare: nextCompare });
    if (showAllLocations) params.set("view", "all");
    if (preservePreset && preset) params.set("preset", preset);
    startTransition(() => router.push(`/dashboard/accounts?${params.toString()}`, { scroll: false }));
  }

  function handleRangeSelect(nextRange: DateRange | undefined) {
    if (!nextRange) return;
    setRange(nextRange);
    if (nextRange.from && nextRange.to) {
      setOpen(false);
      navigate(toDateOnly(nextRange.from), toDateOnly(nextRange.to), compare);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div ref={pickerRef} className="relative">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-12 w-full min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-left transition hover:border-amber-300/35 hover:bg-white/[0.09] sm:w-[290px]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-amber-300/10 text-amber-300"><CalendarIcon /></span>
          <span className="grid min-w-0 flex-1 gap-2">
            <span className="block text-[9px] font-semibold uppercase leading-none tracking-wide text-slate-500">Date Range</span>
            <span className="block truncate text-xs font-semibold leading-4 text-white">{formatRange(range)}</span>
          </span>
          <span className="text-slate-500"><ChevronIcon open={open} /></span>
        </button>

        {open && (
          <div role="dialog" aria-label="Choose reporting date range" className="accounts-date-picker absolute left-0 top-[calc(100%+8px)] z-50 w-max max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-[0_24px_70px_-24px_rgba(15,23,42,.5)]">
            <DayPicker
              animate
              mode="range"
              selected={range}
              onSelect={handleRangeSelect}
              resetOnSelect
              numberOfMonths={numberOfMonths}
              defaultMonth={range.from}
              showOutsideDays
            />
            <div className="mt-3 flex items-center justify-between gap-6 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">{range.to ? formatRange(range) : "Choose the end date to update the report."}</p>
              {isPending && <span className="text-xs font-semibold text-amber-700">Updating…</span>}
            </div>
          </div>
        )}
      </div>

      <label className="flex h-12 min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 transition hover:border-white/20 sm:w-[235px]">
        <span className="grid min-w-0 flex-1 gap-2">
          <span className="block text-[9px] font-semibold uppercase leading-none tracking-wide text-slate-500">Compare</span>
          <select
            value={compare}
            onChange={(event) => navigate(from, to, event.target.value as Props["compare"], true)}
            className="block h-4 w-full cursor-pointer bg-transparent text-xs font-semibold leading-4 text-white outline-none [color-scheme:dark]"
          >
            <option value="previous">Previous Equal Period</option>
            <option value="year">Same Period Last Year</option>
            <option value="none">No Comparison</option>
          </select>
        </span>
      </label>
    </div>
  );
}
