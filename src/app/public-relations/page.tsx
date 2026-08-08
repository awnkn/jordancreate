import { GuestList } from "./guest-list";

export const dynamic = "force-dynamic";

export default async function PublicRelationsPage({
  searchParams,
}: PageProps<"/public-relations">) {
  const params = await searchParams;

  return (
    <GuestList
      basePath="/public-relations"
      title="Guests"
      lede="Every podcast, panel and press conversation in flight — and what we pitched them."
      status={typeof params.status === "string" ? params.status : null}
      q={typeof params.q === "string" ? params.q.trim() : ""}
    />
  );
}
