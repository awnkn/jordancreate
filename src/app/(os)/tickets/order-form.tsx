import { CancelLink, SubmitButton } from "@/components/form-actions";
import { Field, FormGrid, Input, Select, Textarea } from "@/components/form";
import { Panel } from "@/components/ui";
import { dateInputValue } from "@/lib/format";
import { TICKET_STATUS, TICKET_TYPE } from "@/lib/taxonomy";
import type { TicketOrder } from "@/lib/models";

export function OrderForm({
  order,
  events,
  defaultEventId,
  action,
  submitLabel,
  cancelHref,
}: {
  order?: TicketOrder | null;
  events: { id: string; name: string }[];
  defaultEventId?: string;
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action}>
      <Panel className="p-5 sm:p-6">
        <FormGrid>
          <Field label="Buyer first name">
            <Input
              name="buyerFirstName"
              required
              defaultValue={order?.buyerFirstName ?? ""}
              placeholder="Jamie"
            />
          </Field>

          <Field label="Buyer last name">
            <Input
              name="buyerLastName"
              required
              defaultValue={order?.buyerLastName ?? ""}
              placeholder="Ortiz"
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              name="email"
              defaultValue={order?.email ?? ""}
              placeholder="jamie@example.com"
            />
          </Field>

          <Field label="Event">
            <select
              name="eventId"
              required
              defaultValue={order?.eventId ?? defaultEventId ?? ""}
              className="select"
            >
              <option value="" disabled>
                Pick an event
              </option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Ticket type">
            <Select
              name="ticketType"
              options={TICKET_TYPE.values}
              defaultValue={order?.ticketType}
            />
          </Field>

          <Field label="Quantity">
            <Input
              name="quantity"
              inputMode="numeric"
              defaultValue={order?.quantity ?? 1}
            />
          </Field>

          <Field label="Amount" hint="Total for the order, not per ticket.">
            <Input
              name="amount"
              inputMode="decimal"
              defaultValue={order?.amount ?? ""}
              placeholder="290"
            />
          </Field>

          <Field label="Status">
            <Select
              name="status"
              options={TICKET_STATUS.values}
              defaultValue={order?.status}
            />
          </Field>

          <Field label="Purchased">
            <Input
              type="date"
              name="purchasedAt"
              defaultValue={dateInputValue(order?.purchasedAt ?? new Date())}
            />
          </Field>

          <Field label="Notes" span={2}>
            <Textarea
              name="notes"
              defaultValue={order?.notes ?? ""}
              placeholder="Dietary needs, accessibility, who they're with."
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
