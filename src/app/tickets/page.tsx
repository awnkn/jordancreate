import Link from "next/link";
import { FilterBar, SearchBox, Toolbar } from "@/components/filters";
import {
  Badge,
  Chip,
  EmptyState,
  PageHeader,
  Panel,
  RowLink,
  Stat,
  StatRow,
} from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { TICKET_STATUS } from "@/lib/taxonomy";
import { setOrderStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function TicketsPage({
  searchParams,
}: PageProps<"/tickets">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : null;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const eventId = typeof params.event === "string" ? params.event : null;

  const [orders, all, events] = await Promise.all([
    db.ticketOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(eventId ? { eventId } : {}),
        ...(q
          ? { OR: [{ buyerName: { contains: q } }, { email: { contains: q } }] }
          : {}),
      },
      include: { event: { select: { id: true, name: true } } },
      orderBy: { purchasedAt: "desc" },
    }),
    db.ticketOrder.groupBy({
      by: ["status"],
      where: eventId ? { eventId } : {},
      _count: true,
    }),
    db.event.findMany({
      where: { tickets: { some: {} } },
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  const counts = Object.fromEntries(all.map((r) => [r.status, r._count]));

  const sold = orders.filter((o) => o.status !== "Refunded");
  const seats = sold.reduce((sum, o) => sum + o.quantity, 0);
  const revenue = sold.reduce((sum, o) => sum + (o.amount ?? 0), 0);
  const checkedIn = orders
    .filter((o) => o.status === "Checked In")
    .reduce((sum, o) => sum + o.quantity, 0);

  return (
    <>
      <PageHeader
        eyebrow="Ticket Buyers"
        title="Orders"
        lede="Everyone who's bought a seat — what they paid, and whether they've walked in."
        actions={
          <Link href="/tickets/new" className="btn btn-primary">
            New order
          </Link>
        }
      />

      <StatRow>
        <Stat label="Orders" value={sold.length} hint="excluding refunds" />
        <Stat label="Seats sold" value={seats} hint="across all events" />
        <Stat label="Revenue" value={formatMoney(revenue)} hint="net of refunds" />
        <Stat label="Checked in" value={checkedIn} hint="seats through the door" />
      </StatRow>

      {events.length > 1 ? (
        <div className="mb-4 flex flex-wrap items-center gap-1">
          <span className="label mr-2">Event</span>
          <EventPill href="/tickets" active={!eventId} label="All" />
          {events.map((e) => (
            <EventPill
              key={e.id}
              href={`/tickets?event=${e.id}`}
              active={eventId === e.id}
              label={e.name}
            />
          ))}
        </div>
      ) : null}

      <Toolbar>
        <FilterBar
          basePath={eventId ? `/tickets?event=${eventId}` : "/tickets"}
          options={TICKET_STATUS.values}
          active={status}
          counts={counts}
          query={q}
        />
        <SearchBox
          basePath="/tickets"
          placeholder="Search buyers…"
          query={q}
          status={status}
        />
      </Toolbar>

      <Panel>
        {orders.length === 0 ? (
          <EmptyState
            title={q || status || eventId ? "Nothing matches that filter" : "No orders yet"}
            body={
              q || status || eventId
                ? "Try a different filter, or clear the search."
                : "Orders land here as they come in — or add one by hand for comps and invoiced sales."
            }
            action={
              q || status || eventId ? (
                <Link href="/tickets" className="btn">
                  Clear filters
                </Link>
              ) : (
                <Link href="/tickets/new" className="btn btn-primary">
                  Add an order
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="pt-4">Buyer</th>
                  <th className="pt-4">Event</th>
                  <th className="pt-4">Type</th>
                  <th className="pt-4">Status</th>
                  <th className="pt-4 text-right">Seats</th>
                  <th className="pt-4 text-right">Amount</th>
                  <th className="pt-4">Purchased</th>
                  <th className="pt-4" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const checkIn = setOrderStatus.bind(null, o.id, "Checked In");
                  return (
                    <tr key={o.id}>
                      <td className="max-w-[220px]">
                        <RowLink href={`/tickets/${o.id}`}>{o.buyerName}</RowLink>
                        {o.email ? (
                          <div className="mt-0.5 truncate text-[12px] text-ink-3">
                            {o.email}
                          </div>
                        ) : null}
                      </td>
                      <td className="text-ink-2">
                        <Link
                          href={`/experience/${o.event.id}`}
                          className="hover:text-clay"
                        >
                          {o.event.name}
                        </Link>
                      </td>
                      <td>
                        <Chip>{o.ticketType}</Chip>
                      </td>
                      <td>
                        <Badge value={o.status} vocab={TICKET_STATUS} />
                      </td>
                      <td className="tnum text-right text-ink-2">{o.quantity}</td>
                      <td className="tnum text-right text-ink-2">
                        {formatMoney(o.amount)}
                      </td>
                      <td className="tnum whitespace-nowrap text-ink-2">
                        {formatDate(o.purchasedAt)}
                      </td>
                      <td className="text-right">
                        {o.status === "Paid" ? (
                          <form action={checkIn}>
                            <button
                              type="submit"
                              className="text-[12.5px] whitespace-nowrap text-ink-3 hover:text-clay"
                            >
                              Check in
                            </button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

function EventPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-[13px] transition-colors ${
        active ? "bg-ink text-paper" : "text-ink-2 hover:bg-sunk hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
