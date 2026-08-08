import { CancelLink, SubmitButton } from "@/components/form-actions";
import {
  Field,
  FormGrid,
  FormSection,
  Input,
  Select,
  Textarea,
  TopicPicker,
} from "@/components/form";
import { Panel } from "@/components/ui";
import { dateInputValue } from "@/lib/format";
import { CONTENT_FORMAT, CONTENT_STATUS } from "@/lib/taxonomy";
import type { ContentPiece } from "@/lib/models";

export function ContentForm({
  piece,
  projects,
  topics,
  selectedTopicIds = [],
  action,
  submitLabel,
  cancelHref,
}: {
  piece?: ContentPiece | null;
  projects: { id: string; name: string }[];
  topics: { id: string; name: string; category: string }[];
  selectedTopicIds?: string[];
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action}>
      <Panel className="p-5 sm:p-6">
        <FormGrid>
          <Field label="Title" span={2}>
            <Input
              name="title"
              required
              defaultValue={piece?.title ?? ""}
              placeholder="What a summit actually costs"
            />
          </Field>

          <Field label="Format">
            <Select
              name="format"
              options={CONTENT_FORMAT.values}
              defaultValue={piece?.format}
            />
          </Field>

          <Field label="Channel" hint="Where it goes out.">
            <Input
              name="channel"
              defaultValue={piece?.channel ?? ""}
              placeholder="Studio journal"
            />
          </Field>

          <Field label="Status">
            <Select
              name="status"
              options={CONTENT_STATUS.values}
              defaultValue={piece?.status}
            />
          </Field>

          <Field label="Owner">
            <Input
              name="owner"
              defaultValue={piece?.owner ?? ""}
              placeholder="Who is writing it"
            />
          </Field>

          <Field label="Publish date">
            <Input
              type="date"
              name="publishDate"
              defaultValue={dateInputValue(piece?.publishDate)}
            />
          </Field>

          <Field label="Project">
            <select
              name="projectId"
              defaultValue={piece?.projectId ?? ""}
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

          <Field label="Published URL" span={2}>
            <Input
              type="url"
              name="url"
              defaultValue={piece?.url ?? ""}
              placeholder="https://…"
            />
          </Field>

          <Field label="Brief" span={2}>
            <Textarea
              name="brief"
              defaultValue={piece?.brief ?? ""}
              placeholder="The argument, the angle, and who it's for."
            />
          </Field>
        </FormGrid>

        <div className="mt-6">
          <FormSection title="Topics">
            <TopicPicker topics={topics} selected={selectedTopicIds} />
          </FormSection>
        </div>
      </Panel>

      <div className="mt-4 flex items-center gap-2">
        <SubmitButton label={submitLabel} />
        <CancelLink href={cancelHref} />
      </div>
    </form>
  );
}
