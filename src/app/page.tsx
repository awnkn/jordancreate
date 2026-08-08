import Link from "next/link";
import {
  Badge,
  Chip,
  DueDate,
  EmptyState,
  PageHeader,
  Panel,
  RowLink,
  Stat,
  StatRow,
} from "@/components/ui";
import { db } from "@/lib/db";
import { daysFromToday, formatDate, formatRange, fullName, relativeDays } from "@/lib/format";
import {
  BOOKING_STATUS,
  CONTENT_STATUS,
  EVENT_STATUS,
  GUEST_STATUS,
  SPEAKER_STATUS,
  TASK_PRIORITY,
} from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const now = new Date();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 14);

  const [
    activeProjects,
    openTasks,
    dueSoon,
    contentInFlight,
    upcomingContent,
    nextEvent,
    speakerPipeline,
    guestPipeline,
  ] = await Promise.all([
    db.project.count({ where: { status: { in: ["Discovery", "Active", "Blocked"] } } }),
    db.task.count({ where: { status: { notIn: ["Done"] } } }),
    db.task.findMany({
      where: { status: { notIn: ["Done"] }, dueDate: { lte: horizon } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
    db.contentPiece.count({
      where: { status: { in: ["Idea", "Drafting", "Review", "Scheduled"] } },
    }),
    db.contentPiece.findMany({
      where: {
        status: { notIn: ["Published", "Archived"] },
        publishDate: { not: null },
      },
      orderBy: { publishDate: "asc" },
      take: 5,
    }),
    db.event.findFirst({
      where: { startDate: { gte: now }, status: { notIn: ["Cancelled", "Complete"] } },
      include: {
        bookings: {
          include: { speaker: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { startTime: "asc" },
        },
      },
      orderBy: { startDate: "asc" },
    }),
    db.speaker.groupBy({ by: ["status"], _count: true }),
    db.guest.groupBy({ by: ["status"], _count: true }),
  ]);

  const speakerCounts = Object.fromEntries(
    speakerPipeline.map((r) => [r.status, r._count]),
  );
  const guestCounts = Object.fromEntries(
    guestPipeline.map((r) => [r.status, r._count]),
  );

  const overdue = dueSoon.filter((t) => (daysFromToday(t.dueDate) ?? 0) < 0).length;

  return (
    <>
      <PageHeader
        eyebrow={now.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title="The studio, today"
        lede="What's due, what's shipping, and who's on the next stage."
      />

      <StatRow>
        <Stat
          label="Active projects"
          value={activeProjects}
          hint="in discovery, active or blocked"
          href="/operations"
        />
        <Stat
          label="Open tasks"
          value={openTasks}
          hint={overdue > 0 ? `${overdue} overdue` : "none overdue"}
          href="/operations/tasks"
        />
        <Stat
          label="Content in flight"
          value={contentInFlight}
          hint="idea through scheduled"
          href="/content"
        />
        <Stat
          label="Days to next event"
          value={nextEvent?.startDate ? (daysFromToday(nextEvent.startDate) ?? "—") : "—"}
          hint={nextEvent?.name ?? "nothing scheduled"}
          href={nextEvent ? `/experience/${nextEvent.id}` : "/experience"}
        />
      </StatRow>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel
          title="Due in the next two weeks"
          action={
            <Link
              href="/operations/tasks"
              className="text-[12.5px] text-clay hover:underline"
            >
              All tasks
            </Link>
          }
        >
          {dueSoon.length === 0 ? (
            <EmptyState
              title="Nothing due"
              body="No open task has a deadline inside the next fortnight."
            />
          ) : (
            <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Task</th>
                  <th className="pt-4">Priority</th>
                  <th className="pt-4">Who</th>
                  <th className="pt-4">Due</th>
                </tr>
              </thead>
              <tbody>
                {dueSoon.map((t) => (
                  <tr key={t.id}>
                    <td className="max-w-[240px]">
                      <RowLink href={`/operations/tasks/${t.id}`}>{t.title}</RowLink>
                      {t.project ? (
                        <div className="mt-0.5 text-[12px] text-ink-3">
                          {t.project.name}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <Badge value={t.priority} vocab={TASK_PRIORITY} />
                    </td>
                    <td className="text-ink-2">{t.assignee ?? "—"}</td>
                    <td>
                      <DueDate
                        date={formatDate(t.dueDate)}
                        days={daysFromToday(t.dueDate)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </Panel>

        <Panel
          title="Next experience"
          action={
            <Link href="/experience" className="text-[12.5px] text-clay hover:underline">
              All events
            </Link>
          }
        >
          {!nextEvent ? (
            <EmptyState
              title="Nothing on the calendar"
              body="No confirmed or planned event has a future date."
              action={
                <Link href="/experience/new" className="btn btn-primary">
                  Schedule one
                </Link>
              }
            />
          ) : (
            <div>
              <div className="border-b border-rule px-5 py-4">
                <RowLink href={`/experience/${nextEvent.id}`}>
                  <span className="display text-[19px]">{nextEvent.name}</span>
                </RowLink>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge value={nextEvent.status} vocab={EVENT_STATUS} />
                  <Chip>{nextEvent.format}</Chip>
                  <span className="tnum text-[12.5px] text-ink-2">
                    {formatRange(nextEvent.startDate, nextEvent.endDate)}
                  </span>
                  <span className="text-[12.5px] text-ink-3">
                    {relativeDays(nextEvent.startDate)}
                  </span>
                </div>
                {nextEvent.city ? (
                  <p className="mt-1.5 text-[12.5px] text-ink-3">
                    {[nextEvent.venue, nextEvent.city].filter(Boolean).join(", ")}
                  </p>
                ) : null}
              </div>

              {nextEvent.bookings.length === 0 ? (
                <p className="px-5 py-5 text-[13px] text-ink-3">
                  No speakers booked yet.
                </p>
              ) : (
                <ul className="divide-y divide-rule">
                  {nextEvent.bookings.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between gap-3 px-5 py-2.5"
                    >
                      <div className="min-w-0">
                        <RowLink href={`/experience/speakers/${b.speaker.id}`}>
                          {fullName(b.speaker)}
                        </RowLink>
                        {b.slotTitle ? (
                          <div className="truncate text-[12px] text-ink-3">
                            {b.slotTitle}
                          </div>
                        ) : null}
                      </div>
                      <Badge value={b.status} vocab={BOOKING_STATUS} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Panel>

        <Panel
          title="Shipping next"
          action={
            <Link href="/content" className="text-[12.5px] text-clay hover:underline">
              Pipeline
            </Link>
          }
        >
          {upcomingContent.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              body="No unpublished piece has a publish date on it."
            />
          ) : (
            <ul className="divide-y divide-rule">
              {upcomingContent.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <RowLink href={`/content/${c.id}`}>{c.title}</RowLink>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge value={c.status} vocab={CONTENT_STATUS} />
                      <Chip>{c.format}</Chip>
                    </div>
                  </div>
                  <DueDate
                    date={formatDate(c.publishDate)}
                    days={daysFromToday(c.publishDate)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Panel
            title="Speaker roster"
            action={
              <Link
                href="/experience/speakers"
                className="text-[12.5px] text-clay hover:underline"
              >
                Open
              </Link>
            }
          >
            <PipelineBars
              vocabValues={SPEAKER_STATUS.values}
              counts={speakerCounts}
              hrefFor={(s) => `/experience/speakers?status=${encodeURIComponent(s)}`}
            />
          </Panel>

          <Panel
            title="PR pipeline"
            action={
              <Link
                href="/public-relations"
                className="text-[12.5px] text-clay hover:underline"
              >
                Open
              </Link>
            }
          >
            <PipelineBars
              vocabValues={GUEST_STATUS.values}
              counts={guestCounts}
              hrefFor={(s) => `/public-relations?status=${encodeURIComponent(s)}`}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}

/** Stage counts as a proportional bar — reads as a funnel at a glance. */
function PipelineBars({
  vocabValues,
  counts,
  hrefFor,
}: {
  vocabValues: readonly string[];
  counts: Record<string, number>;
  hrefFor: (stage: string) => string;
}) {
  const max = Math.max(1, ...vocabValues.map((s) => counts[s] ?? 0));
  const total = vocabValues.reduce((sum, s) => sum + (counts[s] ?? 0), 0);

  if (total === 0) {
    return (
      <p className="px-5 py-6 text-[13px] text-ink-3">Nothing tracked here yet.</p>
    );
  }

  return (
    <ul className="px-5 py-4">
      {vocabValues.map((stage) => {
        const n = counts[stage] ?? 0;
        return (
          <li key={stage} className="py-1">
            <Link
              href={hrefFor(stage)}
              className="group grid grid-cols-[92px_1fr_28px] items-center gap-3"
            >
              <span className="text-[12.5px] text-ink-2 group-hover:text-ink">
                {stage}
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-sunk">
                <span
                  className="block h-full rounded-full bg-clay/70 transition-all group-hover:bg-clay"
                  style={{ width: `${(n / max) * 100}%` }}
                />
              </span>
              <span className="tnum text-right text-[12.5px] text-ink-2">{n}</span>
            </Link>
          </li>
        );
      })}
      <li className="mt-2 border-t border-rule pt-2">
        <div className="grid grid-cols-[92px_1fr_28px] items-center gap-3">
          <span className="label">Total</span>
          <span />
          <span className="tnum text-right text-[12.5px] text-ink">{total}</span>
        </div>
      </li>
    </ul>
  );
}
