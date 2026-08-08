import { CancelLink, SubmitButton } from "@/components/form-actions";
import { Field, FormGrid, Input, Select, Textarea } from "@/components/form";
import { Panel } from "@/components/ui";
import { dateInputValue } from "@/lib/format";
import { PROJECT_STATUS } from "@/lib/taxonomy";
import type { Project } from "@/lib/models";

export function ProjectForm({
  project,
  action,
  submitLabel,
  cancelHref,
}: {
  project?: Project | null;
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action}>
      <Panel className="p-5 sm:p-6">
        <FormGrid>
          <Field label="Project name" span={2}>
            <Input
              name="name"
              required
              defaultValue={project?.name ?? ""}
              placeholder="Northwind Rebrand"
            />
          </Field>

          <Field label="Client">
            <Input
              name="client"
              defaultValue={project?.client ?? ""}
              placeholder="Northwind Coffee"
            />
          </Field>

          <Field label="Owner">
            <Input
              name="owner"
              defaultValue={project?.owner ?? ""}
              placeholder="Who is accountable"
            />
          </Field>

          <Field label="Status">
            <Select
              name="status"
              options={PROJECT_STATUS.values}
              defaultValue={project?.status}
            />
          </Field>

          <Field label="Budget" hint="Total fee, excluding pass-through costs.">
            <Input
              name="budget"
              inputMode="decimal"
              defaultValue={project?.budget ?? ""}
              placeholder="88000"
            />
          </Field>

          <Field label="Start date">
            <Input
              type="date"
              name="startDate"
              defaultValue={dateInputValue(project?.startDate)}
            />
          </Field>

          <Field label="Due date">
            <Input
              type="date"
              name="dueDate"
              defaultValue={dateInputValue(project?.dueDate)}
            />
          </Field>

          <Field label="Summary" span={2}>
            <Textarea
              name="summary"
              defaultValue={project?.summary ?? ""}
              placeholder="What this project actually delivers, in a sentence or two."
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
