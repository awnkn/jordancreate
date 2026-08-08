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
} from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate, formatMoney, fullName, relativeDays } from "@/lib/format";
import { TICKET_STATUS } from "@/lib/taxonomy";
import { deleteOrder, setOrderStatus, updateOrder } from "../actions";
import { OrderForm } from "../order-form";

export const dynamic = "force-dynamic";

/** "First Last" for a ticket order's buyer fields. */
const buyerName = (o: { buyerFirstName: string; buyerLastName: string }) =>
  fullName({ firstName: o.buyerFirstName, lastName: o.buyerLastName });

export default async function OrderPage({
  params,
  searchParams,
}: PageProps<"/tickets/[id]">) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [order, events] = await Promise.all([
    db.ticketOrder.findUnique({
      where: { id },
      include: { event: { select: { id: true, name: true, startDate: true } } },
    }),
    db.event.findMany({
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  if (!order) notFound();

  if (edit !== undefined) {
    const update = updateOrder.bind(null, order.id);
    return (
      <>
        <PageHeader eyebrow="Ticket Buyers · Order" title={`Edit ${buyerName(order)}`} />
        <OrderForm
          order={order}
          events={events}
          action={update}
          submitLabel="Save changes"
          cancelHref={`/tickets/${order.id}`}
        />
      </>
    );
  }

  const del = deleteOrder.bind(null, order.id);

  return (
    <>
      <PageHeader
        eyebrow="Ticket Buyers · Order"
        title={buyerName(order)}
        lede={`${order.quantity} × ${order.ticketType} — ${order.event.name}`}
        actions={
          <>
            {order.status === "Paid" ? (
              <form action={setOrderStatus.bind(null, order.id, "Checked In")}>
                <button type="submit" className="btn">
                  Check in
                </button>
              </form>
            ) : null}
            <Link href={`/tickets/${order.id}?edit`} className="btn">
              Edit
            </Link>
            <DeleteButton
              action={del}
              confirmText={`Delete ${buyerName(order)}'s order? Prefer marking it Refunded if the money moved.`}
            />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
        <Panel title="Order">
          <DetailList>
            <Detail label="Status">
              <Badge value={order.status} vocab={TICKET_STATUS} />
            </Detail>
            <Detail label="Event">
              <Link
                href={`/experience/${order.event.id}`}
                className="text-clay hover:underline"
              >
                {order.event.name}
              </Link>
            </Detail>
            <Detail label="Type">
              <Chip>{order.ticketType}</Chip>
            </Detail>
            <Detail label="Seats">{order.quantity}</Detail>
            <Detail label="Amount">{formatMoney(order.amount)}</Detail>
            <Detail label="Purchased">
              {formatDate(order.purchasedAt)}
              <span className="ml-2 text-[12px] text-ink-3">
                {relativeDays(order.purchasedAt)}
              </span>
            </Detail>
            <Detail label="Email">
              {order.email ? (
                <a
                  href={`mailto:${order.email}`}
                  className="text-clay hover:underline"
                >
                  {order.email}
                </a>
              ) : (
                "—"
              )}
            </Detail>
          </DetailList>
        </Panel>

        <Panel title="Notes">
          <div className="px-5 py-4">
            {order.notes ? (
              <p className="whitespace-pre-wrap text-ink">{order.notes}</p>
            ) : (
              <p className="text-[13px] text-ink-3">
                Nothing noted for this buyer.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
