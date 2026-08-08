/**
 * Speaker portrait: the photo when there is one, otherwise initials on a
 * brand-gradient disc — so a roster with missing photos still looks composed.
 */
export function Avatar({
  firstName,
  lastName,
  photoUrl,
  size = 32,
}: {
  firstName: string;
  lastName?: string | null;
  photoUrl?: string | null;
  size?: number;
}) {
  const initials = `${firstName[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  if (photoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element --
         arbitrary external hosts; next/image needs each one whitelisted */
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName ?? ""}`.trim()}
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-rule object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="bg-accent-gradient flex shrink-0 items-center justify-center rounded-full font-semibold text-[#331d04]"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34) }}
    >
      {initials}
    </span>
  );
}
