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
import { GUEST_CATEGORY, GUEST_FORMAT, GUEST_STATUS } from "@/lib/taxonomy";
import type { Guest } from "@/lib/models";

export function GuestForm({
  guest,
  topics,
  selectedTopicIds = [],
  action,
  submitLabel,
  cancelHref,
}: {
  guest?: Guest | null;
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
              defaultValue={guest?.firstName ?? ""}
              placeholder="Alina"
            />
          </Field>

          <Field label="Last name">
            <Input
              name="lastName"
              required
              defaultValue={guest?.lastName ?? ""}
              placeholder="Petrov"
            />
          </Field>

          <Field label="Category" hint="Which roster this guest belongs to.">
            <Select
              name="category"
              options={GUEST_CATEGORY.values}
              defaultValue={guest?.category}
            />
          </Field>

          <Field label="Outlet">
            <Input
              name="outlet"
              defaultValue={guest?.outlet ?? ""}
              placeholder="Overlap"
            />
          </Field>

          <Field label="Show or column" hint="Leave blank for straight press.">
            <Input
              name="showName"
              defaultValue={guest?.showName ?? ""}
              placeholder="The Overlap Podcast"
            />
          </Field>

          <Field label="Format">
            <Select
              name="format"
              options={GUEST_FORMAT.values}
              defaultValue={guest?.format}
            />
          </Field>

          <Field label="Status">
            <Select
              name="status"
              options={GUEST_STATUS.values}
              defaultValue={guest?.status}
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              name="email"
              defaultValue={guest?.email ?? ""}
              placeholder="alina@overlap.fm"
            />
          </Field>

          <Field label="Phone">
            <Input name="phone" defaultValue={guest?.phone ?? ""} />
          </Field>

          <Field label="Audience size" hint="Listeners, readers or subscribers.">
            <Input
              name="audienceSize"
              inputMode="numeric"
              defaultValue={guest?.audienceSize ?? ""}
              placeholder="42000"
            />
          </Field>

          <Field label="Scheduled for">
            <Input
              type="date"
              name="scheduledFor"
              defaultValue={dateInputValue(guest?.scheduledFor)}
            />
          </Field>

          <Field label="Published URL" span={2}>
            <Input
              type="url"
              name="publishedUrl"
              defaultValue={guest?.publishedUrl ?? ""}
              placeholder="https://…"
            />
          </Field>

          <Field label="Angle" span={2} hint="The story we're actually pitching.">
            <Textarea
              name="angle"
              defaultValue={guest?.angle ?? ""}
              placeholder="Why the studio stopped taking retainer work."
            />
          </Field>

          <Field label="Notes" span={2}>
            <Textarea
              name="notes"
              defaultValue={guest?.notes ?? ""}
              placeholder="Prep notes, preferences, anything worth remembering next time."
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
