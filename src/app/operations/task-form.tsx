import { CancelLink, SubmitButton } from "@/components/form-actions";
import { Field, FormGrid, Input, Select, Textarea } from "@/components/form";
import { Panel } from "@/components/ui";
import { dateInputValue } from "@/lib/format";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/taxonomy";
import type { Task } from "@/lib/models";

export function TaskForm({
  task,
  projects,
  defaultProjectId,
  action,
  submitLabel,
  cancelHref,
}: {
  task?: Task | null;
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action}>
      <Panel className="p-5 sm:p-6">
        <FormGrid>
          <Field label="Task" span={2}>
            <Input
              name="title"
              required
              defaultValue={task?.title ?? ""}
              placeholder="Confirm AV vendor contract"
            />
          </Field>

          <Field label="Project">
            <select
              name="projectId"
              defaultValue={task?.projectId ?? defaultProjectId ?? ""}
              className="select"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Assignee">
            <Input
              name="assignee"
              defaultValue={task?.assignee ?? ""}
              placeholder="Sam"
            />
          </Field>

          <Field label="Status">
            <Select name="status" options={TASK_STATUS.values} defaultValue={task?.status} />
          </Field>

          <Field label="Priority">
            <Select
              name="priority"
              options={TASK_PRIORITY.values}
              defaultValue={task?.priority}
            />
          </Field>

          <Field label="Due date">
            <Input
              type="date"
              name="dueDate"
              defaultValue={dateInputValue(task?.dueDate)}
            />
          </Field>

          <Field label="Notes" span={2}>
            <Textarea
              name="notes"
              defaultValue={task?.notes ?? ""}
              placeholder="Anything the next person needs to know."
            />
          </Field>
        </FormGrid>
      </Panel>

      <div className="mt-4 flex items-center gap-2">
        <SubmitButton label={submitLabel} />
        <CancelLink href={cancelHref} />
      </div>
    </form>
  );
}
