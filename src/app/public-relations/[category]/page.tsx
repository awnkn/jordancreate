import { notFound } from "next/navigation";
import { GUEST_CATEGORY, GUEST_CATEGORY_SLUGS, categorySlug } from "@/lib/taxonomy";
import { GuestList } from "../guest-list";

export const dynamic = "force-dynamic";

/** One page per guest category: /public-relations/executives, /…/government, … */
export function generateStaticParams() {
  return GUEST_CATEGORY.values.map((c) => ({ category: categorySlug(c) }));
}

const LEDE: Record<string, string> = {
  "General Guests":
    "Press, podcasts and panels that don't belong to a more specific roster.",
  Executives:
    "Founders and operators — the conversations that trade on credibility rather than reach.",
  Government:
    "Public bodies, agencies and officials. Slower to book, and worth the lead time.",
  Creators:
    "Independent voices with their own audiences. Usually the fastest yes.",
  Artists: "Artists and performers, where the story is the work itself.",
  Designers: "Peers in the field — the conversations that build standing in the craft.",
};

export default async function GuestCategoryPage({
  params,
  searchParams,
}: PageProps<"/public-relations/[category]">) {
  const { category: slug } = await params;
  const category = GUEST_CATEGORY_SLUGS[slug];
  if (!category) notFound();

  const sp = await searchParams;

  return (
    <GuestList
      category={category}
      basePath={`/public-relations/${slug}`}
      title={category}
      lede={LEDE[category] ?? "Guests in this category."}
      status={typeof sp.status === "string" ? sp.status : null}
      q={typeof sp.q === "string" ? sp.q.trim() : ""}
    />
  );
}
