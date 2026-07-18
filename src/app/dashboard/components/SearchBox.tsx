import Link from "next/link";

interface SearchBoxProps {
  basePath: string;
  defaultValue?: string;
  placeholder: string;
  query?: Record<string, string | undefined>;
}

export function SearchBox({ basePath, defaultValue = "", placeholder, query = {} }: SearchBoxProps) {
  const hasSearch = defaultValue.trim().length > 0;
  const clearParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) clearParams.set(key, value);
  });
  const clearHref = `${basePath}${clearParams.size ? `?${clearParams.toString()}` : ""}`;

  return (
    <form action={basePath} className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
      {Object.entries(query).map(([key, value]) => value ? <input key={key} type="hidden" name={key} value={value} /> : null)}
      <label className="relative flex-1">
        <span className="sr-only">Search</span>
        <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
        </svg>
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="h-11 rounded-lg bg-amber-500 px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Search
        </button>
        {hasSearch && (
          <Link
            href={clearHref}
            className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
