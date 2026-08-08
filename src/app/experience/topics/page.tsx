import Link from "next/link";
import { FilterBar, SearchBox, Toolbar } from "@/components/filters";
import {
  Badge,
  Chip,
  EmptyState,
  PageHeader,
  Panel,
  RowLink,
} from "@/components/ui";
import { db } from "@/lib/db";
import { TOPIC_STATUS } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function TopicsPage({
  searchParams,
}: PageProps<"/experience/topics">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : null;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [topics, all] = await Promise.all([
    db.topic.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [{ name: { contains: q } }, { description: { contains: q } }],
            }
          : {}),
      },
      include: {
        _count: { select: { speakers: true, content: true, guests: true } },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    db.topic.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  return (
    <>
      <PageHeader
        eyebrow="Experience"
        title="Topics"
        lede="The subjects the studio has a point of view on. Speakers, content and press all hang off these."
        actions={
          <Link href="/experience/topics/new" className="btn btn-primary">
            New topic
          </Link>
        }
      />

      <Toolbar>
        <FilterBar
          basePath="/experience/topics"
          options={TOPIC_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath="/experience/topics"
          placeholder="Search topics…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {topics.length === 0 ? (
          <EmptyState
            title={q || status ? "Nothing matches that filter" : "No topics yet"}
            body={
              q || status
                ? "Try a different status, or clear the search."
                : "Topics are the connective tissue — they link a speaker to an article to a press hit."
            }
            action={
              q || status ? (
                <Link href="/experience/topics" className="btn">
                  Clear filters
                </Link>
              ) : (
                <Link href="/experience/topics/new" className="btn btn-primary">
                  Add a topic
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Topic</th>
                  <th className="pt-4">Category</th>
                  <th className="pt-4">Status</th>
                  <th className="pt-4 text-right">Speakers</th>
                  <th className="pt-4 text-right">Content</th>
                  <th className="pt-4 text-right">Guests</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => (
                  <tr key={t.id}>
                    <td className="max-w-[380px]">
                      <RowLink href={`/experience/topics/${t.id}`}>{t.name}</RowLink>
                      {t.description ? (
                        <div className="mt-0.5 truncate text-[12px] text-ink-3">
                          {t.description}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <Chip>{t.category}</Chip>
                    </td>
                    <td>
                      <Badge value={t.status} vocab={TOPIC_STATUS} />
                    </td>
                    <td className="tnum text-right text-ink-2">
                      {t._count.speakers}
                    </td>
                    <td className="tnum text-right text-ink-2">
                      {t._count.content}
                    </td>
                    <td className="tnum text-right text-ink-2">
                      {t._count.guests}
                    </td>
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
