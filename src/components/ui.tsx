import Link from "next/link";
import type { ReactNode } from "react";
import type { Tone, Vocab } from "@/lib/taxonomy";

/* ------------------------------------------------------------------ Badge --- */

const toneClass: Record<Tone, string> = {
  neutral: "bg-tone-neutral-bg text-tone-neutral-fg",
  info: "bg-tone-info-bg text-tone-info-fg",
  progress: "bg-tone-progress-bg text-tone-progress-fg",
  success: "bg-tone-success-bg text-tone-success-fg",
  warn: "bg-tone-warn-bg text-tone-warn-fg",
  danger: "bg-tone-danger-bg text-tone-danger-fg",
};

export function Badge({
  value,
  vocab,
  tone,
}: {
  value: string | null | undefined;
  /** Look the tone up from a taxonomy vocabulary. */
  vocab?: Vocab;
  /** Or set it directly. */
  tone?: Tone;
}) {
  if (!value) return <span className="text-ink-3">—</span>;
  const resolved: Tone = tone ?? vocab?.tone[value] ?? "neutral";
  return (
    <span
      className={`inline-flex items-center rounded-xs px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${toneClass[resolved]}`}
    >
      {value}
    </span>
  );
}

/** A quieter chip for non-status metadata: topics, formats, channels. */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-xs border border-rule bg-surface px-1.5 py-0.5 text-[11px] text-ink-2 whitespace-nowrap">
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- Page header --- */

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
      <div className="min-w-0">
        {eyebrow ? <p className="label mb-1.5">{eyebrow}</p> : null}
        <h1 className="display text-[28px] text-ink">{title}</h1>
        {lede ? <p className="mt-1.5 max-w-2xl text-ink-2">{lede}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/* ------------------------------------------------------------------- Stats --- */

/** The signature block: small-caps label over an oversized tabular numeral. */
export function Stat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  // The oversized numeral is the signature, but a long value — a date range, a
  // status word — has to step down or it wraps and breaks the row's rhythm.
  const text = String(value);
  const size =
    text.length > 14 ? "text-[22px]" : text.length > 8 ? "text-[28px]" : "text-[40px]";

  const body = (
    <>
      <p className="label">{label}</p>
      <p className={`numeral mt-2 ${size}`}>{value}</p>
      <p className="mt-1.5 text-[12px] text-ink-2">{hint ?? " "}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block px-5 py-4 transition-colors hover:bg-sunk"
      >
        {body}
      </Link>
    );
  }
  return <div className="px-5 py-4">{body}</div>;
}

/** Stats laid out in a ruled row, like a printed summary table. */
export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="panel mb-8 grid grid-cols-2 divide-y divide-rule sm:grid-cols-2 lg:grid-cols-4 lg:divide-y-0 [&>*]:border-rule [&>*:not(:nth-child(2n+1))]:border-l lg:[&>*:not(:first-child)]:border-l">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Panels --- */

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel overflow-hidden ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3">
          <h2 className="label">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/* ------------------------------------------------------------ Empty state --- */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="display text-[17px] text-ink">{title}</p>
      {body ? (
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-ink-2">{body}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------ Detail lists --- */

export function DetailList({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-rule">{children}</dl>;
}

export function Detail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(96px,26%)_1fr] gap-3 px-5 py-2.5">
      <dt className="label pt-1">{label}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------- Misc --- */

/** A due date that turns urgent when it is close or past. */
export function DueDate({
  date,
  days,
  closed = false,
}: {
  date: string;
  days: number | null;
  closed?: boolean;
}) {
  if (days === null) return <span className="text-ink-3">—</span>;
  const urgent = !closed && days < 0;
  const soon = !closed && days >= 0 && days <= 7;
  return (
    <span className="tnum whitespace-nowrap">
      <span className={urgent ? "text-tone-danger-fg" : ""}>{date}</span>
      {urgent || soon ? (
        <span
          className={`ml-1.5 text-[11px] ${urgent ? "text-tone-danger-fg" : "text-ink-3"}`}
        >
          {days < 0 ? `${Math.abs(days)}d over` : days === 0 ? "today" : `${days}d`}
        </span>
      ) : null}
    </span>
  );
}

export function LinkOut({ href, label }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-clay underline decoration-clay/30 underline-offset-2 hover:decoration-clay"
    >
      {label ?? href.replace(/^https?:\/\//, "")}
    </a>
  );
}

export function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-ink hover:text-clay">
      {children}
    </Link>
  );
}
