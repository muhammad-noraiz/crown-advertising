import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Location, LocationExpense, LocationPartner, Booking } from "@/lib/supabase/types";

// Parse duration text like "3 Months", "1 Month", "6 Months" → number of months
function parseDurationMonths(duration: string, startDate: string, endDate: string): number {
  const match = duration.match(/^(\d+)\s*month/i);
  if (match) return parseInt(match[1], 10);
  // Fallback: count calendar months between dates
  const s = new Date(startDate);
  const e = new Date(endDate);
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return Math.max(1, months);
}

// Does a booking overlap with [monthStart, monthEnd]?
function bookingOverlapsMonth(b: Booking, monthStart: Date, monthEnd: Date): boolean {
  return new Date(b.start_date) <= monthEnd && new Date(b.end_date) >= monthStart;
}

// Monthly revenue contribution from a single booking
function monthlyRevenue(b: Booking): number {
  if (!b.amount) return 0;
  const months = parseDurationMonths(b.duration, b.start_date, b.end_date);
  return b.amount / months;
}

// Expenses applicable in a given month
function expensesForMonth(expenses: LocationExpense[], monthStart: Date, monthEnd: Date): number {
  return expenses.reduce((total, e) => {
    const d = new Date(e.expense_date);
    if (e.is_recurring) {
      // Recurring: applies every month from expense_date onwards
      if (d <= monthEnd) return total + e.amount;
    } else {
      // One-time: only in the calendar month it was incurred
      if (d >= monthStart && d <= monthEnd) return total + e.amount;
    }
    return total;
  }, 0);
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;

  // Default to current month
  const now = new Date();
  const selectedMonth = monthParam ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-based

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999); // last ms of month

  const prevMonth = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  const isCurrentMonth = selectedMonth === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const supabase = await createClient();
  const [{ data: locData }, { data: bookingData }, { data: expenseData }, { data: partnerData }] =
    await Promise.all([
      supabase.from("locations").select("*").eq("is_active", true).order("name"),
      supabase
        .from("bookings")
        .select("*")
        .lte("start_date", monthEnd.toISOString())
        .gte("end_date", monthStart.toISOString()),
      supabase.from("location_expenses").select("*"),
      supabase.from("location_partners").select("*"),
    ]);

  const locations = (locData ?? []) as Location[];
  const bookings = (bookingData ?? []) as Booking[];
  const expenses = (expenseData ?? []) as LocationExpense[];
  const partners = (partnerData ?? []) as LocationPartner[];

  // Per-location profit calculation
  const rows = locations.map((loc) => {
    const locBookings = bookings.filter((b) => b.location_id === loc.id && bookingOverlapsMonth(b, monthStart, monthEnd));
    const locExpenses = expenses.filter((e) => e.location_id === loc.id);
    const locPartners = partners.filter((p) => p.location_id === loc.id);

    const revenue = locBookings.reduce((s, b) => s + monthlyRevenue(b), 0);
    const totalExpenses = expensesForMonth(locExpenses, monthStart, monthEnd);
    const netProfit = revenue - totalExpenses;
    const totalPartnerPct = locPartners.reduce((s, p) => s + p.percentage, 0);
    const crownPct = Math.max(0, 100 - totalPartnerPct);
    const crownProfit = netProfit * (crownPct / 100);

    return { loc, locBookings, revenue, totalExpenses, netProfit, locPartners, crownPct, crownProfit };
  });

  const grandRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const grandExpenses = rows.reduce((s, r) => s + r.totalExpenses, 0);
  const grandProfit = grandRevenue - grandExpenses;
  const grandCrown = rows.reduce((s, r) => s + r.crownProfit, 0);

  const monthLabel = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
          <p className="text-slate-500 text-sm mt-0.5">Monthly profit & expense overview</p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/accounts?month=${prevMonth}`} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <span className="px-4 py-2 text-sm font-semibold text-slate-900 min-w-36 text-center">{monthLabel}</span>
          <Link
            href={`/dashboard/accounts?month=${nextMonth}`}
            className={`p-2 rounded-lg border border-slate-200 text-slate-600 transition-colors ${isCurrentMonth ? "opacity-30 pointer-events-none" : "hover:bg-slate-50"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: grandRevenue, cls: "text-slate-900" },
          { label: "Total Expenses", value: grandExpenses, cls: "text-red-600" },
          { label: "Net Profit", value: grandProfit, cls: grandProfit >= 0 ? "text-green-600" : "text-red-600" },
          { label: "Crown Earnings", value: grandCrown, cls: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.cls}`}>
              PKR {Math.round(s.value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Per-location table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Location Breakdown — {monthLabel}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Location", "Land Type", "Active Bookings", "Revenue (PKR)", "Expenses (PKR)", "Net Profit (PKR)", "Partners", "Crown Earnings (PKR)"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ loc, locBookings, revenue, totalExpenses, netProfit, locPartners, crownPct, crownProfit }) => {
                const landCls = { crown: "bg-slate-100 text-slate-600", private: "bg-blue-100 text-blue-700", government: "bg-purple-100 text-purple-700" };
                const landLabel = { crown: "Owned", private: "Private", government: "Govt." };
                const lt = loc.land_type ?? "crown";
                return (
                  <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <Link href={`/dashboard/locations/${loc.id}`} className="hover:text-amber-600">
                        {loc.name}
                      </Link>
                      <p className="text-xs text-slate-400 font-normal">{loc.size} · {loc.city}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${landCls[lt as keyof typeof landCls]}`}>
                        {landLabel[lt as keyof typeof landLabel]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{locBookings.length}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{Math.round(revenue).toLocaleString()}</td>
                    <td className="px-5 py-4 text-red-600">{Math.round(totalExpenses).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`font-semibold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {Math.round(netProfit).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {locPartners.length === 0 ? (
                        <span className="text-slate-400 text-xs">None</span>
                      ) : (
                        <div className="space-y-0.5">
                          {locPartners.map((p) => (
                            <div key={p.id} className="text-xs text-slate-600">
                              <span className="font-medium">{p.partner_name}</span>
                              <span className="text-slate-400 ml-1">({p.percentage}% = PKR {Math.round(netProfit * p.percentage / 100).toLocaleString()})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-amber-600">{Math.round(crownProfit).toLocaleString()}</td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-400">No active locations.</td></tr>
              )}
            </tbody>

            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Totals</td>
                  <td className="px-5 py-3 font-bold text-slate-900">{Math.round(grandRevenue).toLocaleString()}</td>
                  <td className="px-5 py-3 font-bold text-red-600">{Math.round(grandExpenses).toLocaleString()}</td>
                  <td className="px-5 py-3 font-bold text-green-600">{Math.round(grandProfit).toLocaleString()}</td>
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3 font-bold text-amber-600">{Math.round(grandCrown).toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
