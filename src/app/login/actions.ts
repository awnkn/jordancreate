"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  hashPassword,
  noLoginsExist,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { nullify } from "@/lib/format";

/** Only same-app paths are safe redirect targets after login. */
function safePath(value: FormDataEntryValue | null): string {
  const s = nullify(value);
  return s && s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export async function login(form: FormData) {
  const username = nullify(form.get("username"))?.toLowerCase();
  const password = typeof form.get("password") === "string" ? (form.get("password") as string) : "";
  const from = safePath(form.get("from"));

  const person = username
    ? await db.person.findUnique({
        where: { username },
        select: { id: true, passwordHash: true },
      })
    : null;

  if (!person?.passwordHash || !verifyPassword(password, person.passwordHash)) {
    redirect(`/login?error=1${from !== "/" ? `&from=${encodeURIComponent(from)}` : ""}`);
  }

  await createSession(person.id);
  redirect(from);
}

/** First-run only: create the first login and sign in as that person. */
export async function setupFirstLogin(form: FormData) {
  // Re-checked server-side — the form disappearing isn't a security boundary.
  if (!(await noLoginsExist())) redirect("/login");

  const personId = nullify(form.get("personId"));
  const username = nullify(form.get("username"))?.toLowerCase();
  const password = typeof form.get("password") === "string" ? (form.get("password") as string) : "";

  if (!personId || !username || password.length < 8) {
    redirect("/login?error=setup");
  }

  await db.person.update({
    where: { id: personId },
    data: { username, passwordHash: hashPassword(password) },
  });

  await createSession(personId);
  redirect("/people?welcome=1");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
