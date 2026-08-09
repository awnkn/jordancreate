import Link from "next/link";
import { FilterBar, SearchBox, Toolbar } from "@/components/filters";
import {
  Badge,
  Chip,
  EmptyState,
  PageHeader,
  Panel,
  RowLink,
  Stat,
  StatRow,
} from "@/components/ui";
import { db } from "@/lib/db";
import { formatCount, formatDate, fullName } from "@/lib/format";
import { GUEST_STATUS } from "@/lib/taxonomy";

/** Pipeline order, so the table reads top-to-bottom through the funnel. */
const STAGE_ORDER = ["Prospect", "Pitched", "Booked", "Recorded", "Published", "Passed"];

/**
 * The guest table. Used by the Public Relations index (every guest) and by each
 * category sub-section (Executives, Government, …) — same view, narrower slice.
 */
export async function GuestList({
  category,
  status,
  q,
  basePath,
  title,
  lede,
}: {
  /** Omit for "all guests". */
  category?: string;
  status: string | null;
  q: string;
  basePath: string;
  title: string;
  lede: string;
}) {
  const scope = category ? { category } : {};

  const [guests, all] = await Promise.all([
    db.guest.findMany({
      where: {
        ...scope,
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { firstName: { contains: q } },
                { lastName: { contains: q } },
                { outlet: { contains: q } },
                { showName: { contains: q } },
                { angle: { contains: q } },
              ],
            }
          : {}),
      },
      include: { topics: { select: { id: true, name: true } } },
    }),
    // Status counts stay scoped to the category, so the filter bar's numbers
    // match what filtering would actually show.
    db.guest.groupBy({ by: ["status"], where: scope, _count: true }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  const ordered = [...guests].sort((a, b) => {
    const stage = STAGE_ORDER.indexOf(a.status) - STAGE_ORDER.indexOf(b.status);
    if (stage !== 0) return stage;
    return (a.scheduledFor?.getTime() ?? 0) - (b.scheduledFor?.getTime() ?? 0);
  });

  const live = guests.filter((g) => !["Published", "Passed"].includes(g.status));
  const reach = guests
    .filter((g) => g.status === "Published")
    .reduce((sum, g) => sum + (g.audienceSize ?? 0), 0);

  const filtered = Boolean(q || status);

  return (
    <>
      <PageHeader
        eyebrow={category ? `Public Relations · ${category}` : "Public Relations"}
        title={title}
        lede={lede}
        actions={
          <Link href="/public-relations/guests/new" className="btn btn-primary">
            New guest
          </Link>
        }
      />

      <StatRow>
        <Stat label="In the pipeline" value={live.length} hint="not yet closed" />
        <Stat
          label="Booked"
          value={counts["Booked"] ?? 0}
          hint="dates on the calendar"
        />
        <Stat
          label="Published"
          value={counts["Published"] ?? 0}
          hint="live placements"
        />
        <Stat
          label="Reach published"
          value={formatCount(reach)}
          hint="combined audience"
        />
      </StatRow>

      <Toolbar>
        <FilterBar
          basePath={basePath}
          options={GUEST_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath={basePath}
          placeholder="Search guests…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {ordered.length === 0 ? (
          <EmptyState
            title={
              filtered
                ? "Nothing matches that filter"
                : category
                  ? `No ${category.toLowerCase()} yet`
                  : "No guest spots yet"
            }
            body={
              filtered
                ? "Try a different status, or clear the search."
                : "Track every pitch here so the same outlet doesn't get pitched twice."
            }
            action={
              filtered ? (
                <Link href={basePath} className="btn">
                  Clear filters
                </Link>
              ) : (
                <Link href="/public-relations/guests/new" className="btn btn-primary">
                  Add a guest spot
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Contact</th>
                  {category ? null : <th className="pt-4">Category</th>}
                  <th className="pt-4">Outlet</th>
                  <th className="pt-4">Format</th>
                  <th className="pt-4">Stage</th>
                  <th className="pt-4">Topics</th>
                  <th className="pt-4">Date</th>
                  <th className="pt-4 text-right">Audience</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((g) => (
                  <tr key={g.id}>
                    <td className="max-w-[220px]">
                      <RowLink href={`/public-relations/guests/${g.id}`}>
                        {fullName(g)}
                      </RowLink>
                      {g.angle ? (
                        <div className="mt-0.5 truncate text-[12px] text-ink-3">
                          {g.angle}
                        </div>
                      ) : null}
                    </td>
                    {category ? null : (
                      <td>
                        <Chip>{g.category}</Chip>
                      </td>
                    )}
                    <td className="text-ink-2">
                      {g.outlet ?? "—"}
                      {g.showName ? (
                        <div className="text-[12px] text-ink-3">{g.showName}</div>
                      ) : null}
                    </td>
                    <td>
                      <Chip>{g.format}</Chip>
                    </td>
                    <td>
                      <Badge value={g.status} vocab={GUEST_STATUS} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {g.topics.length === 0 ? (
                          <span className="text-ink-3">—</span>
                        ) : (
                          g.topics.map((t) => <Chip key={t.id}>{t.name}</Chip>)
                        )}
                      </div>
                    </td>
                    <td className="tnum whitespace-nowrap text-ink-2">
                      {formatDate(g.scheduledFor)}
                    </td>
                    <td className="tnum text-right text-ink-2">
                      {formatCount(g.audienceSize)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
