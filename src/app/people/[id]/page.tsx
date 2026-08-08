import Link from "next/link";
import { notFound } from "next/navigation";
import { Field, Input, Select } from "@/components/form";
import { DeleteButton, SubmitButton } from "@/components/form-actions";
import {
  Badge,
  Detail,
  DetailList,
  LinkOut,
  PageHeader,
  Panel,
} from "@/components/ui";
import { db } from "@/lib/db";
import { dateInputValue, formatDate, fullName, relativeDays } from "@/lib/format";
import {
  ACCESS_LEVEL,
  ACCESS_STATUS,
  PERSON_STATUS,
} from "@/lib/taxonomy";
import {
  createGrantForPerson,
  deleteGrant,
  deletePerson,
  setGrantStatus,
  updatePerson,
} from "../actions";
import { PersonForm } from "../person-form";

export const dynamic = "force-dynamic";

export default async function PersonPage({
  params,
  searchParams,
}: PageProps<"/people/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const person = await db.person.findUnique({
    where: { id },
    include: { access: { orderBy: [{ status: "asc" }, { system: "asc" }] } },
  });

  if (!person) notFound();

  if (edit !== undefined) {
    const update = updatePerson.bind(null, person.id);
    return (
      <>
        <PageHeader eyebrow="People" title={`Edit ${fullName(person)}`} />
        <PersonForm
          person={person}
          action={update}
          submitLabel="Save changes"
          cancelHref={`/people/${person.id}`}
        />
      </>
    );
  }

  const addGrant = createGrantForPerson.bind(null, person.id);
  const del = deletePerson.bind(null, person.id);

  return (
    <>
      <PageHeader
        eyebrow="People"
        title={fullName(person)}
        lede={person.role ?? undefined}
        actions={
          <>
            <Link href={`/people/${person.id}?edit`} className="btn">
              Edit
            </Link>
            <DeleteButton
              action={del}
              confirmText={`Remove ${fullName(person)}? Their ${person.access.length} access grant(s) go too.`}
            />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <DetailList>
              <Detail label="Status">
                <Badge value={person.status} vocab={PERSON_STATUS} />
              </Detail>
              <Detail label="Email">
                {person.email ? (
                  <a
                    href={`mailto:${person.email}`}
                    className="text-clay hover:underline"
                  >
                    {person.email}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label="Phone">{person.phone ?? "—"}</Detail>
              <Detail label="Location">{person.location ?? "—"}</Detail>
              <Detail label="Since">
                {person.startDate ? (
                  <>
                    {formatDate(person.startDate)}
                    <span className="ml-2 text-[12px] text-ink-3">
                      {relativeDays(person.startDate)}
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </Detail>
            </DetailList>
          </Panel>

          <Panel title="Notes">
            <div className="px-5 py-4">
              {person.notes ? (
                <p className="whitespace-pre-wrap text-ink">{person.notes}</p>
              ) : (
                <p className="text-[13px] text-ink-3">No notes yet.</p>
              )}
            </div>
          </Panel>
        </div>

        <Panel title="Access">
          <form action={addGrant} className="border-b border-rule px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_130px_130px_auto]">
              <Field label="System">
                <Input name="system" required placeholder="Figma" />
              </Field>
              <Field label="Level">
                <Select name="level" options={ACCESS_LEVEL.values} />
              </Field>
              <Field label="Status">
                <Select name="status" options={ACCESS_STATUS.values} />
              </Field>
              <div className="flex items-end">
                <SubmitButton label="Grant" pendingLabel="Granting…" />
              </div>
            </div>
            <input type="hidden" name="grantedAt" value={dateInputValue(new Date())} />
          </form>

          {person.access.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-ink-3">
              No access on record. When someone leaves, this list is the
              offboarding checklist — keep it honest.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th className="pt-4">System</th>
                    <th className="pt-4">Level</th>
                    <th className="pt-4">Status</th>
                    <th className="pt-4">Granted</th>
                    <th className="pt-4" />
                  </tr>
                </thead>
                <tbody>
                  {person.access.map((g) => {
                    const revoke = setGrantStatus.bind(null, g.id, "Revoked");
                    const restore = setGrantStatus.bind(null, g.id, "Active");
                    const remove = deleteGrant.bind(null, g.id);
                    return (
                      <tr key={g.id}>
                        <td className="font-medium text-ink">
                          {g.url ? <LinkOut href={g.url} label={g.system} /> : g.system}
                        </td>
                        <td>
                          <Badge value={g.level} vocab={ACCESS_LEVEL} />
                        </td>
                        <td>
                          <Badge value={g.status} vocab={ACCESS_STATUS} />
                        </td>
                        <td className="tnum text-ink-2">{formatDate(g.grantedAt)}</td>
                        <td>
                          <div className="flex items-center justify-end gap-3">
                            <form action={g.status === "Revoked" ? restore : revoke}>
                              <button
                                type="submit"
                                className="text-[12.5px] whitespace-nowrap text-ink-3 hover:text-clay"
                              >
                                {g.status === "Revoked" ? "Restore" : "Revoke"}
                              </button>
                            </form>
                            <form action={remove}>
                              <button
                                type="submit"
                                className="text-[12.5px] whitespace-nowrap text-ink-3 hover:text-tone-danger-fg"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
