import { CancelLink, SubmitButton } from "@/components/form-actions";
import {
  Field,
  FormGrid,
  FormSection,
  Input,
  Select,
  Textarea,
} from "@/components/form";
import { Panel } from "@/components/ui";
import { dateInputValue } from "@/lib/format";
import { VENDOR_KIND, VENDOR_STATUS } from "@/lib/taxonomy";
import type { Vendor } from "@/lib/models";

export function VendorForm({
  vendor,
  defaultKind,
  action,
  submitLabel,
  cancelHref,
}: {
  vendor?: Vendor | null;
  defaultKind?: string;
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
              defaultValue={vendor?.company ?? ""}
              placeholder="Brightline AV"
            />
          </Field>

          <Field label="Kind" hint="Supplier, or a partner renting space here.">
            <Select
              name="kind"
              options={VENDOR_KIND.values}
              defaultValue={vendor?.kind ?? defaultKind}
            />
          </Field>

          <Field label="Status">
            <Select
              name="status"
              options={VENDOR_STATUS.values}
              defaultValue={vendor?.status}
            />
          </Field>

          <Field label="Contact first name">
            <Input
              name="contactFirstName"
              defaultValue={vendor?.contactFirstName ?? ""}
              placeholder="Lou"
            />
          </Field>

          <Field label="Contact last name">
            <Input
              name="contactLastName"
              defaultValue={vendor?.contactLastName ?? ""}
              placeholder="Marchetti"
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              name="email"
              defaultValue={vendor?.email ?? ""}
              placeholder="lou@brightline.av"
            />
          </Field>

          <Field label="Phone">
            <Input name="phone" defaultValue={vendor?.phone ?? ""} />
          </Field>

          <Field label="Website" span={2}>
            <Input
              type="url"
              name="website"
              defaultValue={vendor?.website ?? ""}
              placeholder="https://…"
            />
          </Field>
        </FormGrid>

        <div className="mt-6 space-y-6">
          <FormSection title="Supplier details">
            <FormGrid>
              <Field label="Service" span={2} hint="What they supply the studio.">
                <Input
                  name="service"
                  defaultValue={vendor?.service ?? ""}
                  placeholder="Stage AV, lighting and playback"
                />
              </Field>
            </FormGrid>
          </FormSection>

          <FormSection title="Space rental details">
            <FormGrid>
              <Field label="Space" hint="Which part of the building they rent.">
                <Input
                  name="spaceName"
                  defaultValue={vendor?.spaceName ?? ""}
                  placeholder="Studio B"
                />
              </Field>

              <Field label="Monthly rent">
                <Input
                  name="monthlyRent"
                  inputMode="decimal"
                  defaultValue={vendor?.monthlyRent ?? ""}
                  placeholder="2400"
                />
              </Field>

              <Field label="Lease start">
                <Input
                  type="date"
                  name="leaseStart"
                  defaultValue={dateInputValue(vendor?.leaseStart)}
                />
              </Field>

              <Field label="Lease end">
                <Input
                  type="date"
                  name="leaseEnd"
                  defaultValue={dateInputValue(vendor?.leaseEnd)}
                />
              </Field>
            </FormGrid>
          </FormSection>

          <FormSection title="Notes">
            <Textarea
              name="notes"
              defaultValue={vendor?.notes ?? ""}
              placeholder="Terms, history, who to call when something breaks."
            />
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
