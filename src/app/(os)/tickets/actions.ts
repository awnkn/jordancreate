"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { nullify, toDate, toNumber } from "@/lib/format";
import { revalidateAll } from "@/lib/revalidate";
import { TICKET_STATUS, TICKET_TYPE, constrain } from "@/lib/taxonomy";

function orderData(form: FormData) {
  const quantity = toNumber(form.get("quantity"));
  return {
    buyerFirstName: (nullify(form.get("buyerFirstName")) ?? "Unnamed") as string,
    buyerLastName: (nullify(form.get("buyerLastName")) ?? "") as string,
    email: nullify(form.get("email")),
    ticketType: constrain(form.get("ticketType"), TICKET_TYPE.values, "General"),
    quantity: quantity && quantity >= 1 ? Math.round(quantity) : 1,
    amount: toNumber(form.get("amount")),
    status: constrain(form.get("status"), TICKET_STATUS.values, "Paid"),
    purchasedAt: toDate(form.get("purchasedAt")) ?? new Date(),
    notes: nullify(form.get("notes")),
  };
}

export async function createOrder(form: FormData) {
  const eventId = nullify(form.get("eventId"));
  if (!eventId) return; // an order without an event is meaningless

  const order = await db.ticketOrder.create({
    data: { ...orderData(form), eventId },
  });
  revalidateAll();
  redirect(`/tickets/${order.id}`);
}

export async function updateOrder(id: string, form: FormData) {
  const eventId = nullify(form.get("eventId"));
  await db.ticketOrder.update({
    where: { id },
    data: { ...orderData(form), ...(eventId ? { eventId } : {}) },
  });
  revalidateAll();
  redirect(`/tickets/${id}`);
}

export async function deleteOrder(id: string) {
  await db.ticketOrder.delete({ where: { id } });
  revalidateAll();
  redirect("/tickets");
}

/** Door flow: one click from the list to check a buyer in. */
export async function setOrderStatus(id: string, status: string) {
  await db.ticketOrder.update({
    where: { id },
    data: { status: constrain(status, TICKET_STATUS.values, "Paid") },
  });
  revalidateAll();
}
