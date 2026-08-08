import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { createContent } from "../actions";
import { ContentForm } from "../content-form";

export const dynamic = "force-dynamic";

export default async function NewContentPage() {
  const [projects, topics] = await Promise.all([
    db.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.topic.findMany({
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Content" title="New piece" />
      <ContentForm
        projects={projects}
        topics={topics}
        action={createContent}
        submitLabel="Create piece"
        cancelHref="/content"
      />
    </>
  );
}
