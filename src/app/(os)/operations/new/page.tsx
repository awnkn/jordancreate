import { PageHeader } from "@/components/ui";
import { createProject } from "../actions";
import { ProjectForm } from "../project-form";

export default function NewProjectPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="New project"
        lede="Set it up once; tasks, content and events can all point at it afterwards."
      />
      <ProjectForm
        action={createProject}
        submitLabel="Create project"
        cancelHref="/operations"
      />
    </>
  );
}
