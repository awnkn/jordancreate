import Link from "next/link";
import { notFound } from "next/navigation";
import { Field } from "@/components/form";
import { DeleteButton, SubmitButton } from "@/components/form-actions";
import {
  Badge,
  Chip,
  Detail,
  DetailList,
  PageHeader,
  Panel,
  RowLink,
  Stat,
  StatRow,
} from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate, fullName } from "@/lib/format";
import {
  CONTENT_STATUS,
  EVENT_STATUS,
  GUEST_STATUS,
  SPEAKER_STATUS,
  TOPIC_STATUS,
} from "@/lib/taxonomy";
import {
  addSpeakerToTopic,
  deleteTopic,
  removeSpeakerFromTopic,
  updateTopic,
} from "../../actions";
import { TopicForm } from "../../topic-form";

export const dynamic = "force-dynamic";

export default async function TopicPage({
  params,
  searchParams,
}: PageProps<"/experience/topics/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [topic, allSpeakers] = await Promise.all([
    db.topic.findUnique({
      where: { id },
      include: {
        speakers: { orderBy: [{ firstName: "asc" }, { lastName: "asc" }] },
        content: { orderBy: { publishDate: "desc" } },
        guests: { orderBy: [{ firstName: "asc" }, { lastName: "asc" }] },
        events: { orderBy: { startDate: "desc" } },
      },
    }),
    db.speaker.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  if (!topic) notFound();

  if (edit !== undefined) {
    const update = updateTopic.bind(null, topic.id);
    return (
      <>
        <PageHeader eyebrow="Experience · Topic" title={`Edit ${topic.name}`} />
        <TopicForm
          topic={topic}
          action={update}
          submitLabel="Save changes"
          cancelHref={`/experience/topics/${topic.id}`}
        />
      </>
    );
  }

  const del = deleteTopic.bind(null, topic.id);
  const match = addSpeakerToTopic.bind(null, topic.id);

  // Speakers not yet matched to this topic, for the matcher select.
  const matched = new Set(topic.speakers.map((s) => s.id));
  const unmatched = allSpeakers.filter((s) => !matched.has(s.id));

  return (
    <>
      <PageHeader
        eyebrow="Experience · Topic"
        title={topic.name}
        lede={topic.description ?? undefined}
        actions={
          <>
            <Link href={`/experience/topics/${topic.id}?edit`} className="btn">
              Edit
            </Link>
            <DeleteButton
              action={del}
              confirmText={`Delete "${topic.name}"? Speakers, content, guests and events stay, but lose this tag.`}
            />
          </>
        }
      />

      <StatRow>
        <Stat label="Experiences" value={topic.events.length} hint="events covering it" />
        <Stat label="Speakers" value={topic.speakers.length} hint="can cover this" />
        <Stat label="Content" value={topic.content.length} hint="pieces tagged" />
        <Stat label="Guests" value={topic.guests.length} hint="press angles" />
      </StatRow>

      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <DetailList>
              <Detail label="Category">
                <Chip>{topic.category}</Chip>
              </Detail>
              <Detail label="Status">
                <Badge value={topic.status} vocab={TOPIC_STATUS} />
              </Detail>
              <Detail label="Added">{formatDate(topic.createdAt)}</Detail>
            </DetailList>
          </Panel>

          <Panel title="Experiences">
            {topic.events.length === 0 ? (
              <p className="px-5 py-5 text-[13px] text-ink-3">
                No event covers this yet. Attach it from an event&apos;s edit
                form.
              </p>
            ) : (
              <ul className="divide-y divide-rule">
                {topic.events.map((e) => (
                  <li key={e.id} className="px-5 py-3">
                    <RowLink href={`/experience/${e.id}`}>{e.name}</RowLink>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge value={e.status} vocab={EVENT_STATUS} />
                      <span className="text-[12px] text-ink-3">
                        {formatDate(e.startDate)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Panel title="Speakers">
            <form action={match} className="border-b border-rule px-5 py-3">
              <Field label="Match a speaker">
                <div className="flex gap-2">
                  <select name="speakerId" className="select" required>
                    {unmatched.length === 0 ? (
                      <option value="" disabled>
                        Everyone is matched
                      </option>
                    ) : (
                      unmatched.map((s) => (
                        <option key={s.id} value={s.id}>
                          {fullName(s)}
                        </option>
                      ))
                    )}
                  </select>
                  <SubmitButton label="Match" pendingLabel="…" />
                </div>
              </Field>
            </form>
            {topic.speakers.length === 0 ? (
              <p className="px-5 py-5 text-[13px] text-ink-3">
                Nobody on the roster covers this yet.
              </p>
            ) : (
              <ul className="divide-y divide-rule">
                {topic.speakers.map((s) => {
                  const unmatch = removeSpeakerFromTopic.bind(null, topic.id, s.id);
                  return (
                    <li
                      key={s.id}
                      className="group flex items-center justify-between gap-2 px-5 py-3"
                    >
                      <div>
                        <RowLink href={`/experience/speakers/${s.id}`}>
                          {fullName(s)}
                        </RowLink>
                        <div className="mt-1">
                          <Badge value={s.status} vocab={SPEAKER_STATUS} />
                        </div>
                      </div>
                      <form action={unmatch}>
                        <button
                          type="submit"
                          className="text-[12px] text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-tone-danger-fg"
                        >
                          Unmatch
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Content">
            {topic.content.length === 0 ? (
              <p className="px-5 py-5 text-[13px] text-ink-3">
                Nothing written on this yet.
              </p>
            ) : (
              <ul className="divide-y divide-rule">
                {topic.content.map((c) => (
                  <li key={c.id} className="px-5 py-3">
                    <RowLink href={`/content/${c.id}`}>{c.title}</RowLink>
                    <div className="mt-1">
                      <Badge value={c.status} vocab={CONTENT_STATUS} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Guests">
            {topic.guests.length === 0 ? (
              <p className="px-5 py-5 text-[13px] text-ink-3">
                No press angles built on this yet.
              </p>
            ) : (
              <ul className="divide-y divide-rule">
                {topic.guests.map((g) => (
                  <li key={g.id} className="px-5 py-3">
                    <RowLink href={`/public-relations/guests/${g.id}`}>
                      {fullName(g)}
                    </RowLink>
                    <div className="mt-1">
                      <Badge value={g.status} vocab={GUEST_STATUS} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
