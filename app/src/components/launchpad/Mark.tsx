/**
 * The BASEBID mark: a brand-blue tile with a white geometric B. Plain SVG:
 * usable in server components, the OG image and favicons. `tile=false` draws
 * the letter alone (ink/brand) for light backgrounds.
 */
export default function Mark({ size = 24, className = "", title = "BASEBID", tile = true, color = "#FFFFFF" }: { size?: number; className?: string; title?: string; tile?: boolean; color?: string }) {
  const fg = tile ? "#FFFFFF" : color;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={title}>
      {tile ? <rect width="32" height="32" rx="7" fill="#0052FF" /> : null}
      <path
        fill={fg}
        fillRule="evenodd"
        d="M8 6h10.5a6.5 6.5 0 0 1 4.82 10.86A6.5 6.5 0 0 1 18.5 26H8V6Zm5 4v5h5.5a2.5 2.5 0 0 0 0-5H13Zm0 9v3h5.5a2.5 2.5 0 0 0 0-5H13v2Z"
      />
    </svg>
  );
}

/** Wordmark: "BASEBID" + ".lol" in brand blue. */
export function Wordmark({ className = "", size = 15 }: { className?: string; size?: number }) {
  return (
    <span className={`font-semibold tracking-tight text-ink ${className}`} style={{ fontSize: size }}>
      BASEBID<span className="text-brand">.lol</span>
    </span>
  );
}
