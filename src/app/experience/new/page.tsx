import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { createEvent } from "../actions";
import { EventForm } from "../event-form";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const projects = await db.project.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader eyebrow="Experience" title="New event" />
      <EventForm
        projects={projects}
        action={createEvent}
        submitLabel="Create event"
        cancelHref="/experience"
      />
    </>
  );
}
