import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteInteraction } from "@/app/experience/actions";
import { DeleteButton } from "@/components/form-actions";
import { InteractionLog } from "@/components/interaction-log";
import {
  Badge,
  Chip,
  Detail,
  DetailList,
  LinkOut,
  PageHeader,
  Panel,
  Stat,
  StatRow,
} from "@/components/ui";
import { db } from "@/lib/db";
import {
  formatDate,
  formatMoney,
  fullName,
  relativeDays,
} from "@/lib/format";
import { VENDOR_STATUS } from "@/lib/taxonomy";
import {
  deleteVendor,
  logVendorInteraction,
  updateVendor,
} from "../actions";
import { VendorForm } from "../vendor-form";

export const dynamic = "force-dynamic";

export default async function VendorPage({
  params,
  searchParams,
}: PageProps<"/vendors/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const vendor = await db.vendor.findUnique({
    where: { id },
    include: { interactions: { orderBy: { occurredAt: "desc" } } },
  });

  if (!vendor) notFound();

  if (edit !== undefined) {
    const update = updateVendor.bind(null, vendor.id);
    return (
      <>
        <PageHeader eyebrow="Vendors" title={`Edit ${vendor.company}`} />
        <VendorForm
          vendor={vendor}
          action={update}
          submitLabel="Save changes"
          cancelHref={`/vendors/${vendor.id}`}
        />
      </>
    );
  }

  const log = logVendorInteraction.bind(null, vendor.id);
  const del = deleteVendor.bind(null, vendor.id);
  const isPartner = vendor.kind === "Space Partner";

  return (
    <>
      <PageHeader
        eyebrow={`Vendors · ${vendor.kind}`}
        title={vendor.company}
        lede={
          vendor.contactFirstName
            ? fullName({
                firstName: vendor.contactFirstName,
                lastName: vendor.contactLastName,
              })
            : undefined
        }
        actions={
          <>
            <Link href={`/vendors/${vendor.id}?edit`} className="btn">
              Edit
            </Link>
            <DeleteButton
              action={del}
              confirmText={`Delete ${vendor.company}? Their contact history goes too.`}
            />
          </>
        }
      />

      {isPartner ? (
        <StatRow>
          <Stat label="Status" value={vendor.status} />
          <Stat label="Space" value={vendor.spaceName ?? "—"} />
          <Stat
            label="Monthly rent"
            value={formatMoney(vendor.monthlyRent)}
            hint={vendor.monthlyRent ? `${formatMoney(vendor.monthlyRent * 12)} / year` : undefined}
          />
          <Stat
            label="Lease ends"
            value={vendor.leaseEnd ? formatDate(vendor.leaseEnd) : "—"}
            hint={vendor.leaseEnd ? relativeDays(vendor.leaseEnd) : "no end date"}
          />
        </StatRow>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <DetailList>
              <Detail label="Kind">
                <Chip>{vendor.kind}</Chip>
              </Detail>
              <Detail label="Status">
                <Badge value={vendor.status} vocab={VENDOR_STATUS} />
              </Detail>
              {isPartner ? (
                <>
                  <Detail label="Space">{vendor.spaceName ?? "—"}</Detail>
                  <Detail label="Rent">{formatMoney(vendor.monthlyRent)}</Detail>
                  <Detail label="Lease">
                    {vendor.leaseStart || vendor.leaseEnd
                      ? `${formatDate(vendor.leaseStart)} – ${formatDate(vendor.leaseEnd)}`
                      : "—"}
                  </Detail>
                </>
              ) : (
                <Detail label="Service">{vendor.service ?? "—"}</Detail>
              )}
              <Detail label="Email">
                {vendor.email ? (
                  <a
                    href={`mailto:${vendor.email}`}
                    className="text-clay hover:underline"
                  >
                    {vendor.email}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label="Phone">{vendor.phone ?? "—"}</Detail>
              <Detail label="Website">
                {vendor.website ? <LinkOut href={vendor.website} /> : "—"}
              </Detail>
            </DetailList>
          </Panel>

          <Panel title="Notes">
            <div className="px-5 py-4">
              {vendor.notes ? (
                <p className="whitespace-pre-wrap text-ink">{vendor.notes}</p>
              ) : (
                <p className="text-[13px] text-ink-3">Nothing noted yet.</p>
              )}
            </div>
          </Panel>
        </div>

        <InteractionLog
          interactions={vendor.interactions}
          logAction={log}
          deleteAction={deleteInteraction}
          emptyBody={
            isPartner
              ? "No history yet. Lease conversations, renewals and issues logged here save the next negotiation."
              : "No history yet. Quotes, orders and how they performed — log it while it's fresh."
          }
        />
      </div>
    </>
  );
}
