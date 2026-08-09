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
  RowLink,
} from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { db } from "@/lib/db";
import { formatDate, formatMoney, fullName } from "@/lib/format";
import { BOOKING_STATUS, SPEAKER_STATUS } from "@/lib/taxonomy";
import {
  deleteInteraction,
  deleteSpeaker,
  logSpeakerInteraction,
  updateSpeaker,
} from "../../actions";
import { SpeakerForm } from "../../speaker-form";

export const dynamic = "force-dynamic";

export default async function SpeakerPage({
  params,
  searchParams,
}: PageProps<"/experience/speakers/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [speaker, topics] = await Promise.all([
    db.speaker.findUnique({
      where: { id },
      include: {
        topics: { select: { id: true, name: true } },
        interactions: { orderBy: { occurredAt: "desc" } },
        bookings: {
          include: { event: { select: { id: true, name: true, startDate: true } } },
          orderBy: { startTime: "desc" },
        },
      },
    }),
    db.topic.findMany({
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!speaker) notFound();

  if (edit !== undefined) {
    const update = updateSpeaker.bind(null, speaker.id);
    return (
      <>
        <PageHeader eyebrow="Experience · Speaker" title={`Edit ${fullName(speaker)}`} />
        <SpeakerForm
          speaker={speaker}
          topics={topics}
          selectedTopicIds={speaker.topics.map((t) => t.id)}
          action={update}
          submitLabel="Save changes"
          cancelHref={`/experience/speakers/${speaker.id}`}
        />
      </>
    );
  }

  const log = logSpeakerInteraction.bind(null, speaker.id);
  const del = deleteSpeaker.bind(null, speaker.id);

  return (
    <>
      <div className="float-left mr-4 mb-2 hidden sm:block">
        <Avatar
          firstName={speaker.firstName}
          lastName={speaker.lastName}
          photoUrl={speaker.photoUrl}
          size={64}
        />
      </div>
      <PageHeader
        eyebrow="Experience · Speaker"
        title={fullName(speaker)}
        lede={[speaker.role, speaker.company].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <Link href={`/experience/speakers/${speaker.id}?edit`} className="btn">
              Edit
            </Link>
            <DeleteButton
              action={del}
              confirmText={`Delete ${fullName(speaker)}? Their bookings and contact history go too.`}
            />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <DetailList>
              <Detail label="Status">
                <Badge value={speaker.status} vocab={SPEAKER_STATUS} />
              </Detail>
              <Detail label="Fee">{speaker.fee ?? "—"}</Detail>
              <Detail label="Location">{speaker.location ?? "—"}</Detail>
              <Detail label="Email">
                {speaker.email ? (
                  <a
                    href={`mailto:${speaker.email}`}
                    className="text-clay hover:underline"
                  >
                    {speaker.email}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label="Phone">{speaker.phone ?? "—"}</Detail>
              <Detail label="Website">
                {speaker.website ? <LinkOut href={speaker.website} /> : "—"}
              </Detail>
              <Detail label="Topics">
                {speaker.topics.length === 0 ? (
                  "—"
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {speaker.topics.map((t) => (
                      <Link key={t.id} href={`/experience/topics/${t.id}`}>
                        <Chip>{t.name}</Chip>
                      </Link>
                    ))}
                  </div>
                )}
              </Detail>
            </DetailList>
          </Panel>

          <Panel title="Bio">
            <div className="px-5 py-4">
              {speaker.bio ? (
                <p className="whitespace-pre-wrap text-ink">{speaker.bio}</p>
              ) : (
                <p className="text-[13px] text-ink-3">No bio on file yet.</p>
              )}
            </div>
          </Panel>

          <Panel title="Bookings">
            {speaker.bookings.length === 0 ? (
              <p className="px-5 py-5 text-[13px] text-ink-3">
                Not booked on anything yet.
              </p>
            ) : (
              <ul className="divide-y divide-rule">
                {speaker.bookings.map((b) => (
                  <li key={b.id} className="px-5 py-3">
                    <RowLink href={`/experience/${b.event.id}`}>
                      {b.event.name}
                    </RowLink>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge value={b.status} vocab={BOOKING_STATUS} />
                      <span className="text-[12px] text-ink-3">
                        {formatDate(b.event.startDate)}
                      </span>
                      {b.fee ? (
                        <span className="tnum text-[12px] text-ink-3">
                          {formatMoney(b.fee)}
                        </span>
                      ) : null}
                    </div>
                    {b.slotTitle ? (
                      <p className="mt-1 text-[12.5px] text-ink-2">{b.slotTitle}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <InteractionLog
          interactions={speaker.interactions}
          logAction={log}
          deleteAction={deleteInteraction}
          emptyBody="No contact logged yet. Every call and email you record here is context the next person won't have to reconstruct."
        />
      </div>
    </>
  );
}
