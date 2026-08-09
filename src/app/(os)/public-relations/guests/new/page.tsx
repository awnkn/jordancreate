import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { createGuest } from "../../actions";
import { GuestForm } from "../../guest-form";

export const dynamic = "force-dynamic";

export default async function NewGuestPage() {
  const topics = await db.topic.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader eyebrow="Public Relations" title="New guest spot" />
      <GuestForm
        topics={topics}
        action={createGuest}
        submitLabel="Create guest spot"
        cancelHref="/public-relations"
      />
    </>
  );
}
