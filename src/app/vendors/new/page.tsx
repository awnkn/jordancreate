import { PageHeader } from "@/components/ui";
import { createVendor } from "../actions";
import { VendorForm } from "../vendor-form";

export default async function NewVendorPage({
  searchParams,
}: PageProps<"/vendors/new">) {
  const { kind } = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Vendors" title="New vendor" />
      <VendorForm
        defaultKind={typeof kind === "string" ? kind : undefined}
        action={createVendor}
        submitLabel="Add vendor"
        cancelHref="/vendors"
      />
    </>
  );
}
