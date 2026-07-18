import { getAccountReport } from "@/lib/account-report";
import { buildAccountsWorkbook } from "@/lib/accounts-export";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const report = await getAccountReport({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    compare: url.searchParams.get("compare") ?? undefined,
  });
  const workbook = buildAccountsWorkbook(report);
  const fileName = `crown-accounts-${report.range.from}-to-${report.range.to}.xls`;

  return new Response(workbook, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
