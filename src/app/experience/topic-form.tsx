import { CancelLink, SubmitButton } from "@/components/form-actions";
import { Field, FormGrid, Input, Select, Textarea } from "@/components/form";
import { Panel } from "@/components/ui";
import { TOPIC_CATEGORY, TOPIC_STATUS } from "@/lib/taxonomy";
import type { Topic } from "@/lib/models";

export function TopicForm({
  topic,
  action,
  submitLabel,
  cancelHref,
}: {
  topic?: Topic | null;
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action}>
      <Panel className="p-5 sm:p-6">
        <FormGrid>
          <Field label="Topic" span={2}>
            <Input
              name="name"
              required
              defaultValue={topic?.name ?? ""}
              placeholder="Brand Systems"
            />
          </Field>

          <Field label="Category">
            <Select
              name="category"
              options={TOPIC_CATEGORY.values}
              defaultValue={topic?.category}
            />
          </Field>

          <Field label="Status" hint="Retired topics stay searchable but stop being pitched.">
            <Select
              name="status"
              options={TOPIC_STATUS.values}
              defaultValue={topic?.status}
            />
          </Field>

          <Field label="Description" span={2}>
            <Textarea
              name="description"
              defaultValue={topic?.description ?? ""}
              placeholder="The angle in one sentence — what makes this worth an hour of someone's attention."
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
