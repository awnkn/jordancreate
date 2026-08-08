"use server";

import { redirect } from "next/navigation";
import { revalidateAll } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { nullify, toDate, toNumber } from "@/lib/format";
import {
  GUEST_CATEGORY,
  GUEST_FORMAT,
  GUEST_STATUS,
  INTERACTION_KIND,
  constrain,
} from "@/lib/taxonomy";

function topicIds(form: FormData): string[] {
  return form.getAll("topicIds").filter((v): v is string => typeof v === "string");
}

function guestData(form: FormData) {
  return {
    name: (nullify(form.get("name")) ?? "Unnamed contact") as string,
    category: constrain(form.get("category"), GUEST_CATEGORY.values, "General Guests"),
    outlet: nullify(form.get("outlet")),
    showName: nullify(form.get("showName")),
    format: constrain(form.get("format"), GUEST_FORMAT.values, "Podcast"),
    status: constrain(form.get("status"), GUEST_STATUS.values, "Prospect"),
    email: nullify(form.get("email")),
    phone: nullify(form.get("phone")),
    audienceSize: toNumber(form.get("audienceSize")),
    scheduledFor: toDate(form.get("scheduledFor")),
    publishedUrl: nullify(form.get("publishedUrl")),
    angle: nullify(form.get("angle")),
    notes: nullify(form.get("notes")),
  };
}


export async function createGuest(form: FormData) {
  const guest = await db.guest.create({
    data: {
      ...guestData(form),
      topics: { connect: topicIds(form).map((id) => ({ id })) },
    },
  });
  revalidateAll();
  redirect(`/public-relations/guests/${guest.id}`);
}

export async function updateGuest(id: string, form: FormData) {
  await db.guest.update({
    where: { id },
    data: {
      ...guestData(form),
      topics: { set: topicIds(form).map((tid) => ({ id: tid })) },
    },
  });
  revalidateAll();
  redirect(`/public-relations/guests/${id}`);
}

export async function deleteGuest(id: string) {
  await db.guest.delete({ where: { id } });
  revalidateAll();
  redirect("/public-relations");
}

/** Advance a guest along the pitch pipeline without opening the record. */
export async function setGuestStatus(id: string, status: string) {
  await db.guest.update({
    where: { id },
    data: { status: constrain(status, GUEST_STATUS.values, "Prospect") },
  });
  revalidateAll();
}

/** Twin of the speaker-side logger — same log, different owner. */
export async function logGuestInteraction(guestId: string, form: FormData) {
  const summary = nullify(form.get("summary"));
  if (!summary) return;

  await db.interaction.create({
    data: {
      guestId,
      summary,
      kind: constrain(form.get("kind"), INTERACTION_KIND.values, "Note"),
      occurredAt: toDate(form.get("occurredAt")) ?? new Date(),
    },
  });
}
