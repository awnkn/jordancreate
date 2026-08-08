import Link from "next/link";
import { notFound } from "next/navigation";
import { Field, Input, Select } from "@/components/form";
import { DeleteButton, SubmitButton } from "@/components/form-actions";
import {
  Badge,
  Chip,
  Detail,
  DetailList,
  EmptyState,
  PageHeader,
  Panel,
  RowLink,
  Stat,
  StatRow,
} from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { db } from "@/lib/db";
import { dateInputValue, formatMoney, formatRange, fullName, relativeDays } from "@/lib/format";
import { BOOKING_STATUS, EVENT_STATUS } from "@/lib/taxonomy";
import { createBooking, deleteBooking, deleteEvent, updateEvent } from "../actions";
import { EventForm } from "../event-form";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
  searchParams,
}: PageProps<"/experience/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [event, projects, speakers, topics] = await Promise.all([
    db.event.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        topics: { select: { id: true, name: true } },
        bookings: {
          include: { speaker: { select: { id: true, firstName: true, lastName: true, photoUrl: true, company: true, status: true } } },
          orderBy: [{ startTime: "asc" }],
        },
      },
    }),
    db.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.speaker.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        topics: { select: { id: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    db.topic.findMany({
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!event) notFound();

  if (edit !== undefined) {
    const update = updateEvent.bind(null, event.id);
    return (
      <>
        <PageHeader eyebrow="Experience · Event" title={`Edit ${event.name}`} />
        <EventForm
          event={event}
          projects={projects}
          topics={topics}
          selectedTopicIds={event.topics.map((t) => t.id)}
          action={update}
          submitLabel="Save changes"
          cancelHref={`/experience/${event.id}`}
        />
      </>
    );
  }

  const confirmed = event.bookings.filter((b) => b.status === "Confirmed").length;
  const speakerSpend = event.bookings.reduce((sum, b) => sum + (b.fee ?? 0), 0);
  const book = createBooking.bind(null, event.id);
  const del = deleteEvent.bind(null, event.id);

  // Only offer speakers who aren't already on the bill — and surface the ones
  // who cover this event's topics first. That's the match this page is for.
  const booked = new Set(event.bookings.map((b) => b.speakerId));
  const eventTopicIds = new Set(event.topics.map((t) => t.id));
  const available = speakers.filter((s) => !booked.has(s.id));
  const matching = available.filter((s) =>
    s.topics.some((t) => eventTopicIds.has(t.id)),
  );
  const others = available.filter(
    (s) => !s.topics.some((t) => eventTopicIds.has(t.id)),
  );

  return (
    <>
      <PageHeader
        eyebrow="Experience · Event"
        title={event.name}
        lede={event.summary ?? undefined}
        actions={
          <>
            <Link href={`/experience/${event.id}?edit`} className="btn">
              Edit
            </Link>
            <DeleteButton
              action={del}
              confirmText={`Delete "${event.name}"? Its ${event.bookings.length} booking(s) will be removed too.`}
            />
          </>
        }
      />

      <StatRow>
        <Stat label="Status" value={event.status} />
        <Stat
          label="Dates"
          value={formatRange(event.startDate, event.endDate)}
          hint={event.startDate ? relativeDays(event.startDate) : undefined}
        />
        <Stat
          label="On the bill"
          value={event.bookings.length}
          hint={`${confirmed} confirmed`}
        />
        <Stat
          label="Speaker fees"
          value={formatMoney(speakerSpend)}
          hint="Committed to date"
        />
      </StatRow>

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <DetailList>
              <Detail label="Status">
                <Badge value={event.status} vocab={EVENT_STATUS} />
              </Detail>
              <Detail label="Format">
                <Chip>{event.format}</Chip>
              </Detail>
              <Detail label="Venue">{event.venue ?? "—"}</Detail>
              <Detail label="City">{event.city ?? "—"}</Detail>
              <Detail label="Capacity">{event.capacity ?? "—"}</Detail>
              <Detail label="Topics">
                {event.topics.length === 0 ? (
                  "—"
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {event.topics.map((t) => (
                      <Link key={t.id} href={`/experience/topics/${t.id}`}>
                        <Chip>{t.name}</Chip>
                      </Link>
                    ))}
                  </div>
                )}
              </Detail>
              <Detail label="Project">
                {event.project ? (
                  <Link
                    href={`/operations/${event.project.id}`}
                    className="text-clay hover:underline"
                  >
                    {event.project.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Detail>
            </DetailList>
          </Panel>

          <Panel title="Book a speaker">
            {available.length === 0 ? (
              <p className="px-5 py-5 text-[13px] text-ink-3">
                {speakers.length === 0 ? (
                  <>
                    No speakers on file yet.{" "}
                    <Link href="/experience/speakers/new" className="text-clay hover:underline">
                      Add one
                    </Link>
                    .
                  </>
                ) : (
                  "Every speaker on file is already on this bill."
                )}
              </p>
            ) : (
              <form action={book} className="space-y-3 px-5 py-4">
                <Field
                  label="Speaker"
                  hint={
                    matching.length > 0
                      ? "Speakers covering this event's topics are listed first."
                      : undefined
                  }
                >
                  <select name="speakerId" className="select" required>
                    {matching.length > 0 ? (
                      <>
                        <optgroup label="Cover this event's topics">
                          {matching.map((s) => (
                            <option key={s.id} value={s.id}>
                              {fullName(s)}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Other speakers">
                          {others.map((s) => (
                            <option key={s.id} value={s.id}>
                              {fullName(s)}
                            </option>
                          ))}
                        </optgroup>
                      </>
                    ) : (
                      available.map((s) => (
                        <option key={s.id} value={s.id}>
                          {fullName(s)}
                        </option>
                      ))
                    )}
                  </select>
                </Field>
                <Field label="Slot">
                  <Input name="slotTitle" placeholder="Opening keynote" />
                </Field>
                <Field label="Status">
                  <Select name="status" options={BOOKING_STATUS.values} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Time">
                    <Input
                      type="date"
                      name="startTime"
                      defaultValue={dateInputValue(event.startDate)}
                    />
                  </Field>
                  <Field label="Fee">
                    <Input name="fee" inputMode="decimal" placeholder="9000" />
                  </Field>
                </div>
                <SubmitButton label="Add to bill" pendingLabel="Adding…" />
              </form>
            )}
          </Panel>
        </div>

        <Panel title="Line-up">
          {event.bookings.length === 0 ? (
            <EmptyState
              title="Nobody booked yet"
              body="Add speakers from the panel on the left to start building the running order."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th className="pt-4">Speaker</th>
                    <th className="pt-4">Slot</th>
                    <th className="pt-4">Booking</th>
                    <th className="pt-4 text-right">Fee</th>
                    <th className="pt-4" />
                  </tr>
                </thead>
                <tbody>
                  {event.bookings.map((b) => {
                    const remove = deleteBooking.bind(null, b.id);
                    return (
                      <tr key={b.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              firstName={b.speaker.firstName}
                              lastName={b.speaker.lastName}
                              photoUrl={b.speaker.photoUrl}
                              size={32}
                            />
                            <div className="min-w-0">
                          <RowLink href={`/experience/speakers/${b.speaker.id}`}>
                            {fullName(b.speaker)}
                          </RowLink>
                          {/* Deliberately no speaker-status badge here — the
                              Booking column already says "Confirmed", and two
                              badges with the same word mean different things. */}
                              <div className="mt-0.5 text-[12px] text-ink-3">
                                {b.speaker.company ?? "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[280px] text-ink-2">
                          {b.slotTitle ?? "—"}
                        </td>
                        <td>
                          <Badge value={b.status} vocab={BOOKING_STATUS} />
                        </td>
                        <td className="tnum text-right text-ink-2">
                          {formatMoney(b.fee)}
                        </td>
                        <td className="text-right">
                          <form action={remove}>
                            <button
                              type="submit"
                              className="text-[12.5px] whitespace-nowrap text-ink-3 hover:text-tone-danger-fg"
                            >
                              Remove
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
