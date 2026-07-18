import { getAccountReport } from "@/lib/account-report";
import { buildAccountsWorkbook } from "@/lib/accounts-export";
import { getCurrentAccess } from "@/lib/auth/access";
import { canAccess } from "@/lib/permissions";

export async function GET(request: Request) {
  const access = await getCurrentAccess();
  if (!access) return new Response("Unauthorized", { status: 401 });
  if (!canAccess(access, "accounts")) return new Response("Forbidden", { status: 403 });

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
