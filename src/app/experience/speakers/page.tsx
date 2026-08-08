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
import { SPEAKER_STATUS } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function SpeakersPage({
  searchParams,
}: PageProps<"/experience/speakers">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : null;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [speakers, all] = await Promise.all([
    db.speaker.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { company: { contains: q } },
                { role: { contains: q } },
                { location: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        topics: { select: { id: true, name: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.speaker.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  return (
    <>
      <PageHeader
        eyebrow="Experience"
        title="Speakers"
        lede="The roster — who we can put on a stage, what they talk about, and where they are in the conversation."
        actions={
          <Link href="/experience/speakers/new" className="btn btn-primary">
            New speaker
          </Link>
        }
      />

      <Toolbar>
        <FilterBar
          basePath="/experience/speakers"
          options={SPEAKER_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath="/experience/speakers"
          placeholder="Search speakers…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {speakers.length === 0 ? (
          <EmptyState
            title={q || status ? "Nothing matches that filter" : "No speakers yet"}
            body={
              q || status
                ? "Try a different status, or clear the search."
                : "Build the roster before you need it — the best people are booked months out."
            }
            action={
              q || status ? (
                <Link href="/experience/speakers" className="btn">
                  Clear filters
                </Link>
              ) : (
                <Link href="/experience/speakers/new" className="btn btn-primary">
                  Add a speaker
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Speaker</th>
                  <th className="pt-4">Status</th>
                  <th className="pt-4">Topics</th>
                  <th className="pt-4">Location</th>
                  <th className="pt-4">Fee</th>
                  <th className="pt-4 text-right">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {speakers.map((s) => (
                  <tr key={s.id}>
                    <td className="max-w-[260px]">
                      <RowLink href={`/experience/speakers/${s.id}`}>
                        {s.name}
                      </RowLink>
                      <div className="mt-0.5 text-[12px] text-ink-3">
                        {[s.role, s.company].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>
                    <td>
                      <Badge value={s.status} vocab={SPEAKER_STATUS} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {s.topics.length === 0 ? (
                          <span className="text-ink-3">—</span>
                        ) : (
                          s.topics.map((t) => <Chip key={t.id}>{t.name}</Chip>)
                        )}
                      </div>
                    </td>
                    <td className="text-ink-2">{s.location ?? "—"}</td>
                    <td className="tnum text-ink-2">{s.fee ?? "—"}</td>
                    <td className="tnum text-right text-ink-2">
                      {s._count.bookings}
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
