/** Profile picture with a deterministic initials-gradient fallback. */
export function Avatar({ name, url, size = 44 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover shrink-0 border border-border"
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = (name || '?').trim()[0]?.toUpperCase() ?? '?';
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <div
      aria-hidden
      className="rounded-full grid place-items-center text-white font-display font-bold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: `linear-gradient(135deg, hsl(${hue} 68% 52%), hsl(${(hue + 45) % 360} 68% 42%))`,
      }}
    >
      {initial}
    </div>
  );
}
