import Link from "next/link";
import { FilterBar, SearchBox, Toolbar } from "@/components/filters";
import {
  Badge,
  Chip,
  EmptyState,
  PageHeader,
  Panel,
  RowLink,
} from "@/components/ui";
import { db } from "@/lib/db";
import { formatRange, relativeDays } from "@/lib/format";
import { CLOSED_STATUSES, EVENT_STATUS } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: PageProps<"/experience">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : null;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [events, all] = await Promise.all([
    db.event.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { city: { contains: q } },
                { venue: { contains: q } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { bookings: true } } },
      orderBy: [{ startDate: "desc" }],
    }),
    db.event.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  return (
    <>
      <PageHeader
        eyebrow="Experience"
        title="Events"
        lede="Every room the studio puts people in — and who's on the bill."
        actions={
          <Link href="/experience/new" className="btn btn-primary">
            New event
          </Link>
        }
      />

      <Toolbar>
        <FilterBar
          basePath="/experience"
          options={EVENT_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath="/experience"
          placeholder="Search events…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {events.length === 0 ? (
          <EmptyState
            title={q || status ? "Nothing matches that filter" : "No events yet"}
            body={
              q || status
                ? "Try a different status, or clear the search."
                : "Start with the date. Everything else — speakers, content, production — hangs off it."
            }
            action={
              q || status ? (
                <Link href="/experience" className="btn">
                  Clear filters
                </Link>
              ) : (
                <Link href="/experience/new" className="btn btn-primary">
                  Add an event
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Event</th>
                  <th className="pt-4">Format</th>
                  <th className="pt-4">Status</th>
                  <th className="pt-4">Where</th>
                  <th className="pt-4">When</th>
                  <th className="pt-4 text-right">Speakers</th>
                  <th className="pt-4 text-right">Capacity</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="max-w-[260px]">
                      <RowLink href={`/experience/${e.id}`}>{e.name}</RowLink>
                    </td>
                    <td>
                      <Chip>{e.format}</Chip>
                    </td>
                    <td>
                      <Badge value={e.status} vocab={EVENT_STATUS} />
                    </td>
                    <td className="text-ink-2">{e.city ?? "—"}</td>
                    <td className="tnum whitespace-nowrap">
                      {formatRange(e.startDate, e.endDate)}
                      {e.startDate && !CLOSED_STATUSES.has(e.status) ? (
                        <span className="ml-2 text-[11px] text-ink-3">
                          {relativeDays(e.startDate)}
                        </span>
                      ) : null}
                    </td>
                    <td className="tnum text-right text-ink-2">
                      {e._count.bookings}
                    </td>
                    <td className="tnum text-right text-ink-2">
                      {e.capacity ?? "—"}
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
