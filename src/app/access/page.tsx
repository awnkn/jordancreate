import Link from "next/link";
import { Field, Input, Select } from "@/components/form";
import { SubmitButton } from "@/components/form-actions";
import { FilterBar, SearchBox, Toolbar } from "@/components/filters";
import {
  Badge,
  EmptyState,
  LinkOut,
  PageHeader,
  Panel,
  RowLink,
  Stat,
  StatRow,
} from "@/components/ui";
import { db } from "@/lib/db";
import { dateInputValue, formatDate, fullName } from "@/lib/format";
import { ACCESS_LEVEL, ACCESS_STATUS } from "@/lib/taxonomy";
import {
  createGrant,
  deleteGrant,
  setGrantStatus,
} from "../people/actions";

export const dynamic = "force-dynamic";

export default async function AccessPage({ searchParams }: PageProps<"/access">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : null;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [grants, all, people] = await Promise.all([
    db.accessGrant.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { system: { contains: q } },
                { person: { firstName: { contains: q } } },
                { person: { lastName: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { person: { select: { id: true, firstName: true, lastName: true, status: true } } },
      orderBy: [{ system: "asc" }, { createdAt: "asc" }],
    }),
    db.accessGrant.groupBy({ by: ["status"], _count: true }),
    db.person.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  const systems = new Set(grants.map((g) => g.system)).size;
  const owners = grants.filter((g) => g.level === "Owner" && g.status === "Active");
  // Access still active for someone no longer on the core team or freelancing —
  // exactly the rows an offboarding pass needs to catch.
  const dangling = grants.filter(
    (g) => g.status === "Active" && g.person.status === "Alumni",
  );

  return (
    <>
      <PageHeader
        eyebrow="Access"
        title="Who holds what"
        lede="Every account, tool and space the studio depends on — and whose hands it's in."
      />

      <StatRow>
        <Stat label="Systems" value={systems} hint="under management" />
        <Stat
          label="Active grants"
          value={counts["Active"] ?? 0}
          hint="across the team"
        />
        <Stat label="Owners" value={owners.length} hint="highest-risk level" />
        <Stat
          label="Needs offboarding"
          value={dangling.length}
          hint={dangling.length > 0 ? "active grants held by alumni" : "all clean"}
        />
      </StatRow>

      <Panel title="Grant access" className="mb-6">
        {people.length === 0 ? (
          <p className="px-5 py-5 text-[13px] text-ink-3">
            Add people first —{" "}
            <Link href="/people/new" className="text-clay hover:underline">
              start with one
            </Link>
            .
          </p>
        ) : (
          <form action={createGrant} className="px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_130px_130px_auto]">
              <Field label="System">
                <Input name="system" required placeholder="Instagram" />
              </Field>
              <Field label="Person">
                <select name="personId" required className="select">
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {fullName(p)}
                    </option>
                  ))}
                </select>
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
        )}
      </Panel>

      <Toolbar>
        <FilterBar
          basePath="/access"
          options={ACCESS_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath="/access"
          placeholder="Search systems or people…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {grants.length === 0 ? (
          <EmptyState
            title={q || status ? "Nothing matches that filter" : "No access on record"}
            body={
              q || status
                ? "Try a different status, or clear the search."
                : "Log every account and tool here — future-you, offboarding someone at speed, will be grateful."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">System</th>
                  <th className="pt-4">Person</th>
                  <th className="pt-4">Level</th>
                  <th className="pt-4">Status</th>
                  <th className="pt-4">Granted</th>
                  <th className="pt-4" />
                </tr>
              </thead>
              <tbody>
                {grants.map((g) => {
                  const revoke = setGrantStatus.bind(null, g.id, "Revoked");
                  const restore = setGrantStatus.bind(null, g.id, "Active");
                  const remove = deleteGrant.bind(null, g.id);
                  const alumniRisk = g.status === "Active" && g.person.status === "Alumni";
                  return (
                    <tr key={g.id}>
                      <td className="font-medium text-ink">
                        {g.url ? <LinkOut href={g.url} label={g.system} /> : g.system}
                      </td>
                      <td>
                        <RowLink href={`/people/${g.person.id}`}>
                          {fullName(g.person)}
                        </RowLink>
                        {alumniRisk ? (
                          <span className="ml-2 text-[11px] text-tone-danger-fg">
                            alumni
                          </span>
                        ) : null}
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
    </>
  );
}
