/** Formatting helpers. Everything renders in a fixed locale so server and
 *  client agree and React doesn't warn about hydration mismatches. */

const LOCALE = "en-US";

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
}

export function formatRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
): string {
  if (!start) return "—";
  if (!end) return formatDate(start);
  const a = new Date(start);
  const b = new Date(end);
  if (a.toDateString() === b.toDateString()) return formatDate(a);
  return `${formatDateShort(a)} – ${formatDate(b)}`;
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString(LOCALE, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

/** Whole days from today. Negative is in the past. */
export function daysFromToday(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

/** "in 4 days" / "6 days ago" / "today" — for deadlines and schedules. */
export function relativeDays(value: Date | string | null | undefined): string {
  const n = daysFromToday(value);
  if (n === null) return "—";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n > 0) return `in ${n} days`;
  return `${Math.abs(n)} days ago`;
}

/** Convert an empty form field to null so we don't store "" everywhere. */
export function nullify(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function toDate(value: FormDataEntryValue | null): Date | null {
  const s = nullify(value);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toNumber(value: FormDataEntryValue | null): number | null {
  const s = nullify(value);
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Format a Date for an <input type="date"> value. */
export function dateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
