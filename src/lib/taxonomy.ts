// The controlled vocabularies behind every status/format field.
//
// SQLite can't express enums, so these are the source of truth: forms render
// from them and server actions validate against them. Keep in sync with
// prisma/schema.prisma defaults.

export type Tone = "neutral" | "info" | "progress" | "success" | "warn" | "danger";

/** A status vocabulary: ordered values plus the tone each one reads as. */
export type Vocab = {
  values: readonly string[];
  tone: Record<string, Tone>;
};

const vocab = <T extends string>(entries: Record<T, Tone>): Vocab => ({
  values: Object.keys(entries) as T[],
  tone: entries as Record<string, Tone>,
});

// ---------------------------------------------------------------- Operations

export const PROJECT_STATUS = vocab({
  Discovery: "info",
  Active: "progress",
  Blocked: "danger",
  Delivered: "success",
  Archived: "neutral",
});

export const TASK_STATUS = vocab({
  Todo: "neutral",
  Doing: "progress",
  Blocked: "danger",
  Done: "success",
});

export const TASK_PRIORITY = vocab({
  Low: "neutral",
  Medium: "info",
  High: "warn",
  Urgent: "danger",
});

// ------------------------------------------------------------------- Content

export const CONTENT_STATUS = vocab({
  Idea: "neutral",
  Drafting: "progress",
  Review: "warn",
  Scheduled: "info",
  Published: "success",
  Archived: "neutral",
});

export const CONTENT_PLATFORM = {
  values: [
    "Website",
    "Instagram",
    "TikTok",
    "YouTube",
    "LinkedIn",
    "X",
    "Newsletter",
    "Podcast",
  ] as const,
};

export const CONTENT_FORMAT = {
  values: ["Article", "Video", "Newsletter", "Social", "Podcast", "Case Study", "Report"] as const,
};

// ---------------------------------------------------------------- Experience

export const EVENT_STATUS = vocab({
  Concept: "neutral",
  Planning: "progress",
  Confirmed: "info",
  Live: "warn",
  Complete: "success",
  Cancelled: "danger",
});

export const EVENT_FORMAT = {
  values: ["Conference", "Workshop", "Retreat", "Webinar", "Activation", "Dinner"] as const,
};

export const SPEAKER_STATUS = vocab({
  Prospect: "neutral",
  Invited: "info",
  Confirmed: "success",
  Declined: "danger",
  Alumni: "progress",
});

export const TOPIC_STATUS = vocab({
  Active: "success",
  Exploratory: "info",
  Retired: "neutral",
});

export const TOPIC_CATEGORY = {
  values: ["Craft", "Strategy", "Culture", "Technology", "Business", "Wellbeing"] as const,
};

export const BOOKING_STATUS = vocab({
  Held: "info",
  Offered: "progress",
  Confirmed: "success",
  Cancelled: "danger",
});

// ---------------------------------------------------------- Public Relations

export const GUEST_STATUS = vocab({
  Prospect: "neutral",
  Pitched: "info",
  Booked: "progress",
  Recorded: "warn",
  Published: "success",
  Passed: "danger",
});

export const GUEST_FORMAT = {
  values: ["Podcast", "Panel", "Press", "Broadcast", "Newsletter", "Livestream"] as const,
};

/**
 * The sub-sections under Public Relations. These are who the guest *is*, which
 * is a different axis from GUEST_FORMAT (the medium) and GUEST_STATUS (the
 * pipeline stage) — a guest has one of each.
 */
export const GUEST_CATEGORY = {
  values: [
    "General Guests",
    "Executives",
    "Government",
    "Creators",
    "Artists",
    "Designers",
  ] as const,
};

/** URL slug ⇆ category name, so each sub-section has a clean, shareable link. */
export const GUEST_CATEGORY_SLUGS: Record<string, string> = Object.fromEntries(
  GUEST_CATEGORY.values.map((c) => [c.toLowerCase().replace(/\s+/g, "-"), c]),
);

export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}

// -------------------------------------------------------------------- People

export const PERSON_STATUS = vocab({
  "Core Team": "success",
  Freelance: "info",
  Contractor: "progress",
  Alumni: "neutral",
});

// -------------------------------------------------------------------- Access

export const ACCESS_LEVEL = vocab({
  Owner: "danger",
  Admin: "warn",
  Editor: "info",
  Viewer: "neutral",
});

export const ACCESS_STATUS = vocab({
  Active: "success",
  Pending: "info",
  Revoked: "neutral",
});

// ------------------------------------------------------------------ Sponsors

/** The sales pipeline, in order. */
export const SPONSOR_STATUS = vocab({
  Lead: "neutral",
  Contacted: "info",
  Proposal: "progress",
  Negotiation: "warn",
  Won: "success",
  Lost: "danger",
});

export const SPONSOR_TIER = {
  values: ["Title", "Gold", "Silver", "Partner", "In-kind"] as const,
};

// ------------------------------------------------------------- Ticket buyers

export const TICKET_STATUS = vocab({
  Paid: "success",
  Pending: "info",
  "Checked In": "progress",
  Refunded: "danger",
});

export const TICKET_TYPE = {
  values: ["General", "VIP", "Student", "Team", "Comp"] as const,
};

// ------------------------------------------------------------------- Vendors

export const VENDOR_KIND = {
  values: ["Supplier", "Space Partner"] as const,
};

export const VENDOR_STATUS = vocab({
  Prospect: "neutral",
  Active: "success",
  Paused: "warn",
  Former: "neutral",
});

// ---------------------------------------------------------------- Shared log

export const INTERACTION_KIND = {
  values: ["Note", "Email", "Call", "Meeting", "Pitch", "Follow-up"] as const,
};

/**
 * Clamp a submitted value to a known vocabulary. SQLite won't enforce these,
 * so this is the only thing standing between a form post and junk in a status
 * column — every server action runs status/format fields through it.
 */
export function constrain(
  value: FormDataEntryValue | null,
  allowed: readonly string[],
  fallback: string,
): string {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

/** Statuses that mean "this is done / off the board" for progress counts. */
export const CLOSED_STATUSES = new Set([
  "Delivered",
  "Archived",
  "Done",
  "Published",
  "Complete",
  "Cancelled",
  "Declined",
  "Passed",
  "Retired",
  "Won",
  "Lost",
  "Refunded",
  "Revoked",
]);
