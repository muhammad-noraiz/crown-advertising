import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Base path, e.g. "/dashboard/locations" */
  basePath: string;
}

export function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prev = page - 1;
  const next = page + 1;

  // Build up to 5 page numbers around the current page
  const pages: (number | "…")[] = [];
  const delta = 2;
  const left = page - delta;
  const right = page + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    } else if (i === left - 1 || i === right + 1) {
      pages.push("…");
    }
  }

  const linkCls = (active: boolean, disabled?: boolean) =>
    [
      "inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors",
      active
        ? "bg-amber-500 text-white"
        : disabled
        ? "text-slate-300 pointer-events-none"
        : "text-slate-600 hover:bg-slate-100",
    ].join(" ");

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <Link
          href={`${basePath}?page=${prev}`}
          className={linkCls(false, page === 1)}
          aria-disabled={page === 1}
          tabIndex={page === 1 ? -1 : undefined}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="inline-flex items-center justify-center w-8 h-8 text-sm text-slate-400">
              …
            </span>
          ) : (
            <Link key={p} href={`${basePath}?page=${p}`} className={linkCls(p === page)}>
              {p}
            </Link>
          )
        )}

        {/* Next */}
        <Link
          href={`${basePath}?page=${next}`}
          className={linkCls(false, page === totalPages)}
          aria-disabled={page === totalPages}
          tabIndex={page === totalPages ? -1 : undefined}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
