import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form-actions";
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
  GUEST_STATUS,
  SPEAKER_STATUS,
  TOPIC_STATUS,
} from "@/lib/taxonomy";
import { deleteTopic, updateTopic } from "../../actions";
import { TopicForm } from "../../topic-form";

export const dynamic = "force-dynamic";

export default async function TopicPage({
  params,
  searchParams,
}: PageProps<"/experience/topics/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const topic = await db.topic.findUnique({
    where: { id },
    include: {
      speakers: { orderBy: [{ firstName: "asc" }, { lastName: "asc" }] },
      content: { orderBy: { publishDate: "desc" } },
      guests: { orderBy: [{ firstName: "asc" }, { lastName: "asc" }] },
    },
  });

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
              confirmText={`Delete "${topic.name}"? Speakers, content and guests stay, but lose this tag.`}
            />
          </>
        }
      />

      <StatRow>
        <Stat label="Status" value={topic.status} />
        <Stat label="Speakers" value={topic.speakers.length} hint="can cover this" />
        <Stat label="Content" value={topic.content.length} hint="pieces tagged" />
        <Stat label="Guests" value={topic.guests.length} hint="press angles" />
      </StatRow>

      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
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

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Panel title="Speakers">
            {topic.speakers.length === 0 ? (
              <p className="px-5 py-5 text-[13px] text-ink-3">
                Nobody on the roster covers this yet.
              </p>
            ) : (
              <ul className="divide-y divide-rule">
                {topic.speakers.map((s) => (
                  <li key={s.id} className="px-5 py-3">
                    <RowLink href={`/experience/speakers/${s.id}`}>{fullName(s)}</RowLink>
                    <div className="mt-1">
                      <Badge value={s.status} vocab={SPEAKER_STATUS} />
                    </div>
                  </li>
                ))}
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
                    <RowLink href={`/public-relations/guests/${g.id}`}>{fullName(g)}</RowLink>
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
