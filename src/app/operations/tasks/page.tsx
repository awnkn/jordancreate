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
import { daysFromToday, formatDate } from "@/lib/format";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/taxonomy";
import { setTaskStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: PageProps<"/operations/tasks">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : null;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [tasks, all] = await Promise.all([
    db.task.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? { OR: [{ title: { contains: q } }, { assignee: { contains: q } }] }
          : {}),
      },
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    }),
    db.task.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Tasks"
        lede="Everything the studio owes, across every project — sorted by what's due first."
        actions={
          <Link href="/operations/tasks/new" className="btn btn-primary">
            New task
          </Link>
        }
      />

      <Toolbar>
        <FilterBar
          basePath="/operations/tasks"
          options={TASK_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath="/operations/tasks"
          placeholder="Search tasks…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {tasks.length === 0 ? (
          <EmptyState
            title={q || status ? "Nothing matches that filter" : "No tasks yet"}
            body={
              q || status
                ? "Try a different status, or clear the search."
                : "Add the first thing somebody actually has to do."
            }
            action={
              q || status ? (
                <Link href="/operations/tasks" className="btn">
                  Clear filters
                </Link>
              ) : (
                <Link href="/operations/tasks/new" className="btn btn-primary">
                  Add a task
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Task</th>
                  <th className="pt-4">Project</th>
                  <th className="pt-4">Status</th>
                  <th className="pt-4">Priority</th>
                  <th className="pt-4">Assignee</th>
                  <th className="pt-4">Due</th>
                  <th className="pt-4" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const markDone = setTaskStatus.bind(null, t.id, "Done");
                  const reopen = setTaskStatus.bind(null, t.id, "Todo");
                  return (
                    <tr key={t.id}>
                      <td className="max-w-[300px]">
                        <RowLink href={`/operations/tasks/${t.id}`}>
                          {t.title}
                        </RowLink>
                      </td>
                      <td className="text-ink-2">
                        {t.project ? (
                          <Link
                            href={`/operations/${t.project.id}`}
                            className="hover:text-clay"
                          >
                            {t.project.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <Badge value={t.status} vocab={TASK_STATUS} />
                      </td>
                      <td>
                        <Badge value={t.priority} vocab={TASK_PRIORITY} />
                      </td>
                      <td className="text-ink-2">{t.assignee ?? "—"}</td>
                      <td>
                        <DueDate
                          date={formatDate(t.dueDate)}
                          days={daysFromToday(t.dueDate)}
                          closed={t.status === "Done"}
                        />
                      </td>
                      <td className="text-right">
                        <form action={t.status === "Done" ? reopen : markDone}>
                          <button
                            type="submit"
                            className="text-[12.5px] whitespace-nowrap text-ink-3 hover:text-clay"
                          >
                            {t.status === "Done" ? "Reopen" : "Mark done"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
