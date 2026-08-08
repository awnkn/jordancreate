import { VendorList } from "../vendor-list";

export const dynamic = "force-dynamic";

export default async function SpacePartnersPage({
  searchParams,
}: PageProps<"/vendors/space-partners">) {
  const params = await searchParams;
  return (
    <VendorList
      kind="Space Partner"
      basePath="/vendors/space-partners"
      title="Space Partners"
      lede="The partners renting space inside Jordan Create — leases, rent, and renewal dates."
      status={typeof params.status === "string" ? params.status : null}
      q={typeof params.q === "string" ? params.q.trim() : ""}
    />
  );
}
