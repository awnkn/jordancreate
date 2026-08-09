import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getSessionPerson } from "@/lib/auth";
import { fullName } from "@/lib/format";
import { logout } from "@/app/login/actions";

/** Everything inside this group sits behind the login wall, wrapped in the
 *  sidebar shell. The proxy already checked the cookie signature; this checks
 *  the session against the database so removed logins take effect. */
export default async function OsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const person = await getSessionPerson();
  if (!person) redirect("/login");

  return (
    <div className="lg:flex lg:min-h-dvh">
      <Sidebar userName={fullName(person)} logout={logout} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
