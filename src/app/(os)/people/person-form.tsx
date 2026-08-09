import { CancelLink, SubmitButton } from "@/components/form-actions";
import { Field, FormGrid, Input, Select, Textarea } from "@/components/form";
import { Panel } from "@/components/ui";
import { dateInputValue } from "@/lib/format";
import { PERSON_STATUS } from "@/lib/taxonomy";
import type { Person } from "@/lib/models";

export function PersonForm({
  person,
  action,
  submitLabel,
  cancelHref,
}: {
  person?: Person | null;
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
              defaultValue={person?.firstName ?? ""}
              placeholder="Priya"
            />
          </Field>

          <Field label="Last name">
            <Input
              name="lastName"
              required
              defaultValue={person?.lastName ?? ""}
              placeholder="Sharma"
            />
          </Field>

          <Field label="Role">
            <Input
              name="role"
              defaultValue={person?.role ?? ""}
              placeholder="Design Director"
            />
          </Field>

          <Field label="Status">
            <Select
              name="status"
              options={PERSON_STATUS.values}
              defaultValue={person?.status}
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              name="email"
              defaultValue={person?.email ?? ""}
              placeholder="priya@jordancreate.co"
            />
          </Field>

          <Field label="Phone">
            <Input name="phone" defaultValue={person?.phone ?? ""} />
          </Field>

          <Field label="Location">
            <Input
              name="location"
              defaultValue={person?.location ?? ""}
              placeholder="Brooklyn, NY"
            />
          </Field>

          <Field label="Started">
            <Input
              type="date"
              name="startDate"
              defaultValue={dateInputValue(person?.startDate)}
            />
          </Field>

          <Field label="Notes" span={2}>
            <Textarea
              name="notes"
              defaultValue={person?.notes ?? ""}
              placeholder="Working days, rate, specialities — whatever the studio needs to remember."
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
