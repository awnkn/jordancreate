import { PageHeader } from "@/components/ui";
import { createPerson } from "../actions";
import { PersonForm } from "../person-form";

export default function NewPersonPage() {
  return (
    <>
      <PageHeader eyebrow="People" title="New person" />
      <PersonForm
        action={createPerson}
        submitLabel="Add person"
        cancelHref="/people"
      />
    </>
  );
}
