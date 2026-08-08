import { VendorList } from "../vendor-list";

export const dynamic = "force-dynamic";

export default async function SuppliersPage({
  searchParams,
}: PageProps<"/vendors/suppliers">) {
  const params = await searchParams;
  return (
    <VendorList
      kind="Supplier"
      basePath="/vendors/suppliers"
      title="Suppliers"
      lede="AV, print, catering, insurance — the companies the studio depends on to deliver."
      status={typeof params.status === "string" ? params.status : null}
      q={typeof params.q === "string" ? params.q.trim() : ""}
    />
  );
}
