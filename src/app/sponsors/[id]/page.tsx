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
import { formatDate, formatMoney, relativeDays } from "@/lib/format";
import { SPONSOR_STATUS } from "@/lib/taxonomy";
import {
  deleteSponsor,
  logSponsorInteraction,
  setSponsorStatus,
  updateSponsor,
} from "../actions";
import { SponsorForm } from "../sponsor-form";

export const dynamic = "force-dynamic";

export default async function SponsorPage({
  params,
  searchParams,
}: PageProps<"/sponsors/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [sponsor, events] = await Promise.all([
    db.sponsor.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, name: true } },
        interactions: { orderBy: { occurredAt: "desc" } },
      },
    }),
    db.event.findMany({
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  if (!sponsor) notFound();

  if (edit !== undefined) {
    const update = updateSponsor.bind(null, sponsor.id);
    return (
      <>
        <PageHeader eyebrow="Sponsors · Deal" title={`Edit ${sponsor.company}`} />
        <SponsorForm
          sponsor={sponsor}
          events={events}
          action={update}
          submitLabel="Save changes"
          cancelHref={`/sponsors/${sponsor.id}`}
        />
      </>
    );
  }

  const log = logSponsorInteraction.bind(null, sponsor.id);
  const del = deleteSponsor.bind(null, sponsor.id);

  return (
    <>
      <PageHeader
        eyebrow="Sponsors · Deal"
        title={sponsor.company}
        lede={
          [sponsor.contactName, sponsor.contactRole].filter(Boolean).join(" · ") ||
          undefined
        }
        actions={
          <>
            <Link href={`/sponsors/${sponsor.id}?edit`} className="btn">
              Edit
            </Link>
            <DeleteButton
              action={del}
              confirmText={`Delete the ${sponsor.company} deal? Its contact history goes too.`}
            />
          </>
        }
      />

      <StageStepper current={sponsor.status} sponsorId={sponsor.id} />

      <StatRow>
        <Stat label="Stage" value={sponsor.status} />
        <Stat label="Value" value={formatMoney(sponsor.value)} hint={sponsor.tier} />
        <Stat
          label="Close"
          value={sponsor.closeDate ? formatDate(sponsor.closeDate) : "—"}
          hint={sponsor.closeDate ? relativeDays(sponsor.closeDate) : undefined}
        />
        <Stat
          label="Touchpoints"
          value={sponsor.interactions.length}
          hint={
            sponsor.interactions[0]
              ? `last ${relativeDays(sponsor.interactions[0].occurredAt)}`
              : "none logged"
          }
        />
      </StatRow>

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <DetailList>
              <Detail label="Stage">
                <Badge value={sponsor.status} vocab={SPONSOR_STATUS} />
              </Detail>
              <Detail label="Tier">
                <Chip>{sponsor.tier}</Chip>
              </Detail>
              <Detail label="Event">
                {sponsor.event ? (
                  <Link
                    href={`/experience/${sponsor.event.id}`}
                    className="text-clay hover:underline"
                  >
                    {sponsor.event.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label="Email">
                {sponsor.email ? (
                  <a
                    href={`mailto:${sponsor.email}`}
                    className="text-clay hover:underline"
                  >
                    {sponsor.email}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label="Phone">{sponsor.phone ?? "—"}</Detail>
              <Detail label="Website">
                {sponsor.website ? <LinkOut href={sponsor.website} /> : "—"}
              </Detail>
            </DetailList>
          </Panel>

          <Panel title="Next step">
            <div className="px-5 py-4">
              {sponsor.nextStep ? (
                <p className="font-medium text-ink">{sponsor.nextStep}</p>
              ) : (
                <p className="text-[13px] text-ink-3">
                  No next step written down — a deal without one is drifting.
                </p>
              )}
              {sponsor.notes ? (
                <p className="mt-4 border-t border-rule pt-4 whitespace-pre-wrap text-[13px] text-ink-2">
                  {sponsor.notes}
                </p>
              ) : null}
            </div>
          </Panel>
        </div>

        <InteractionLog
          interactions={sponsor.interactions}
          logAction={log}
          deleteAction={deleteInteraction}
          emptyBody="No contact logged yet. In a sales pipeline, the record of who said what — and when — is the deal."
        />
      </div>
    </>
  );
}

/** One click per stage, same as the PR pipeline. */
function StageStepper({
  current,
  sponsorId,
}: {
  current: string;
  sponsorId: string;
}) {
  return (
    <div className="panel mb-6 flex flex-wrap items-center gap-1 px-3 py-2.5">
      <span className="label mr-2 pl-1">Move to</span>
      {SPONSOR_STATUS.values.map((stage) => {
        const advance = setSponsorStatus.bind(null, sponsorId, stage);
        const active = stage === current;
        return (
          <form key={stage} action={advance}>
            <button
              type="submit"
              disabled={active}
              className={`rounded-sm px-2.5 py-1 text-[13px] transition-colors ${
                active
                  ? "cursor-default bg-ink text-paper"
                  : "text-ink-2 hover:bg-sunk hover:text-ink"
              }`}
            >
              {stage}
            </button>
          </form>
        );
      })}
    </div>
  );
}
