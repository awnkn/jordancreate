import { VendorList } from "./vendor-list";

export const dynamic = "force-dynamic";

export default async function VendorsPage({ searchParams }: PageProps<"/vendors">) {
  const params = await searchParams;
  return (
    <VendorList
      basePath="/vendors"
      title="Vendors"
      lede="Everyone the studio buys from, and every partner renting a corner of Jordan Create."
      status={typeof params.status === "string" ? params.status : null}
      q={typeof params.q === "string" ? params.q.trim() : ""}
    />
  );
}
