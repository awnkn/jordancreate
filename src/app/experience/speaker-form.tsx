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
import { SPEAKER_STATUS } from "@/lib/taxonomy";
import type { Speaker } from "@/lib/models";

export function SpeakerForm({
  speaker,
  topics,
  selectedTopicIds = [],
  action,
  submitLabel,
  cancelHref,
}: {
  speaker?: Speaker | null;
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
          <Field label="First name">
            <Input
              name="firstName"
              required
              defaultValue={speaker?.firstName ?? ""}
              placeholder="Maya"
            />
          </Field>

          <Field label="Last name">
            <Input
              name="lastName"
              required
              defaultValue={speaker?.lastName ?? ""}
              placeholder="Okonkwo"
            />
          </Field>

          <Field
            label="Photo URL"
            span={2}
            hint="A square headshot works best — paste a link to an image hosted anywhere."
          >
            <Input
              type="url"
              name="photoUrl"
              defaultValue={speaker?.photoUrl ?? ""}
              placeholder="https://…/maya.jpg"
            />
          </Field>

          <Field label="Role">
            <Input
              name="role"
              defaultValue={speaker?.role ?? ""}
              placeholder="Founder & Creative Director"
            />
          </Field>

          <Field label="Company">
            <Input
              name="company"
              defaultValue={speaker?.company ?? ""}
              placeholder="Field Studio"
            />
          </Field>

          <Field label="Status">
            <Select
              name="status"
              options={SPEAKER_STATUS.values}
              defaultValue={speaker?.status}
            />
          </Field>

          <Field label="Fee" hint="A range is fine at this stage.">
            <Input
              name="fee"
              defaultValue={speaker?.fee ?? ""}
              placeholder="$8k–10k"
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              name="email"
              defaultValue={speaker?.email ?? ""}
              placeholder="maya@fieldstudio.co"
            />
          </Field>

          <Field label="Phone">
            <Input name="phone" defaultValue={speaker?.phone ?? ""} />
          </Field>

          <Field label="Website">
            <Input
              type="url"
              name="website"
              defaultValue={speaker?.website ?? ""}
              placeholder="https://…"
            />
          </Field>

          <Field label="Location">
            <Input
              name="location"
              defaultValue={speaker?.location ?? ""}
              placeholder="Lagos, NG"
            />
          </Field>

          <Field label="Bio" span={2}>
            <Textarea
              name="bio"
              defaultValue={speaker?.bio ?? ""}
              placeholder="Why an audience should want to hear from them."
            />
          </Field>
        </FormGrid>

        <div className="mt-6">
          <FormSection title="Topics they cover">
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
