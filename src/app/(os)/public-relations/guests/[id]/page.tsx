import Link from "next/link";
import { notFound } from "next/navigation";
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
} from "@/components/ui";
import { deleteInteraction } from "@/app/(os)/experience/actions";
import { db } from "@/lib/db";
import { formatCount, formatDate, fullName, relativeDays } from "@/lib/format";
import { GUEST_STATUS, categorySlug } from "@/lib/taxonomy";
import {
  deleteGuest,
  logGuestInteraction,
  setGuestStatus,
  updateGuest,
} from "../../actions";
import { GuestForm } from "../../guest-form";

export const dynamic = "force-dynamic";

export default async function GuestPage({
  params,
  searchParams,
}: PageProps<"/public-relations/guests/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [guest, topics] = await Promise.all([
    db.guest.findUnique({
      where: { id },
      include: {
        topics: { select: { id: true, name: true } },
        interactions: { orderBy: { occurredAt: "desc" } },
      },
    }),
    db.topic.findMany({
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!guest) notFound();

  if (edit !== undefined) {
    const update = updateGuest.bind(null, guest.id);
    return (
      <>
        <PageHeader eyebrow="Public Relations · Guest" title={`Edit ${fullName(guest)}`} />
        <GuestForm
          guest={guest}
          topics={topics}
          selectedTopicIds={guest.topics.map((t) => t.id)}
          action={update}
          submitLabel="Save changes"
          cancelHref={`/public-relations/guests/${guest.id}`}
        />
      </>
    );
  }

  const log = logGuestInteraction.bind(null, guest.id);
  const del = deleteGuest.bind(null, guest.id);

  return (
    <>
      <PageHeader
        eyebrow="Public Relations · Guest"
        title={fullName(guest)}
        lede={[guest.outlet, guest.showName].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <Link href={`/public-relations/guests/${guest.id}?edit`} className="btn">
              Edit
            </Link>
            <DeleteButton
              action={del}
              confirmText={`Delete ${fullName(guest)}? Their contact history goes too.`}
            />
          </>
        }
      />

      <StageStepper current={guest.status} guestId={guest.id} />

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <DetailList>
              <Detail label="Stage">
                <Badge value={guest.status} vocab={GUEST_STATUS} />
              </Detail>
              <Detail label="Category">
                <Link href={`/public-relations/${categorySlug(guest.category)}`}>
                  <Chip>{guest.category}</Chip>
                </Link>
              </Detail>
              <Detail label="Format">
                <Chip>{guest.format}</Chip>
              </Detail>
              <Detail label="Outlet">{guest.outlet ?? "—"}</Detail>
              <Detail label="Show">{guest.showName ?? "—"}</Detail>
              <Detail label="Audience">{formatCount(guest.audienceSize)}</Detail>
              <Detail label="Scheduled">
                {guest.scheduledFor ? (
                  <>
                    {formatDate(guest.scheduledFor)}
                    <span className="ml-2 text-[12px] text-ink-3">
                      {relativeDays(guest.scheduledFor)}
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label="Email">
                {guest.email ? (
                  <a
                    href={`mailto:${guest.email}`}
                    className="text-clay hover:underline"
                  >
                    {guest.email}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label="Phone">{guest.phone ?? "—"}</Detail>
              <Detail label="Published">
                {guest.publishedUrl ? <LinkOut href={guest.publishedUrl} /> : "—"}
              </Detail>
              <Detail label="Topics">
                {guest.topics.length === 0 ? (
                  "—"
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {guest.topics.map((t) => (
                      <Link key={t.id} href={`/experience/topics/${t.id}`}>
                        <Chip>{t.name}</Chip>
                      </Link>
                    ))}
                  </div>
                )}
              </Detail>
            </DetailList>
          </Panel>

          <Panel title="Angle">
            <div className="px-5 py-4">
              {guest.angle ? (
                <p className="whitespace-pre-wrap text-ink">{guest.angle}</p>
              ) : (
                <p className="text-[13px] text-ink-3">
                  No angle written yet — a pitch without one rarely lands.
                </p>
              )}
              {guest.notes ? (
                <p className="mt-4 border-t border-rule pt-4 whitespace-pre-wrap text-[13px] text-ink-2">
                  {guest.notes}
                </p>
              ) : null}
            </div>
          </Panel>
        </div>

        <InteractionLog
          interactions={guest.interactions}
          logAction={log}
          deleteAction={deleteInteraction}
          emptyBody="Nothing logged yet. Record each pitch and follow-up so you know when to nudge and when to stop."
        />
      </div>
    </>
  );
}

/** One click per stage — the pipeline is the point of this section. */
function StageStepper({ current, guestId }: { current: string; guestId: string }) {
  return (
    <div className="panel mb-6 flex flex-wrap items-center gap-1 px-3 py-2.5">
      <span className="label mr-2 pl-1">Move to</span>
      {GUEST_STATUS.values.map((stage) => {
        const advance = setGuestStatus.bind(null, guestId, stage);
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
