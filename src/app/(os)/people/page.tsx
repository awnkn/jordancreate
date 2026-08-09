import Link from "next/link";
import { FilterBar, SearchBox, Toolbar } from "@/components/filters";
import {
  Badge,
  EmptyState,
  PageHeader,
  Panel,
  RowLink,
} from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate, fullName } from "@/lib/format";
import { PERSON_STATUS } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function PeoplePage({ searchParams }: PageProps<"/people">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : null;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [people, all] = await Promise.all([
    db.person.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { firstName: { contains: q } },
                { lastName: { contains: q } },
                { role: { contains: q } },
                { location: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { access: true } },
        responsibilities: {
          where: { level: "Owner" },
          select: { area: true },
          orderBy: { area: "asc" },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    db.person.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="The team"
        lede="Everyone who works on Jordan Create — staff, freelancers, and the tools they hold."
        actions={
          <Link href="/people/new" className="btn btn-primary">
            New person
          </Link>
        }
      />

      <Toolbar>
        <FilterBar
          basePath="/people"
          options={PERSON_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath="/people"
          placeholder="Search people…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {people.length === 0 ? (
          <EmptyState
            title={q || status ? "Nothing matches that filter" : "Nobody here yet"}
            body={
              q || status
                ? "Try a different status, or clear the search."
                : "Add the team so tasks, access and events have real people behind them."
            }
            action={
              q || status ? (
                <Link href="/people" className="btn">
                  Clear filters
                </Link>
              ) : (
                <Link href="/people/new" className="btn btn-primary">
                  Add a person
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Person</th>
                  <th className="pt-4">Status</th>
                  <th className="pt-4">Login</th>
                  <th className="pt-4">Owns</th>
                  <th className="pt-4">Email</th>
                  <th className="pt-4">Location</th>
                  <th className="pt-4">Since</th>
                  <th className="pt-4 text-right">Access</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id}>
                    <td className="max-w-[240px]">
                      <RowLink href={`/people/${p.id}`}>{fullName(p)}</RowLink>
                      <div className="mt-0.5 text-[12px] text-ink-3">
                        {p.role ?? "—"}
                      </div>
                    </td>
                    <td>
                      <Badge value={p.status} vocab={PERSON_STATUS} />
                    </td>
                    <td className="tnum text-ink-2">{p.username ?? "—"}</td>
                    <td className="max-w-[240px]">
                      {p.responsibilities.length === 0 ? (
                        <span className="text-ink-3">—</span>
                      ) : (
                        <span className="text-[12.5px] text-ink-2">
                          {p.responsibilities.slice(0, 3).map((r) => r.area).join(", ")}
                          {p.responsibilities.length > 3
                            ? ` +${p.responsibilities.length - 3}`
                            : ""}
                        </span>
                      )}
                    </td>
                    <td className="text-ink-2">{p.email ?? "—"}</td>
                    <td className="text-ink-2">{p.location ?? "—"}</td>
                    <td className="tnum text-ink-2">{formatDate(p.startDate)}</td>
                    <td className="tnum text-right text-ink-2">
                      {p._count.access}
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
