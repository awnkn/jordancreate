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
  OWNERSHIP_LEVEL,
  PERSON_STATUS,
} from "@/lib/taxonomy";
import {
  createGrantForPerson,
  createResponsibilityForPerson,
  deleteGrant,
  deletePerson,
  deleteResponsibility,
  removeCredentials,
  setCredentials,
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
  const { edit, login } = await searchParams;
  const loginMsg = typeof login === "string" ? login : null;

  const person = await db.person.findUnique({
    where: { id },
    include: {
      access: { orderBy: [{ status: "asc" }, { system: "asc" }] },
      responsibilities: { orderBy: [{ level: "asc" }, { area: "asc" }] },
    },
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
  const addResp = createResponsibilityForPerson.bind(null, person.id);
  const saveLogin = setCredentials.bind(null, person.id);
  const dropLogin = removeCredentials.bind(null, person.id);
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

          <Panel title="Login">
            <div className="px-5 py-4">
              {person.username ? (
                <p className="text-[13px] text-ink-2">
                  Signs in as{" "}
                  <span className="tnum font-medium text-ink">{person.username}</span>.
                  Leave the password blank to keep it.
                </p>
              ) : (
                <p className="text-[13px] text-ink-2">
                  No login yet — set a username and password to give them access
                  to this OS.
                </p>
              )}
              <form action={saveLogin} className="mt-3 space-y-3">
                <Field label="Username">
                  <Input
                    name="username"
                    required
                    defaultValue={person.username ?? ""}
                    placeholder="priya"
                  />
                </Field>
                <Field label={person.username ? "New password" : "Password"}>
                  <Input
                    type="password"
                    name="password"
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                  />
                </Field>
                {loginMsg === "taken" ? (
                  <p className="text-[12.5px] text-tone-danger-fg">
                    That username is already in use by someone else.
                  </p>
                ) : loginMsg === "short" ? (
                  <p className="text-[12.5px] text-tone-danger-fg">
                    The password needs at least 8 characters.
                  </p>
                ) : loginMsg === "saved" ? (
                  <p className="text-[12.5px] text-tone-success-fg">Login saved.</p>
                ) : null}
                <div className="flex items-center gap-2">
                  <SubmitButton
                    label={person.username ? "Update login" : "Create login"}
                    pendingLabel="Saving…"
                  />
                  {person.username ? (
                    <button
                      type="submit"
                      formAction={dropLogin}
                      className="btn btn-danger"
                    >
                      Remove login
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
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

        <div className="space-y-6">
        <Panel title="Roles & responsibilities">
          <form action={addResp} className="border-b border-rule px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_130px_auto]">
              <Field label="Area">
                <Input name="area" required placeholder="Summit logistics" />
              </Field>
              <Field label="Level">
                <Select name="level" options={OWNERSHIP_LEVEL.values} />
              </Field>
              <div className="flex items-end">
                <SubmitButton label="Add" pendingLabel="Adding…" />
              </div>
            </div>
            <div className="mt-3">
              <Field label="What owning it means">
                <Input name="detail" placeholder="Optional — one sentence of scope." />
              </Field>
            </div>
          </form>
          {person.responsibilities.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-ink-3">
              Nothing assigned yet. If it matters and nobody owns it, it lands
              here first.
            </p>
          ) : (
            <ul className="divide-y divide-rule">
              {person.responsibilities.map((r) => {
                const removeResp = deleteResponsibility.bind(null, r.id);
                return (
                  <li
                    key={r.id}
                    className="group flex items-start justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink">{r.area}</span>
                        <Badge value={r.level} vocab={OWNERSHIP_LEVEL} />
                      </div>
                      {r.detail ? (
                        <p className="mt-1 text-[12.5px] text-ink-2">{r.detail}</p>
                      ) : null}
                    </div>
                    <form action={removeResp} className="shrink-0">
                      <button
                        type="submit"
                        className="text-[12px] text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-tone-danger-fg"
                      >
                        Remove
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

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
      </div>
    </>
  );
}
