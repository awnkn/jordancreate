import { Field, Input, Select, Textarea } from "@/components/form";
import { SubmitButton } from "@/components/form-actions";
import { Chip, Panel } from "@/components/ui";
import { dateInputValue, formatDate, relativeDays } from "@/lib/format";
import { INTERACTION_KIND } from "@/lib/taxonomy";
import type { Interaction } from "@/lib/models";

/**
 * Contact history for a speaker or a guest. Both sides of the app use this —
 * only the bound actions differ.
 */
export function InteractionLog({
  interactions,
  logAction,
  deleteAction,
  emptyBody,
}: {
  interactions: Interaction[];
  logAction: (form: FormData) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  emptyBody: string;
}) {
  const today = dateInputValue(new Date());

  return (
    <Panel title="Contact history">
      <form action={logAction} className="border-b border-rule px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
          <Field label="Kind">
            <Select name="kind" options={INTERACTION_KIND.values} />
          </Field>
          <Field label="Date">
            <Input type="date" name="occurredAt" defaultValue={today} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="What happened">
            <Textarea
              name="summary"
              required
              placeholder="Sent the offer at $6k plus travel. Awaiting reply."
              className="min-h-[64px]"
            />
          </Field>
        </div>
        <div className="mt-3">
          <SubmitButton label="Log it" pendingLabel="Logging…" />
        </div>
      </form>

      {interactions.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-ink-3">{emptyBody}</p>
      ) : (
        <ol className="divide-y divide-rule">
          {interactions.map((entry) => {
            const remove = deleteAction.bind(null, entry.id);
            return (
              <li key={entry.id} className="group flex gap-3 px-5 py-3.5">
                <div className="w-[104px] shrink-0">
                  <div className="tnum text-[12.5px] text-ink-2">
                    {formatDate(entry.occurredAt)}
                  </div>
                  <div className="text-[11px] text-ink-3">
                    {relativeDays(entry.occurredAt)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <Chip>{entry.kind}</Chip>
                  <p className="mt-1.5 whitespace-pre-wrap text-ink">
                    {entry.summary}
                  </p>
                </div>
                <form action={remove} className="shrink-0">
                  <button
                    type="submit"
                    className="text-[12px] text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-tone-danger-fg"
                    aria-label="Delete this log entry"
                  >
                    Delete
                  </button>
                </form>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
