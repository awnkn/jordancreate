import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form-actions";
import {
  Badge,
  Chip,
  Detail,
  DetailList,
  LinkOut,
  PageHeader,
  Panel,
} from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate, relativeDays } from "@/lib/format";
import { CONTENT_STATUS } from "@/lib/taxonomy";
import { deleteContent, updateContent } from "../actions";
import { ContentForm } from "../content-form";

export const dynamic = "force-dynamic";

export default async function ContentDetailPage({
  params,
  searchParams,
}: PageProps<"/content/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [piece, projects, topics] = await Promise.all([
    db.contentPiece.findUnique({
      where: { id },
      include: {
        topics: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    db.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.topic.findMany({
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!piece) notFound();

  if (edit !== undefined) {
    const update = updateContent.bind(null, piece.id);
    return (
      <>
        <PageHeader eyebrow="Content" title={`Edit ${piece.title}`} />
        <ContentForm
          piece={piece}
          projects={projects}
          topics={topics}
          selectedTopicIds={piece.topics.map((t) => t.id)}
          action={update}
          submitLabel="Save changes"
          cancelHref={`/content/${piece.id}`}
        />
      </>
    );
  }

  const del = deleteContent.bind(null, piece.id);

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title={piece.title}
        actions={
          <>
            <Link href={`/content/${piece.id}?edit`} className="btn">
              Edit
            </Link>
            <DeleteButton
              action={del}
              confirmText={`Delete "${piece.title}"? This can't be undone.`}
            />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
        <Panel title="Details">
          <DetailList>
            <Detail label="Status">
              <Badge value={piece.status} vocab={CONTENT_STATUS} />
            </Detail>
            <Detail label="Format">
              <Chip>{piece.format}</Chip>
            </Detail>
            <Detail label="Platforms">
              {piece.platforms.length === 0 ? (
                "—"
              ) : (
                <div className="flex flex-wrap gap-1">
                  {piece.platforms.map((p) => (
                    <Chip key={p}>{p}</Chip>
                  ))}
                </div>
              )}
            </Detail>
            <Detail label="Owner">{piece.owner ?? "—"}</Detail>
            <Detail label="Publish">
              {piece.publishDate ? (
                <>
                  {formatDate(piece.publishDate)}
                  <span className="ml-2 text-[12px] text-ink-3">
                    {relativeDays(piece.publishDate)}
                  </span>
                </>
              ) : (
                "Unscheduled"
              )}
            </Detail>
            <Detail label="Project">
              {piece.project ? (
                <Link
                  href={`/operations/${piece.project.id}`}
                  className="text-clay hover:underline"
                >
                  {piece.project.name}
                </Link>
              ) : (
                "—"
              )}
            </Detail>
            <Detail label="Link">
              {piece.url ? <LinkOut href={piece.url} /> : "—"}
            </Detail>
            <Detail label="Topics">
              {piece.topics.length === 0 ? (
                "—"
              ) : (
                <div className="flex flex-wrap gap-1">
                  {piece.topics.map((t) => (
                    <Link key={t.id} href={`/experience/topics/${t.id}`}>
                      <Chip>{t.name}</Chip>
                    </Link>
                  ))}
                </div>
              )}
            </Detail>
          </DetailList>
        </Panel>

        <Panel title="Brief">
          <div className="px-5 py-4">
            {piece.brief ? (
              <p className="max-w-2xl whitespace-pre-wrap text-ink">{piece.brief}</p>
            ) : (
              <p className="text-[13px] text-ink-3">
                No brief written yet. A piece without an argument tends to stay in
                Drafting.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
