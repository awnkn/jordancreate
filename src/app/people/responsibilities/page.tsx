import Link from "next/link";
import { SearchBox, Toolbar } from "@/components/filters";
import { Field, Input, Select } from "@/components/form";
import { SubmitButton } from "@/components/form-actions";
import {
  Badge,
  EmptyState,
  PageHeader,
  Panel,
  Stat,
  StatRow,
} from "@/components/ui";
import { db } from "@/lib/db";
import { fullName } from "@/lib/format";
import { OWNERSHIP_LEVEL } from "@/lib/taxonomy";
import { createResponsibility, deleteResponsibility } from "../actions";

export const dynamic = "force-dynamic";

/** The accountability chart: who owns what, across the whole team. */
export default async function ResponsibilitiesPage({
  searchParams,
}: PageProps<"/people/responsibilities">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [people, rows] = await Promise.all([
    db.person.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    db.responsibility.findMany({
      where: q
        ? {
            OR: [
              { area: { contains: q, mode: "insensitive" } },
              { detail: { contains: q, mode: "insensitive" } },
              { person: { firstName: { contains: q, mode: "insensitive" } } },
              { person: { lastName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {},
      include: {
        person: {
          select: { id: true, firstName: true, lastName: true, role: true, status: true },
        },
      },
      orderBy: [{ level: "asc" }, { area: "asc" }],
    }),
  ]);

  // Group by person, keeping people with the most ownership on top.
  const byPerson = new Map<string, { person: (typeof rows)[number]["person"]; items: typeof rows }>();
  for (const r of rows) {
    const entry = byPerson.get(r.person.id) ?? { person: r.person, items: [] as typeof rows };
    entry.items.push(r);
    byPerson.set(r.person.id, entry);
  }
  const groups = [...byPerson.values()].sort(
    (a, b) =>
      b.items.filter((i) => i.level === "Owner").length -
      a.items.filter((i) => i.level === "Owner").length,
  );

  const owned = rows.filter((r) => r.level === "Owner").length;
  const covered = people.filter((p) => byPerson.has(p.id)).length;

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Roles & responsibilities"
        lede="Who owns what across Jordan Create — so nothing important belongs to nobody."
      />

      <StatRow>
        <Stat label="Areas tracked" value={rows.length} hint="across the team" />
        <Stat label="Owned outright" value={owned} hint="have a named owner" />
        <Stat
          label="People covered"
          value={`${covered} / ${people.length}`}
          hint="team members with responsibilities"
        />
        <Stat
          label="Without any"
          value={people.length - covered}
          hint={people.length - covered > 0 ? "needs assigning" : "everyone owns something"}
        />
      </StatRow>

      <Panel title="Assign a responsibility" className="mb-6">
        <form action={createResponsibility} className="px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_130px_auto]">
            <Field label="Area" hint="One clear thing, e.g. “Summit logistics”.">
              <Input name="area" required placeholder="Summit logistics" />
            </Field>
            <Field label="Person">
              <select name="personId" className="select" required>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {fullName(p)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Level">
              <Select name="level" options={OWNERSHIP_LEVEL.values} />
            </Field>
            <div className="flex items-end">
              <SubmitButton label="Assign" pendingLabel="Assigning…" />
            </div>
          </div>
          <div className="mt-3">
            <Field label="What owning it means" hint="Optional — one sentence of scope.">
              <Input name="detail" placeholder="Venue, travel, AV, and the run-of-show doc." />
            </Field>
          </div>
        </form>
      </Panel>

      <Toolbar>
        <div />
        <SearchBox
          basePath="/people/responsibilities"
          placeholder="Search areas or people…"
          query={q}
        />
      </Toolbar>

      {groups.length === 0 ? (
        <Panel>
          <EmptyState
            title={q ? "Nothing matches that search" : "Nothing assigned yet"}
            body={
              q
                ? "Try a different area or name."
                : "Start with the scary ones — the things everyone assumes someone else owns."
            }
          />
        </Panel>
      ) : (
        <div className="space-y-6">
          {groups.map(({ person, items }) => (
            <Panel
              key={person.id}
              title={`${fullName(person)}${person.role ? ` — ${person.role}` : ""}`}
              action={
                <Link
                  href={`/people/${person.id}`}
                  className="text-[12.5px] text-clay hover:underline"
                >
                  Profile
                </Link>
              }
            >
              <ul className="divide-y divide-rule">
                {items.map((r) => {
                  const remove = deleteResponsibility.bind(null, r.id);
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
                      <form action={remove} className="shrink-0">
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
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
