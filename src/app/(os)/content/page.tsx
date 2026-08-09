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
} from "@/components/ui";
import { db } from "@/lib/db";
import { daysFromToday, formatDate } from "@/lib/format";
import { CLOSED_STATUSES, CONTENT_STATUS } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function ContentPage({
  searchParams,
}: PageProps<"/content">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : null;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [pieces, all] = await Promise.all([
    db.contentPiece.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { owner: { contains: q } },
                { platforms: { has: q } },
              ],
            }
          : {}),
      },
      include: {
        topics: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ publishDate: "asc" }, { createdAt: "desc" }],
    }),
    db.contentPiece.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Pipeline"
        lede="Everything the studio is publishing, from loose idea to live link."
        actions={
          <Link href="/content/new" className="btn btn-primary">
            New piece
          </Link>
        }
      />

      <Toolbar>
        <FilterBar
          basePath="/content"
          options={CONTENT_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath="/content"
          placeholder="Search content…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {pieces.length === 0 ? (
          <EmptyState
            title={q || status ? "Nothing matches that filter" : "The pipeline is empty"}
            body={
              q || status
                ? "Try a different status, or clear the search."
                : "Capture ideas here early — the ones that never get written down never get made."
            }
            action={
              q || status ? (
                <Link href="/content" className="btn">
                  Clear filters
                </Link>
              ) : (
                <Link href="/content/new" className="btn btn-primary">
                  Add a piece
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Title</th>
                  <th className="pt-4">Format</th>
                  <th className="pt-4">Status</th>
                  <th className="pt-4">Owner</th>
                  <th className="pt-4">Topics</th>
                  <th className="pt-4">Publish</th>
                </tr>
              </thead>
              <tbody>
                {pieces.map((c) => (
                  <tr key={c.id}>
                    <td className="max-w-[290px]">
                      <RowLink href={`/content/${c.id}`}>{c.title}</RowLink>
                      {c.project ? (
                        <div className="mt-0.5 text-[12px] text-ink-3">
                          {c.project.name}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <Chip>{c.format}</Chip>
                      {c.platforms.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {c.platforms.map((p) => (
                            <span key={p} className="text-[11px] text-ink-3">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <Badge value={c.status} vocab={CONTENT_STATUS} />
                    </td>
                    <td className="text-ink-2">{c.owner ?? "—"}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {c.topics.length === 0 ? (
                          <span className="text-ink-3">—</span>
                        ) : (
                          c.topics.map((t) => <Chip key={t.id}>{t.name}</Chip>)
                        )}
                      </div>
                    </td>
                    <td>
                      <DueDate
                        date={formatDate(c.publishDate)}
                        days={daysFromToday(c.publishDate)}
                        closed={CLOSED_STATUSES.has(c.status)}
                      />
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
