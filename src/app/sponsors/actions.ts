"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { nullify, toDate, toNumber } from "@/lib/format";
import { revalidateAll } from "@/lib/revalidate";
import {
  INTERACTION_KIND,
  SPONSOR_STATUS,
  SPONSOR_TIER,
  constrain,
} from "@/lib/taxonomy";

function sponsorData(form: FormData) {
  return {
    company: (nullify(form.get("company")) ?? "Unnamed company") as string,
    contactName: nullify(form.get("contactName")),
    contactRole: nullify(form.get("contactRole")),
    email: nullify(form.get("email")),
    phone: nullify(form.get("phone")),
    website: nullify(form.get("website")),
    status: constrain(form.get("status"), SPONSOR_STATUS.values, "Lead"),
    tier: constrain(form.get("tier"), SPONSOR_TIER.values, "Partner"),
    value: toNumber(form.get("value")),
    nextStep: nullify(form.get("nextStep")),
    closeDate: toDate(form.get("closeDate")),
    notes: nullify(form.get("notes")),
    eventId: nullify(form.get("eventId")),
  };
}

export async function createSponsor(form: FormData) {
  const sponsor = await db.sponsor.create({ data: sponsorData(form) });
  revalidateAll();
  redirect(`/sponsors/${sponsor.id}`);
}

export async function updateSponsor(id: string, form: FormData) {
  await db.sponsor.update({ where: { id }, data: sponsorData(form) });
  revalidateAll();
  redirect(`/sponsors/${id}`);
}

export async function deleteSponsor(id: string) {
  await db.sponsor.delete({ where: { id } });
  revalidateAll();
  redirect("/sponsors");
}

/** Advance a deal through the pipeline without opening the edit form. */
export async function setSponsorStatus(id: string, status: string) {
  await db.sponsor.update({
    where: { id },
    data: { status: constrain(status, SPONSOR_STATUS.values, "Lead") },
  });
  revalidateAll();
}

export async function logSponsorInteraction(sponsorId: string, form: FormData) {
  const summary = nullify(form.get("summary"));
  if (!summary) return;

  await db.interaction.create({
    data: {
      sponsorId,
      summary,
      kind: constrain(form.get("kind"), INTERACTION_KIND.values, "Note"),
      occurredAt: toDate(form.get("occurredAt")) ?? new Date(),
    },
  });
  revalidateAll();
}
