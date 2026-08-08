import { CancelLink, SubmitButton } from "@/components/form-actions";
import { Field, FormGrid, Input, Select, Textarea } from "@/components/form";
import { Panel } from "@/components/ui";
import { dateInputValue } from "@/lib/format";
import { EVENT_FORMAT, EVENT_STATUS } from "@/lib/taxonomy";
import type { Event } from "@/lib/models";

export function EventForm({
  event,
  projects,
  action,
  submitLabel,
  cancelHref,
}: {
  event?: Event | null;
  projects: { id: string; name: string }[];
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action}>
      <Panel className="p-5 sm:p-6">
        <FormGrid>
          <Field label="Event name" span={2}>
            <Input
              name="name"
              required
              defaultValue={event?.name ?? ""}
              placeholder="Create Summit 2026"
            />
          </Field>

          <Field label="Format">
            <Select
              name="format"
              options={EVENT_FORMAT.values}
              defaultValue={event?.format}
            />
          </Field>

          <Field label="Status">
            <Select
              name="status"
              options={EVENT_STATUS.values}
              defaultValue={event?.status}
            />
          </Field>

          <Field label="Venue">
            <Input
              name="venue"
              defaultValue={event?.venue ?? ""}
              placeholder="The Foundry"
            />
          </Field>

          <Field label="City">
            <Input
              name="city"
              defaultValue={event?.city ?? ""}
              placeholder="Brooklyn, NY"
            />
          </Field>

          <Field label="Start date">
            <Input
              type="date"
              name="startDate"
              defaultValue={dateInputValue(event?.startDate)}
            />
          </Field>

          <Field label="End date" hint="Leave blank for a single-day event.">
            <Input
              type="date"
              name="endDate"
              defaultValue={dateInputValue(event?.endDate)}
            />
          </Field>

          <Field label="Capacity">
            <Input
              name="capacity"
              inputMode="numeric"
              defaultValue={event?.capacity ?? ""}
              placeholder="450"
            />
          </Field>

          <Field label="Project">
            <select
              name="projectId"
              defaultValue={event?.projectId ?? ""}
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

          <Field label="Summary" span={2}>
            <Textarea
              name="summary"
              defaultValue={event?.summary ?? ""}
              placeholder="What this event is for, and who it's for."
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
