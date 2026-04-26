import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, bookingStatus } from "@/lib/utils";
import { AddLocationModal } from "./locations/AddLocationModal";
import { AddBookingModal } from "./bookings/AddBookingModal";

async function getStats() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalLocations },
    { count: activeBookings },
    { count: expiringSoon },
    { data: recentBookings },
    { data: occupiedRows },
  ] = await Promise.all([
    supabase.from("locations").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("bookings").select("*", { count: "exact", head: true }).gte("end_date", now),
    supabase.from("bookings").select("*", { count: "exact", head: true }).gte("end_date", now).lte("end_date", sevenDaysFromNow),
    supabase.from("bookings").select("*, locations(id, name)").order("created_at", { ascending: false }).limit(8),
    supabase.from("bookings").select("location_id").gte("end_date", now),
  ]);

  const occupiedLocationIds = new Set(occupiedRows?.map((r) => r.location_id));
  const availableLocations = (totalLocations ?? 0) - occupiedLocationIds.size;

  return { totalLocations: totalLocations ?? 0, activeBookings: activeBookings ?? 0, expiringSoon: expiringSoon ?? 0, availableLocations, recentBookings: recentBookings ?? [] };
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-700" },
  expiring: { label: "Expiring Soon", cls: "bg-amber-100 text-amber-700" },
  expired: { label: "Expired", cls: "bg-red-100 text-red-700" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { totalLocations, activeBookings, expiringSoon, availableLocations, recentBookings } =
    await getStats();
  const [{ data: locationData }, { data: clientsData }] = await Promise.all([
    supabase.from("locations").select("id, name, size, city").eq("is_active", true).order("name"),
    supabase.from("clients").select("id, name").order("name"),
  ]);
  const locations = (locationData ?? []) as { id: number; name: string; size: string; city: string }[];
  const clients = (clientsData ?? []) as { id: number; name: string }[];

  const stats = [
    {
      label: "Total Locations",
      value: totalLocations,
      icon: "📍",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
    },
    {
      label: "Active Bookings",
      value: activeBookings,
      icon: "📋",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700",
    },
    {
      label: "Available",
      value: availableLocations,
      icon: "✅",
      color: "bg-emerald-50 border-emerald-200",
      textColor: "text-emerald-700",
    },
    {
      label: "Expiring in 7 days",
      value: expiringSoon,
      icon: "⚠️",
      color: "bg-amber-50 border-amber-200",
      textColor: "text-amber-700",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Crown Advertising — Location Management</p>
        </div>
        <div className="flex gap-3">
          <AddLocationModal />
          <AddBookingModal
            locations={locations}
            clients={clients}
            buttonClassName="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-sm transition-colors"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl p-5 border ${stat.color} flex items-center gap-4`}
          >
            <span className="text-3xl">{stat.icon}</span>
            <div>
              <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Bookings</h2>
          <Link href="/dashboard/bookings" className="text-sm text-amber-600 hover:text-amber-500 font-medium">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Start</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">End</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Duration</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No bookings yet.{" "}
                    <AddBookingModal
                      locations={locations}
                      clients={clients}
                      buttonClassName="text-amber-600 hover:underline text-sm"
                      buttonLabel="Add the first one →"
                    />
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => {
                  const s = bookingStatus(b.end_date);
                  const sl = statusLabel[s];
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-900 max-w-48 truncate">
                        <Link href={`/dashboard/locations/${b.location_id}`} className="hover:text-amber-600">
                          {(b.locations as { name: string } | null)?.name ?? "—"}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">{b.client_name}</td>
                      <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(b.start_date)}</td>
                      <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(b.end_date)}</td>
                      <td className="px-6 py-3.5 text-slate-500">{b.duration}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sl.cls}`}>
                          {sl.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
