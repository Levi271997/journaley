/**
 * A profile picture, or the initial of the name when there isn't one.
 *
 * A plain <img>, not next/image: the URL points at whatever Supabase project
 * the deployment is wired to, and the optimiser would need that host listed in
 * next.config at build time — a config edit for every new project, for a
 * picture already served small and cached by Supabase's CDN.
 */
export function Avatar({
  src,
  name,
  size = 32,
  className = "",
}: {
  src: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const shared =
    "shrink-0 rounded-full border border-line object-cover " + className;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name}'s profile picture`}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={shared}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className={`${shared} flex items-center justify-center bg-accent-soft font-medium text-accent`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
