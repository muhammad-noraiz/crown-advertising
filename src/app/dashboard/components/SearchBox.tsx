import Link from "next/link";

interface SearchBoxProps {
  basePath: string;
  defaultValue?: string;
  placeholder: string;
  query?: Record<string, string | undefined>;
  className?: string;
}

export function SearchBox({ basePath, defaultValue = "", placeholder, query = {}, className = "mb-6" }: SearchBoxProps) {
  const hasSearch = defaultValue.trim().length > 0;
  const clearParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) clearParams.set(key, value);
  });
  const clearHref = `${basePath}${clearParams.size ? `?${clearParams.toString()}` : ""}`;

  return (
    <form action={basePath} className={`${className} flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_14px_38px_-32px_rgba(15,23,42,.75)] sm:flex-row sm:items-center dark:border-slate-700`}>
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
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-amber-400 dark:focus:bg-slate-900 dark:focus:ring-amber-400/10"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="h-11 rounded-xl bg-amber-400 px-5 text-sm font-bold text-slate-950 shadow-[0_10px_24px_-14px_rgba(251,191,36,.9)] transition hover:-translate-y-0.5 hover:bg-amber-300"
        >
          Search
        </button>
        {hasSearch && (
          <Link
            href={clearHref}
            className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
