"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV, isActive, isSectionActive } from "@/lib/nav";

/** The navigation rail — ink-black, carrying the full brand lockup. */
export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Every nav link closes the mobile drawer on the way out.
  const close = () => setOpen(false);

  return (
    <>
      {/* Mobile bar ---------------------------------------------------- */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-rail/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Wordmark onNavigate={close} compact />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-paper/20 px-3 text-[13px] font-medium text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper"
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          <MenuIcon open={open} />
          Menu
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-rail/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* Rail ---------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[236px] shrink-0 overflow-y-auto bg-rail transition-transform duration-200 ease-out lg:static lg:translate-x-0 lg:self-stretch lg:overflow-visible ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* The rail stretches to full page height; this inner block is what
            actually sticks while the page scrolls. */}
        <div className="lg:sticky lg:top-0 lg:max-h-dvh lg:overflow-y-auto">
          <div className="hidden px-5 pt-6 pb-6 lg:block">
            <Wordmark />
          </div>

          <nav className="px-3 pt-4 pb-8 lg:pt-0">
            {NAV.map((item) => {
              const sectionActive = isSectionActive(pathname, item);
              return (
                <div key={item.href} className="mb-0.5">
                  <Link
                    href={item.href}
                    onClick={close}
                    className={`flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[13.5px] font-medium transition-colors ${
                      sectionActive
                        ? "bg-gradient-to-r from-clay-bright/25 via-clay-bright/10 to-transparent text-paper"
                        : "text-paper/55 hover:bg-paper/5 hover:text-paper"
                    }`}
                  >
                    <span className={sectionActive ? "text-clay-bright" : "text-paper/35"}>
                      <SectionIcon name={item.label} />
                    </span>
                    {item.label}
                  </Link>

                  {item.children && sectionActive ? (
                    <div className="mt-0.5 mb-2 ml-[26px] border-l border-paper/15 pl-2.5">
                      {item.children.map((child) => {
                        // Sibling sub-pages share a prefix with the section index,
                        // so the index link must match exactly.
                        const childActive =
                          child.href === item.href
                            ? !item.children!.some(
                                (c) => c.href !== item.href && isActive(pathname, c.href),
                              )
                            : isActive(pathname, child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={close}
                            className={`block rounded-sm px-2 py-1 text-[13px] transition-colors ${
                              childActive
                                ? "font-medium text-paper"
                                : "text-paper/45 hover:text-paper"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

function Wordmark({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <Link href="/" onClick={onNavigate} className="group block">
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size
          brand asset; next/image adds a layout wrapper for no benefit */}
      <img
        src="/logo-full.png"
        alt="Jordan Create"
        className={compact ? "h-7 w-auto" : "h-[58px] w-auto"}
      />
      {compact ? null : (
        <span className="label mt-2.5 block text-paper/40 transition-colors group-hover:text-clay-bright">
          Operating System
        </span>
      )}
    </Link>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open ? (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

/** Lucide-style outlines, one per section. */
function SectionIcon({ name }: { name: string }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "Dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "Operations":
      return (
        <svg {...common}>
          <path d="M9 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3" />
          <rect x="9" y="2.5" width="6" height="3.5" rx="1" />
          <path d="m8.5 12 2 2 4-4" />
          <path d="M8.5 17.5h7" />
        </svg>
      );
    case "Content":
      return (
        <svg {...common}>
          <path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M14 3v5h5" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
      );
    case "Experience":
      return (
        <svg {...common}>
          <path d="M12 3v9" />
          <path d="M8 12h8l-1.5 6h-5z" />
          <path d="M7 21h10" />
          <circle cx="12" cy="3.5" r="1.5" />
        </svg>
      );
    case "Public Relations":
      return (
        <svg {...common}>
          <path d="M3 11v3a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z" />
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      );
    case "Sponsors":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="m7.5 15.5 3-3 2 2 4-4" />
        </svg>
      );
    case "Ticket Buyers":
      return (
        <svg {...common}>
          <path d="M3 9V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2.5 2.5 0 0 0 0 5v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a2.5 2.5 0 0 0 0-5z" />
          <path d="M14 6v2" />
          <path d="M14 11v2" />
          <path d="M14 16v2" />
        </svg>
      );
    case "People":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 20c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M16.5 14.6c2.2.3 3.7 1.8 4.2 4.4" />
        </svg>
      );
    case "Access":
      return (
        <svg {...common}>
          <circle cx="8.5" cy="8.5" r="4.5" />
          <circle cx="8.5" cy="8.5" r="1.4" />
          <path d="m11.8 11.8 8.2 8.2" />
          <path d="M16.5 16.5 19 14" />
          <path d="M18.5 18.5 21 16" />
        </svg>
      );
    default:
      return null;
  }
}
