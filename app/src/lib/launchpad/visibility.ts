import "server-only";

const raw = process.env.LAUNCH_VISIBLE_FROM?.trim();

export const LAUNCH_VISIBLE_FROM: Date | null = (() => {
  if (!raw) return null;

  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("LAUNCH_VISIBLE_FROM must be a valid ISO-8601 timestamp");
  }

  return date;
})();
