import { CancelLink, SubmitButton } from "@/components/form-actions";
import { Field, FormGrid, Input, Select, Textarea } from "@/components/form";
import { Panel } from "@/components/ui";
import { dateInputValue } from "@/lib/format";
import { SPONSOR_STATUS, SPONSOR_TIER } from "@/lib/taxonomy";
import type { Sponsor } from "@/lib/models";

export function SponsorForm({
  sponsor,
  events,
  action,
  submitLabel,
  cancelHref,
}: {
  sponsor?: Sponsor | null;
  events: { id: string; name: string }[];
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action}>
      <Panel className="p-5 sm:p-6">
        <FormGrid>
          <Field label="Company" span={2}>
            <Input
              name="company"
              required
              defaultValue={sponsor?.company ?? ""}
              placeholder="Northwind Coffee"
            />
          </Field>

          <Field label="Contact first name">
            <Input
              name="contactFirstName"
              defaultValue={sponsor?.contactFirstName ?? ""}
              placeholder="Ana"
            />
          </Field>

          <Field label="Contact last name">
            <Input
              name="contactLastName"
              defaultValue={sponsor?.contactLastName ?? ""}
              placeholder="Duarte"
            />
          </Field>

          <Field label="Contact role">
            <Input
              name="contactRole"
              defaultValue={sponsor?.contactRole ?? ""}
              placeholder="Head of Brand"
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              name="email"
              defaultValue={sponsor?.email ?? ""}
              placeholder="ana@northwind.coffee"
            />
          </Field>

          <Field label="Phone">
            <Input name="phone" defaultValue={sponsor?.phone ?? ""} />
          </Field>

          <Field label="Stage">
            <Select
              name="status"
              options={SPONSOR_STATUS.values}
              defaultValue={sponsor?.status}
            />
          </Field>

          <Field label="Tier">
            <Select
              name="tier"
              options={SPONSOR_TIER.values}
              defaultValue={sponsor?.tier}
            />
          </Field>

          <Field label="Deal value">
            <Input
              name="value"
              inputMode="decimal"
              defaultValue={sponsor?.value ?? ""}
              placeholder="25000"
            />
          </Field>

          <Field label="Expected close">
            <Input
              type="date"
              name="closeDate"
              defaultValue={dateInputValue(sponsor?.closeDate)}
            />
          </Field>

          <Field label="Event">
            <select
              name="eventId"
              defaultValue={sponsor?.eventId ?? ""}
              className="select"
            >
              <option value="">No event yet</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Website">
            <Input
              type="url"
              name="website"
              defaultValue={sponsor?.website ?? ""}
              placeholder="https://…"
            />
          </Field>

          <Field label="Next step" span={2} hint="The one concrete thing that moves this deal.">
            <Input
              name="nextStep"
              defaultValue={sponsor?.nextStep ?? ""}
              placeholder="Send the gold-tier proposal by Friday"
            />
          </Field>

          <Field label="Notes" span={2}>
            <Textarea
              name="notes"
              defaultValue={sponsor?.notes ?? ""}
              placeholder="Budget cycle, decision makers, history with the studio."
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
