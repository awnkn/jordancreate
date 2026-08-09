import { PageHeader } from "@/components/ui";
import { createTopic } from "../../actions";
import { TopicForm } from "../../topic-form";

export default function NewTopicPage() {
  return (
    <>
      <PageHeader eyebrow="Experience" title="New topic" />
      <TopicForm
        action={createTopic}
        submitLabel="Create topic"
        cancelHref="/experience/topics"
      />
    </>
  );
}
