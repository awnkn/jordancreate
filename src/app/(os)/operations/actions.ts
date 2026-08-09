"use server";

import { redirect } from "next/navigation";
import { revalidateAll } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { nullify, toDate, toNumber } from "@/lib/format";
import {
  PROJECT_STATUS,
  TASK_PRIORITY,
  TASK_STATUS,
  constrain,
} from "@/lib/taxonomy";

function projectData(form: FormData) {
  return {
    name: (nullify(form.get("name")) ?? "Untitled project") as string,
    client: nullify(form.get("client")),
    status: constrain(form.get("status"), PROJECT_STATUS.values, "Discovery"),
    owner: nullify(form.get("owner")),
    summary: nullify(form.get("summary")),
    startDate: toDate(form.get("startDate")),
    dueDate: toDate(form.get("dueDate")),
    budget: toNumber(form.get("budget")),
  };
}

export async function createProject(form: FormData) {
  const project = await db.project.create({ data: projectData(form) });
  revalidateAll();
  redirect(`/operations/${project.id}`);
}

export async function updateProject(id: string, form: FormData) {
  await db.project.update({ where: { id }, data: projectData(form) });
  revalidateAll();
  redirect(`/operations/${id}`);
}

export async function deleteProject(id: string) {
  // Tasks, content and events fall back to unassigned rather than vanishing.
  await db.project.delete({ where: { id } });
  revalidateAll();
  redirect("/operations");
}

// -------------------------------------------------------------------- Tasks

function taskData(form: FormData) {
  return {
    title: (nullify(form.get("title")) ?? "Untitled task") as string,
    status: constrain(form.get("status"), TASK_STATUS.values, "Todo"),
    priority: constrain(form.get("priority"), TASK_PRIORITY.values, "Medium"),
    assignee: nullify(form.get("assignee")),
    dueDate: toDate(form.get("dueDate")),
    notes: nullify(form.get("notes")),
    projectId: nullify(form.get("projectId")),
  };
}

export async function createTask(form: FormData) {
  const task = await db.task.create({ data: taskData(form) });
  revalidateAll();
  redirect(`/operations/tasks/${task.id}`);
}

export async function updateTask(id: string, form: FormData) {
  await db.task.update({ where: { id }, data: taskData(form) });
  revalidateAll();
  redirect(`/operations/tasks/${id}`);
}

export async function deleteTask(id: string) {
  await db.task.delete({ where: { id } });
  revalidateAll();
  redirect("/operations/tasks");
}

/** One-click advance from a task list, without opening the record. */
export async function setTaskStatus(id: string, status: string) {
  await db.task.update({
    where: { id },
    data: { status: constrain(status, TASK_STATUS.values, "Todo") },
  });
  revalidateAll();
}
