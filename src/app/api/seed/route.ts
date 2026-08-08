import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidateAll } from "@/lib/revalidate";
import { hasData, seedAll } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

/**
 * One-time demo-data loader for a freshly deployed instance.
 *
 * Disabled unless the SETUP_TOKEN env var is set; call it as
 *   /api/seed?token=<SETUP_TOKEN>
 * A database that already holds data is left alone unless &force=1 is added —
 * force wipes everything and reseeds, so it exists for demos, not for daily use.
 */
export async function GET(request: Request) {
  const expected = process.env.SETUP_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "Seeding is disabled." }, { status: 404 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("token") !== expected) {
    return NextResponse.json({ error: "Wrong token." }, { status: 403 });
  }

  if (url.searchParams.get("force") !== "1" && (await hasData(db))) {
    return NextResponse.json(
      { error: "Database already has data. Add &force=1 to wipe and reseed." },
      { status: 409 },
    );
  }

  const counts = await seedAll(db);
  revalidateAll();
  return NextResponse.json({ seeded: counts });
}
