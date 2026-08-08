import { revalidatePath } from "next/cache";

/**
 * Invalidate everything below the root layout after a write.
 *
 * Records here are cross-linked — a speaker shows on the event that booked
 * them, on each topic they cover and in the dashboard counts — so almost every
 * write touches more paths than the one being edited. Enumerating them was
 * error-prone and easy to forget when adding a relation.
 *
 * Invalidating at layout scope is a blunt instrument, but every page in this
 * app is `force-dynamic`, so there is no cached render being thrown away.
 */
export function revalidateAll() {
  revalidatePath("/", "layout");
}
