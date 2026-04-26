import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/supabase/types";
import { AddClientModal } from "./AddClientModal";
import { EditClientModal } from "./EditClientModal";
import { DeleteClientButton } from "./DeleteClientButton";
import { Pagination } from "@/app/dashboard/components/Pagination";
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const [{ data, count }] = await Promise.all([
    supabase
      .from("clients")
      .select("*", { count: "exact" })
      .order("name")
      .range(from, to),
  ]);

  const clients = (data ?? []) as Client[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} total clients</p>
        </div>
        <AddClientModal />
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Name", "Company", "Phone", "Email", "Address", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No clients yet. <AddClientModal />
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      <Link href={`/dashboard/clients/${c.id}`} className="hover:text-amber-600">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.company ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{c.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{c.email ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-500 max-w-48 truncate">{c.address ?? "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <EditClientModal client={c} />
                        <DeleteClientButton id={c.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/dashboard/clients" />
    </div>
  );
}
