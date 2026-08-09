import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { createSpeaker } from "../../actions";
import { SpeakerForm } from "../../speaker-form";

export const dynamic = "force-dynamic";

export default async function NewSpeakerPage() {
  const topics = await db.topic.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader eyebrow="Experience" title="New speaker" />
      <SpeakerForm
        topics={topics}
        action={createSpeaker}
        submitLabel="Create speaker"
        cancelHref="/experience/speakers"
      />
    </>
  );
}
