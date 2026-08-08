"use server";

import { redirect } from "next/navigation";
import { revalidateAll } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { nullify, toDate } from "@/lib/format";
import {
  CONTENT_FORMAT,
  CONTENT_PLATFORM,
  CONTENT_STATUS,
  constrain,
} from "@/lib/taxonomy";

function topicIds(form: FormData): string[] {
  return form.getAll("topicIds").filter((v): v is string => typeof v === "string");
}

function contentData(form: FormData) {
  return {
    title: (nullify(form.get("title")) ?? "Untitled") as string,
    format: constrain(form.get("format"), CONTENT_FORMAT.values, "Article"),
    platforms: form
      .getAll("platforms")
      .filter((v): v is string => typeof v === "string")
      .filter((v) => (CONTENT_PLATFORM.values as readonly string[]).includes(v)),
    status: constrain(form.get("status"), CONTENT_STATUS.values, "Idea"),
    owner: nullify(form.get("owner")),
    brief: nullify(form.get("brief")),
    url: nullify(form.get("url")),
    publishDate: toDate(form.get("publishDate")),
    projectId: nullify(form.get("projectId")),
  };
}


export async function createContent(form: FormData) {
  const piece = await db.contentPiece.create({
    data: {
      ...contentData(form),
      topics: { connect: topicIds(form).map((id) => ({ id })) },
    },
  });
  revalidateAll();
  redirect(`/content/${piece.id}`);
}

export async function updateContent(id: string, form: FormData) {
  await db.contentPiece.update({
    where: { id },
    data: {
      ...contentData(form),
      // `set` replaces the whole list, so unchecking a topic actually removes it.
      topics: { set: topicIds(form).map((tid) => ({ id: tid })) },
    },
  });
  revalidateAll();
  redirect(`/content/${id}`);
}

export async function deleteContent(id: string) {
  await db.contentPiece.delete({ where: { id } });
  revalidateAll();
  redirect("/content");
}
