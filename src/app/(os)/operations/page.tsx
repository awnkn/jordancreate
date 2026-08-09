import Link from "next/link";
import { FilterBar, SearchBox, Toolbar } from "@/components/filters";
import {
  Badge,
  DueDate,
  EmptyState,
  PageHeader,
  Panel,
  RowLink,
} from "@/components/ui";
import { db } from "@/lib/db";
import { daysFromToday, formatDate, formatMoney } from "@/lib/format";
import { CLOSED_STATUSES, PROJECT_STATUS } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: PageProps<"/operations">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : null;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [projects, all] = await Promise.all([
    db.project.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { client: { contains: q } },
                { owner: { contains: q } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { tasks: true } } },
      orderBy: [{ dueDate: "asc" }, { name: "asc" }],
    }),
    db.project.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Projects"
        lede="Every engagement the studio has committed to, and what it owes."
        actions={
          <Link href="/operations/new" className="btn btn-primary">
            New project
          </Link>
        }
      />

      <Toolbar>
        <FilterBar
          basePath="/operations"
          options={PROJECT_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath="/operations"
          placeholder="Search projects…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {projects.length === 0 ? (
          <EmptyState
            title={q || status ? "Nothing matches that filter" : "No projects yet"}
            body={
              q || status
                ? "Try a different status, or clear the search."
                : "Projects are the spine of the OS — tasks, content and events all hang off them."
            }
            action={
              q || status ? (
                <Link href="/operations" className="btn">
                  Clear filters
                </Link>
              ) : (
                <Link href="/operations/new" className="btn btn-primary">
                  Add the first project
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Project</th>
                  <th className="pt-4">Client</th>
                  <th className="pt-4">Status</th>
                  <th className="pt-4">Owner</th>
                  <th className="pt-4">Tasks</th>
                  <th className="pt-4">Due</th>
                  <th className="pt-4 text-right">Budget</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td className="max-w-[280px]">
                      <RowLink href={`/operations/${p.id}`}>{p.name}</RowLink>
                    </td>
                    <td className="text-ink-2">{p.client ?? "—"}</td>
                    <td>
                      <Badge value={p.status} vocab={PROJECT_STATUS} />
                    </td>
                    <td className="text-ink-2">{p.owner ?? "—"}</td>
                    <td className="tnum text-ink-2">{p._count.tasks}</td>
                    <td>
                      <DueDate
                        date={formatDate(p.dueDate)}
                        days={daysFromToday(p.dueDate)}
                        closed={CLOSED_STATUSES.has(p.status)}
                      />
                    </td>
                    <td className="tnum text-right text-ink-2">
                      {formatMoney(p.budget)}
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
