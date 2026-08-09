import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { createSponsor } from "../actions";
import { SponsorForm } from "../sponsor-form";

export const dynamic = "force-dynamic";

export default async function NewSponsorPage() {
  const events = await db.event.findMany({
    select: { id: true, name: true },
    orderBy: { startDate: "desc" },
  });

  return (
    <>
      <PageHeader eyebrow="Sponsors" title="New deal" />
      <SponsorForm
        events={events}
        action={createSponsor}
        submitLabel="Create deal"
        cancelHref="/sponsors"
      />
    </>
  );
}
