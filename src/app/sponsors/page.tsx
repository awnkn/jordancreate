import Link from "next/link";
import { FilterBar, SearchBox, Toolbar } from "@/components/filters";
import {
  Badge,
  Chip,
  DueDate,
  EmptyState,
  PageHeader,
  Panel,
  RowLink,
  Stat,
  StatRow,
} from "@/components/ui";
import { db } from "@/lib/db";
import { daysFromToday, formatDate, formatMoney } from "@/lib/format";
import { CLOSED_STATUSES, SPONSOR_STATUS } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function SponsorsPage({
  searchParams,
}: PageProps<"/sponsors">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : null;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [sponsors, all] = await Promise.all([
    db.sponsor.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { company: { contains: q } },
                { contactName: { contains: q } },
                { nextStep: { contains: q } },
              ],
            }
          : {}),
      },
      include: { event: { select: { id: true, name: true } } },
      orderBy: [{ closeDate: "asc" }, { company: "asc" }],
    }),
    db.sponsor.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  // Pipeline order for the table, open deals first.
  const ordered = [...sponsors].sort(
    (a, b) =>
      SPONSOR_STATUS.values.indexOf(a.status) - SPONSOR_STATUS.values.indexOf(b.status),
  );

  const open = sponsors.filter((s) => !CLOSED_STATUSES.has(s.status));
  const pipelineValue = open.reduce((sum, s) => sum + (s.value ?? 0), 0);
  const wonValue = sponsors
    .filter((s) => s.status === "Won")
    .reduce((sum, s) => sum + (s.value ?? 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Sponsors"
        title="Sales pipeline"
        lede="Every sponsorship deal, from first touch to signed — and what it's worth."
        actions={
          <Link href="/sponsors/new" className="btn btn-primary">
            New deal
          </Link>
        }
      />

      <StatRow>
        <Stat label="Open deals" value={open.length} hint="lead through negotiation" />
        <Stat
          label="Pipeline value"
          value={formatMoney(pipelineValue)}
          hint="open deals combined"
        />
        <Stat label="Won" value={counts["Won"] ?? 0} hint="deals closed" />
        <Stat label="Won value" value={formatMoney(wonValue)} hint="signed to date" />
      </StatRow>

      <Toolbar>
        <FilterBar
          basePath="/sponsors"
          options={SPONSOR_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath="/sponsors"
          placeholder="Search sponsors…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {ordered.length === 0 ? (
          <EmptyState
            title={q || status ? "Nothing matches that filter" : "No deals yet"}
            body={
              q || status
                ? "Try a different stage, or clear the search."
                : "Every sponsorship starts as a lead. Add the first one and work it forward."
            }
            action={
              q || status ? (
                <Link href="/sponsors" className="btn">
                  Clear filters
                </Link>
              ) : (
                <Link href="/sponsors/new" className="btn btn-primary">
                  Add a lead
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Company</th>
                  <th className="pt-4">Stage</th>
                  <th className="pt-4">Tier</th>
                  <th className="pt-4">Event</th>
                  <th className="pt-4">Next step</th>
                  <th className="pt-4">Close</th>
                  <th className="pt-4 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((s) => (
                  <tr key={s.id}>
                    <td className="max-w-[220px]">
                      <RowLink href={`/sponsors/${s.id}`}>{s.company}</RowLink>
                      {s.contactName ? (
                        <div className="mt-0.5 text-[12px] text-ink-3">
                          {s.contactName}
                          {s.contactRole ? ` · ${s.contactRole}` : ""}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <Badge value={s.status} vocab={SPONSOR_STATUS} />
                    </td>
                    <td>
                      <Chip>{s.tier}</Chip>
                    </td>
                    <td className="text-ink-2">
                      {s.event ? (
                        <Link
                          href={`/experience/${s.event.id}`}
                          className="hover:text-clay"
                        >
                          {s.event.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[220px] truncate text-ink-2">
                      {s.nextStep ?? "—"}
                    </td>
                    <td>
                      <DueDate
                        date={formatDate(s.closeDate)}
                        days={daysFromToday(s.closeDate)}
                        closed={CLOSED_STATUSES.has(s.status)}
                      />
                    </td>
                    <td className="tnum text-right text-ink-2">
                      {formatMoney(s.value)}
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
