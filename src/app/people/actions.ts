"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { nullify, toDate } from "@/lib/format";
import { revalidateAll } from "@/lib/revalidate";
import {
  ACCESS_LEVEL,
  ACCESS_STATUS,
  PERSON_STATUS,
  constrain,
} from "@/lib/taxonomy";

// ------------------------------------------------------------------- People

function personData(form: FormData) {
  return {
    firstName: (nullify(form.get("firstName")) ?? "Unnamed") as string,
    lastName: (nullify(form.get("lastName")) ?? "") as string,
    role: nullify(form.get("role")),
    status: constrain(form.get("status"), PERSON_STATUS.values, "Core Team"),
    email: nullify(form.get("email")),
    phone: nullify(form.get("phone")),
    location: nullify(form.get("location")),
    startDate: toDate(form.get("startDate")),
    notes: nullify(form.get("notes")),
  };
}

export async function createPerson(form: FormData) {
  const person = await db.person.create({ data: personData(form) });
  revalidateAll();
  redirect(`/people/${person.id}`);
}

export async function updatePerson(id: string, form: FormData) {
  await db.person.update({ where: { id }, data: personData(form) });
  revalidateAll();
  redirect(`/people/${id}`);
}

export async function deletePerson(id: string) {
  // Their access grants cascade away with them.
  await db.person.delete({ where: { id } });
  revalidateAll();
  redirect("/people");
}

// ------------------------------------------------------------------- Access

function grantData(form: FormData) {
  return {
    system: (nullify(form.get("system")) ?? "Unnamed system") as string,
    level: constrain(form.get("level"), ACCESS_LEVEL.values, "Editor"),
    status: constrain(form.get("status"), ACCESS_STATUS.values, "Active"),
    url: nullify(form.get("url")),
    notes: nullify(form.get("notes")),
    grantedAt: toDate(form.get("grantedAt")) ?? new Date(),
  };
}

/** Create a grant from the Access page (person picked in the form). */
export async function createGrant(form: FormData) {
  const personId = nullify(form.get("personId"));
  if (!personId) return;

  await db.accessGrant.create({ data: { ...grantData(form), personId } });
  revalidateAll();
  redirect("/access");
}

/** Create a grant from a person's page (person already known). */
export async function createGrantForPerson(personId: string, form: FormData) {
  await db.accessGrant.create({ data: { ...grantData(form), personId } });
  revalidateAll();
}

export async function setGrantStatus(id: string, status: string) {
  await db.accessGrant.update({
    where: { id },
    data: { status: constrain(status, ACCESS_STATUS.values, "Active") },
  });
  revalidateAll();
}

export async function deleteGrant(id: string) {
  await db.accessGrant.delete({ where: { id } });
  revalidateAll();
}
