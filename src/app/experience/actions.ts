"use server";

import { redirect } from "next/navigation";
import { revalidateAll } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { nullify, toDate, toNumber } from "@/lib/format";
import {
  BOOKING_STATUS,
  EVENT_FORMAT,
  EVENT_STATUS,
  INTERACTION_KIND,
  SPEAKER_STATUS,
  TOPIC_CATEGORY,
  TOPIC_STATUS,
  constrain,
} from "@/lib/taxonomy";

function topicIds(form: FormData): string[] {
  return form.getAll("topicIds").filter((v): v is string => typeof v === "string");
}

// ------------------------------------------------------------------- Events

function eventData(form: FormData) {
  return {
    name: (nullify(form.get("name")) ?? "Untitled event") as string,
    format: constrain(form.get("format"), EVENT_FORMAT.values, "Conference"),
    status: constrain(form.get("status"), EVENT_STATUS.values, "Concept"),
    venue: nullify(form.get("venue")),
    city: nullify(form.get("city")),
    startDate: toDate(form.get("startDate")),
    endDate: toDate(form.get("endDate")),
    capacity: toNumber(form.get("capacity")),
    summary: nullify(form.get("summary")),
    projectId: nullify(form.get("projectId")),
  };
}

export async function createEvent(form: FormData) {
  const event = await db.event.create({ data: eventData(form) });
  revalidateAll();
  redirect(`/experience/${event.id}`);
}

export async function updateEvent(id: string, form: FormData) {
  await db.event.update({ where: { id }, data: eventData(form) });
  revalidateAll();
  redirect(`/experience/${id}`);
}

export async function deleteEvent(id: string) {
  await db.event.delete({ where: { id } });
  revalidateAll();
  redirect("/experience");
}

// ----------------------------------------------------------------- Speakers

function speakerData(form: FormData) {
  return {
    firstName: (nullify(form.get("firstName")) ?? "Unnamed") as string,
    lastName: (nullify(form.get("lastName")) ?? "") as string,
    role: nullify(form.get("role")),
    company: nullify(form.get("company")),
    email: nullify(form.get("email")),
    phone: nullify(form.get("phone")),
    website: nullify(form.get("website")),
    location: nullify(form.get("location")),
    status: constrain(form.get("status"), SPEAKER_STATUS.values, "Prospect"),
    fee: nullify(form.get("fee")),
    bio: nullify(form.get("bio")),
  };
}

export async function createSpeaker(form: FormData) {
  const speaker = await db.speaker.create({
    data: {
      ...speakerData(form),
      topics: { connect: topicIds(form).map((id) => ({ id })) },
    },
  });
  revalidateAll();
  redirect(`/experience/speakers/${speaker.id}`);
}

export async function updateSpeaker(id: string, form: FormData) {
  await db.speaker.update({
    where: { id },
    data: {
      ...speakerData(form),
      topics: { set: topicIds(form).map((tid) => ({ id: tid })) },
    },
  });
  revalidateAll();
  redirect(`/experience/speakers/${id}`);
}

export async function deleteSpeaker(id: string) {
  await db.speaker.delete({ where: { id } });
  revalidateAll();
  redirect("/experience/speakers");
}

// ------------------------------------------------------------------- Topics

function topicData(form: FormData) {
  return {
    name: (nullify(form.get("name")) ?? "Untitled topic") as string,
    category: constrain(form.get("category"), TOPIC_CATEGORY.values, "Craft"),
    status: constrain(form.get("status"), TOPIC_STATUS.values, "Active"),
    description: nullify(form.get("description")),
  };
}

export async function createTopic(form: FormData) {
  const topic = await db.topic.create({ data: topicData(form) });
  revalidateAll();
  redirect(`/experience/topics/${topic.id}`);
}

export async function updateTopic(id: string, form: FormData) {
  await db.topic.update({ where: { id }, data: topicData(form) });
  revalidateAll();
  redirect(`/experience/topics/${id}`);
}

export async function deleteTopic(id: string) {
  await db.topic.delete({ where: { id } });
  revalidateAll();
  redirect("/experience/topics");
}

// ----------------------------------------------------------------- Bookings

/** Book a speaker onto an event from the event page. */
export async function createBooking(eventId: string, form: FormData) {
  const speakerId = nullify(form.get("speakerId"));
  if (!speakerId) return;

  await db.booking.upsert({
    // One slot per speaker per event — re-submitting updates rather than dupes.
    where: { eventId_speakerId: { eventId, speakerId } },
    create: {
      eventId,
      speakerId,
      slotTitle: nullify(form.get("slotTitle")),
      status: constrain(form.get("status"), BOOKING_STATUS.values, "Held"),
      startTime: toDate(form.get("startTime")),
      fee: toNumber(form.get("fee")),
    },
    update: {
      slotTitle: nullify(form.get("slotTitle")),
      status: constrain(form.get("status"), BOOKING_STATUS.values, "Held"),
      startTime: toDate(form.get("startTime")),
      fee: toNumber(form.get("fee")),
    },
  });
  revalidateAll();
}

export async function setBookingStatus(id: string, status: string) {
  await db.booking.update({
    where: { id },
    data: { status: constrain(status, BOOKING_STATUS.values, "Held") },
  });
  revalidateAll();
}

export async function deleteBooking(id: string) {
  await db.booking.delete({ where: { id } });
  revalidateAll();
}

// -------------------------------------------------------------- Interactions

/** Log a touchpoint against a speaker. Guests use the PR-side twin. */
export async function logSpeakerInteraction(speakerId: string, form: FormData) {
  const summary = nullify(form.get("summary"));
  if (!summary) return;

  await db.interaction.create({
    data: {
      speakerId,
      summary,
      kind: constrain(form.get("kind"), INTERACTION_KIND.values, "Note"),
      occurredAt: toDate(form.get("occurredAt")) ?? new Date(),
    },
  });
  revalidateAll();
}

export async function deleteInteraction(id: string) {
  await db.interaction.delete({ where: { id } });
  revalidateAll();
}
