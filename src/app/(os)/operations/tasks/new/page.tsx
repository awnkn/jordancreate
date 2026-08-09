import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { createTask } from "../../actions";
import { TaskForm } from "../../task-form";

export const dynamic = "force-dynamic";

export default async function NewTaskPage({
  searchParams,
}: PageProps<"/operations/tasks/new">) {
  const { projectId } = await searchParams;
  const projects = await db.project.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader eyebrow="Operations" title="New task" />
      <TaskForm
        projects={projects}
        defaultProjectId={typeof projectId === "string" ? projectId : undefined}
        action={createTask}
        submitLabel="Create task"
        cancelHref="/operations/tasks"
      />
    </>
  );
}
