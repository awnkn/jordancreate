import Link from "next/link";
import { FilterBar, SearchBox, Toolbar } from "@/components/filters";
import {
  Badge,
  Chip,
  DueDate,
  EmptyState,
  PageHeader,
  Panel,
  RowLink,
  Stat,
  StatRow,
} from "@/components/ui";
import { db } from "@/lib/db";
import { daysFromToday, formatDate, formatMoney, fullName } from "@/lib/format";
import { VENDOR_STATUS } from "@/lib/taxonomy";

/**
 * The vendor table — used by the Vendors index (everyone) and the two
 * sub-sections (Suppliers / Space Partners) as narrower slices.
 */
export async function VendorList({
  kind,
  status,
  q,
  basePath,
  title,
  lede,
}: {
  /** Omit for "all vendors". */
  kind?: string;
  status: string | null;
  q: string;
  basePath: string;
  title: string;
  lede: string;
}) {
  const scope = kind ? { kind } : {};

  const [vendors, all] = await Promise.all([
    db.vendor.findMany({
      where: {
        ...scope,
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { company: { contains: q } },
                { contactFirstName: { contains: q } },
                { contactLastName: { contains: q } },
                { service: { contains: q } },
                { spaceName: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: [{ status: "asc" }, { company: "asc" }],
    }),
    db.vendor.groupBy({ by: ["status"], where: scope, _count: true }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  const active = vendors.filter((v) => v.status === "Active");
  const partners = vendors.filter((v) => v.kind === "Space Partner");
  const rentRoll = partners
    .filter((v) => v.status === "Active")
    .reduce((sum, v) => sum + (v.monthlyRent ?? 0), 0);
  const showRent = kind !== "Supplier";
  const filtered = Boolean(q || status);

  return (
    <>
      <PageHeader
        eyebrow={kind ? `Vendors · ${kind}s` : "Vendors"}
        title={title}
        lede={lede}
        actions={
          <Link
            href={`/vendors/new${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`}
            className="btn btn-primary"
          >
            New vendor
          </Link>
        }
      />

      <StatRow>
        <Stat label="On file" value={vendors.length} hint={kind ? undefined : "suppliers and partners"} />
        <Stat label="Active" value={active.length} hint="current relationships" />
        {showRent ? (
          <Stat
            label="Monthly rent roll"
            value={formatMoney(rentRoll)}
            hint="active space partners"
          />
        ) : (
          <Stat
            label="Prospects"
            value={counts["Prospect"] ?? 0}
            hint="not yet engaged"
          />
        )}
        <Stat label="Paused / former" value={(counts["Paused"] ?? 0) + (counts["Former"] ?? 0)} />
      </StatRow>

      <Toolbar>
        <FilterBar
          basePath={basePath}
          options={VENDOR_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath={basePath}
          placeholder="Search vendors…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {vendors.length === 0 ? (
          <EmptyState
            title={filtered ? "Nothing matches that filter" : "No vendors yet"}
            body={
              filtered
                ? "Try a different status, or clear the search."
                : "Track everyone the studio buys from — and everyone renting a corner of the building."
            }
            action={
              filtered ? (
                <Link href={basePath} className="btn">
                  Clear filters
                </Link>
              ) : (
                <Link href="/vendors/new" className="btn btn-primary">
                  Add a vendor
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Company</th>
                  {kind ? null : <th className="pt-4">Kind</th>}
                  <th className="pt-4">Status</th>
                  <th className="pt-4">{kind === "Space Partner" ? "Space" : "Service / Space"}</th>
                  {kind !== "Supplier" ? (
                    <>
                      <th className="pt-4 text-right">Rent</th>
                      <th className="pt-4">Lease ends</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td className="max-w-[240px]">
                      <RowLink href={`/vendors/${v.id}`}>{v.company}</RowLink>
                      {v.contactFirstName ? (
                        <div className="mt-0.5 text-[12px] text-ink-3">
                          {fullName({
                            firstName: v.contactFirstName,
                            lastName: v.contactLastName,
                          })}
                        </div>
                      ) : null}
                    </td>
                    {kind ? null : (
                      <td>
                        <Chip>{v.kind}</Chip>
                      </td>
                    )}
                    <td>
                      <Badge value={v.status} vocab={VENDOR_STATUS} />
                    </td>
                    <td className="max-w-[240px] truncate text-ink-2">
                      {v.kind === "Space Partner" ? (v.spaceName ?? "—") : (v.service ?? "—")}
                    </td>
                    {kind !== "Supplier" ? (
                      v.kind === "Space Partner" ? (
                        <>
                          <td className="tnum text-right text-ink-2">
                            {formatMoney(v.monthlyRent)}
                          </td>
                          <td>
                            <DueDate
                              date={formatDate(v.leaseEnd)}
                              days={daysFromToday(v.leaseEnd)}
                              closed={v.status !== "Active"}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="text-right text-ink-3">—</td>
                          <td className="text-ink-3">—</td>
                        </>
                      )
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
