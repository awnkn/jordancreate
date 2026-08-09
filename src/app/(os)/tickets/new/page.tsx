import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { createOrder } from "../actions";
import { OrderForm } from "../order-form";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({
  searchParams,
}: PageProps<"/tickets/new">) {
  const { event } = await searchParams;
  const events = await db.event.findMany({
    select: { id: true, name: true },
    orderBy: { startDate: "desc" },
  });

  return (
    <>
      <PageHeader eyebrow="Ticket Buyers" title="New order" />
      <OrderForm
        events={events}
        defaultEventId={typeof event === "string" ? event : undefined}
        action={createOrder}
        submitLabel="Create order"
        cancelHref="/tickets"
      />
    </>
  );
}
