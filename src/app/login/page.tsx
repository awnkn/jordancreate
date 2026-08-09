import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/form-actions";
import { getSessionPerson, noLoginsExist } from "@/lib/auth";
import { db } from "@/lib/db";
import { fullName } from "@/lib/format";
import { login, setupFirstLogin } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const from = typeof params.from === "string" ? params.from : "";

  // Already signed in? Straight through.
  if (await getSessionPerson()) redirect("/");

  const firstRun = await noLoginsExist();
  const people = firstRun
    ? await db.person.findMany({
        select: { id: true, firstName: true, lastName: true, role: true },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      })
    : [];

  return (
    <div className="flex min-h-dvh items-center justify-center bg-rail px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand asset */}
          <img
            src="/logo-full.png"
            alt="Jordan Create"
            className="mx-auto h-14 w-auto"
          />
          <p className="label mt-3 text-paper/40">Operating System</p>
        </div>

        <div className="panel p-6">
          {firstRun ? (
            <>
              <h1 className="display text-[20px] text-ink">Create the first login</h1>
              <p className="mt-1.5 text-[13px] text-ink-2">
                Nobody has access yet. Pick yourself from the team, choose a
                username and password, and you&apos;re in — then hand out
                logins from each person&apos;s profile.
              </p>
              {people.length === 0 ? (
                <p className="mt-4 rounded-sm bg-tone-warn-bg px-3 py-2 text-[13px] text-tone-warn-fg">
                  The database has no people yet. Load the demo data via
                  /api/seed, or add rows to the Person table, then reload.
                </p>
              ) : (
                <form action={setupFirstLogin} className="mt-5 space-y-4">
                  <div>
                    <label className="label mb-1.5 block">Who are you?</label>
                    <select name="personId" className="select" required>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {fullName(p)}
                          {p.role ? ` — ${p.role}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Username</label>
                    <input name="username" required autoComplete="username" className="input" placeholder="jordan" />
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="input"
                      placeholder="At least 8 characters"
                    />
                  </div>
                  {error === "setup" ? (
                    <p className="text-[13px] text-tone-danger-fg">
                      Check the fields — the password needs at least 8 characters.
                    </p>
                  ) : null}
                  <SubmitButton label="Create login & enter" pendingLabel="Setting up…" />
                </form>
              )}
            </>
          ) : (
            <>
              <h1 className="display text-[20px] text-ink">Sign in</h1>
              <form action={login} className="mt-5 space-y-4">
                <input type="hidden" name="from" value={from} />
                <div>
                  <label className="label mb-1.5 block">Username</label>
                  <input name="username" required autoComplete="username" className="input" />
                </div>
                <div>
                  <label className="label mb-1.5 block">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    autoComplete="current-password"
                    className="input"
                  />
                </div>
                {error ? (
                  <p className="text-[13px] text-tone-danger-fg">
                    That username and password don&apos;t match. Passwords are
                    reset from your profile by a teammate who can sign in.
                  </p>
                ) : null}
                <SubmitButton label="Sign in" pendingLabel="Signing in…" />
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
