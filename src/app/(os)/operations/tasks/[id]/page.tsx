import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form-actions";
import {
  Badge,
  Detail,
  DetailList,
  PageHeader,
  Panel,
} from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate, relativeDays } from "@/lib/format";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/taxonomy";
import { deleteTask, updateTask } from "../../actions";
import { TaskForm } from "../../task-form";

export const dynamic = "force-dynamic";

export default async function TaskPage({
  params,
  searchParams,
}: PageProps<"/operations/tasks/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [task, projects] = await Promise.all([
    db.task.findUnique({
      where: { id },
      include: { project: { select: { id: true, name: true } } },
    }),
    db.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!task) notFound();

  if (edit !== undefined) {
    const update = updateTask.bind(null, task.id);
    return (
      <>
        <PageHeader eyebrow="Operations · Task" title={`Edit ${task.title}`} />
        <TaskForm
          task={task}
          projects={projects}
          action={update}
          submitLabel="Save changes"
          cancelHref={`/operations/tasks/${task.id}`}
        />
      </>
    );
  }

  const del = deleteTask.bind(null, task.id);

  return (
    <>
      <PageHeader
        eyebrow="Operations · Task"
        title={task.title}
        actions={
          <>
            <Link href={`/operations/tasks/${task.id}?edit`} className="btn">
              Edit
            </Link>
            <DeleteButton
              action={del}
              confirmText={`Delete "${task.title}"? This can't be undone.`}
            />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
        <Panel title="Details">
          <DetailList>
            <Detail label="Status">
              <Badge value={task.status} vocab={TASK_STATUS} />
            </Detail>
            <Detail label="Priority">
              <Badge value={task.priority} vocab={TASK_PRIORITY} />
            </Detail>
            <Detail label="Assignee">{task.assignee ?? "Unassigned"}</Detail>
            <Detail label="Project">
              {task.project ? (
                <Link
                  href={`/operations/${task.project.id}`}
                  className="text-clay hover:underline"
                >
                  {task.project.name}
                </Link>
              ) : (
                "—"
              )}
            </Detail>
            <Detail label="Due">
              {task.dueDate ? (
                <>
                  {formatDate(task.dueDate)}
                  <span className="ml-2 text-[12px] text-ink-3">
                    {relativeDays(task.dueDate)}
                  </span>
                </>
              ) : (
                "—"
              )}
            </Detail>
            <Detail label="Created">{formatDate(task.createdAt)}</Detail>
          </DetailList>
        </Panel>

        <Panel title="Notes">
          <div className="px-5 py-4">
            {task.notes ? (
              <p className="whitespace-pre-wrap text-ink">{task.notes}</p>
            ) : (
              <p className="text-[13px] text-ink-3">
                No notes on this task yet.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
