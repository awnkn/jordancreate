import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form-actions";
import {
  Badge,
  Chip,
  Detail,
  DetailList,
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
import {
  CLOSED_STATUSES,
  CONTENT_STATUS,
  EVENT_STATUS,
  PROJECT_STATUS,
  TASK_PRIORITY,
  TASK_STATUS,
} from "@/lib/taxonomy";
import { deleteProject, updateProject } from "../actions";
import { ProjectForm } from "../project-form";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
  searchParams,
}: PageProps<"/operations/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
      content: { orderBy: { publishDate: "asc" } },
      events: { orderBy: { startDate: "asc" } },
    },
  });

  if (!project) notFound();

  if (edit !== undefined) {
    const update = updateProject.bind(null, project.id);
    return (
      <>
        <PageHeader
          eyebrow="Operations · Project"
          title={`Edit ${project.name}`}
        />
        <ProjectForm
          project={project}
          action={update}
          submitLabel="Save changes"
          cancelHref={`/operations/${project.id}`}
        />
      </>
    );
  }

  const done = project.tasks.filter((t) => t.status === "Done").length;
  const open = project.tasks.length - done;
  const del = deleteProject.bind(null, project.id);

  return (
    <>
      <PageHeader
        eyebrow="Operations · Project"
        title={project.name}
        lede={project.summary ?? undefined}
        actions={
          <>
            <Link href={`/operations/${project.id}?edit`} className="btn">
              Edit
            </Link>
            <DeleteButton
              action={del}
              confirmText={`Delete "${project.name}"? Its tasks, content and events will be kept but unassigned.`}
            />
          </>
        }
      />

      <StatRow>
        <Stat label="Status" value={project.status} />
        <Stat
          label="Open tasks"
          value={open}
          hint={`${done} of ${project.tasks.length} done`}
        />
        <Stat
          label="Due"
          value={project.dueDate ? formatDate(project.dueDate) : "—"}
          hint={
            project.dueDate && !CLOSED_STATUSES.has(project.status)
              ? `${daysFromToday(project.dueDate)} days out`
              : undefined
          }
        />
        <Stat label="Budget" value={formatMoney(project.budget)} />
      </StatRow>

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <Panel title="Details">
          <DetailList>
            <Detail label="Client">{project.client ?? "—"}</Detail>
            <Detail label="Owner">{project.owner ?? "—"}</Detail>
            <Detail label="Status">
              <Badge value={project.status} vocab={PROJECT_STATUS} />
            </Detail>
            <Detail label="Start">{formatDate(project.startDate)}</Detail>
            <Detail label="Due">{formatDate(project.dueDate)}</Detail>
            <Detail label="Budget">{formatMoney(project.budget)}</Detail>
          </DetailList>
        </Panel>

        <div className="space-y-6">
          <Panel
            title="Tasks"
            action={
              <Link
                href={`/operations/tasks/new?projectId=${project.id}`}
                className="text-[12.5px] text-clay hover:underline"
              >
                Add task
              </Link>
            }
          >
            {project.tasks.length === 0 ? (
              <EmptyState
                title="No tasks on this project"
                body="Break the work down so the studio can see what's next."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="grid-table">
                  <thead>
                    <tr>
                      <th className="pt-4">Task</th>
                      <th className="pt-4">Status</th>
                      <th className="pt-4">Priority</th>
                      <th className="pt-4">Assignee</th>
                      <th className="pt-4">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.tasks.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <RowLink href={`/operations/tasks/${t.id}`}>
                            {t.title}
                          </RowLink>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <div className="grid gap-6 sm:grid-cols-2">
            <Panel title="Linked content">
              {project.content.length === 0 ? (
                <p className="px-5 py-5 text-[13px] text-ink-3">
                  Nothing scheduled against this project.
                </p>
              ) : (
                <ul className="divide-y divide-rule">
                  {project.content.map((c) => (
                    <li key={c.id} className="px-5 py-3">
                      <RowLink href={`/content/${c.id}`}>{c.title}</RowLink>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge value={c.status} vocab={CONTENT_STATUS} />
                        <Chip>{c.format}</Chip>
                        <span className="text-[12px] text-ink-3">
                          {formatDate(c.publishDate)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Linked experiences">
              {project.events.length === 0 ? (
                <p className="px-5 py-5 text-[13px] text-ink-3">
                  No events run under this project.
                </p>
              ) : (
                <ul className="divide-y divide-rule">
                  {project.events.map((e) => (
                    <li key={e.id} className="px-5 py-3">
                      <RowLink href={`/experience/${e.id}`}>{e.name}</RowLink>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge value={e.status} vocab={EVENT_STATUS} />
                        <span className="text-[12px] text-ink-3">
                          {formatDate(e.startDate)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
