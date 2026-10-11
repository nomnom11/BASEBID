/**
 * The Basebid mark: brand-blue tile, white geometric "oL" — same family as
 * the old basebid "b" tile. Plain SVG: usable in server components, the OG
 * image and favicons. `tile=false` draws the letters alone (ink/brand) for
 * light backgrounds.
 */
export default function Mark({ size = 24, className = "", title = "Basebid", tile = true, color = "#FFFFFF" }: { size?: number; className?: string; title?: string; tile?: boolean; color?: string }) {
  return (
    <img src="/basebid-logo.png" width={size} height={size} className={className} alt={title} style={{ objectFit: "contain" }} />
  );
}

/** Wordmark: "Basebid" + ".lol" in brand blue. */
export function Wordmark({ className = "", size = 15 }: { className?: string; size?: number }) {
  return (
    <span className={`font-semibold tracking-tight text-ink ${className}`} style={{ fontSize: size }}>
      Basebid<span className="text-brand">.lol</span>
    </span>
  );
}
