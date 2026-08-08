import Link from "next/link";

/** Status filter rendered as links, so filtering survives a page refresh
 *  and every filtered view is a shareable URL. */
export function FilterBar({
  basePath,
  options,
  active,
  counts,
  query,
}: {
  basePath: string;
  options: readonly string[];
  /** The currently selected status, or null for "all". */
  active: string | null;
  counts: Record<string, number>;
  /** Preserve the text search when switching status. */
  query?: string;
}) {
  const href = (status: string | null) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Pill href={href(null)} active={active === null} label="All" count={total} />
      {options.map((o) => (
        <Pill
          key={o}
          href={href(o)}
          active={active === o}
          label={o}
          count={counts[o] ?? 0}
        />
      ))}
    </div>
  );
}

function Pill({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[13px] transition-colors ${
        active
          ? "bg-ink text-paper"
          : count === 0
            ? "text-ink-3 hover:bg-sunk"
            : "text-ink-2 hover:bg-sunk hover:text-ink"
      }`}
    >
      {label}
      <span className={`tnum text-[11px] ${active ? "text-paper/60" : "text-ink-3"}`}>
        {count}
      </span>
    </Link>
  );
}

/** Plain GET search — no client JS needed. */
export function SearchBox({
  basePath,
  placeholder,
  query,
  status,
}: {
  basePath: string;
  placeholder: string;
  query?: string;
  status?: string | null;
}) {
  return (
    <form action={basePath} method="get" className="relative w-full sm:w-64">
      {status ? <input type="hidden" name="status" value={status} /> : null}
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <input
        type="search"
        name="q"
        defaultValue={query ?? ""}
        placeholder={placeholder}
        className="input input-search"
      />
    </form>
  );
}

/** Toolbar wrapper: filters on the left, search on the right. */
export function Toolbar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      {children}
    </div>
  );
}
