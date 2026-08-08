import { GUEST_CATEGORY, categorySlug } from "@/lib/taxonomy";

export type NavItem = {
  label: string;
  href: string;
  /** Also mark active when the path starts with one of these. */
  match?: string[];
  children?: { label: string; href: string }[];
};

/** The four sections of the OS, in the order they're worked in. */
export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/", match: [] },
  {
    label: "Operations",
    href: "/operations",
    match: ["/operations"],
    children: [
      { label: "Projects", href: "/operations" },
      { label: "Tasks", href: "/operations/tasks" },
    ],
  },
  {
    label: "Content",
    href: "/content",
    match: ["/content"],
  },
  {
    label: "Experience",
    href: "/experience",
    match: ["/experience"],
    children: [
      { label: "Events", href: "/experience" },
      { label: "Speakers", href: "/experience/speakers" },
      { label: "Topics", href: "/experience/topics" },
    ],
  },
  {
    label: "Public Relations",
    href: "/public-relations",
    match: ["/public-relations"],
    // "All guests" is the section index; the rest are the category rosters.
    children: [
      { label: "All guests", href: "/public-relations" },
      ...GUEST_CATEGORY.values.map((c) => ({
        label: c,
        href: `/public-relations/${categorySlug(c)}`,
      })),
    ],
  },
  {
    label: "Sponsors",
    href: "/sponsors",
    match: ["/sponsors"],
  },
  {
    label: "Ticket Buyers",
    href: "/tickets",
    match: ["/tickets"],
  },
  {
    label: "People",
    href: "/people",
    match: ["/people"],
  },
  {
    label: "Access",
    href: "/access",
    match: ["/access"],
  },
];

/** Exact-or-descendant match, with "/" only ever matching itself. */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** A section is active when the path sits anywhere inside it. */
export function isSectionActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/") return pathname === "/";
  return isActive(pathname, item.href);
}
