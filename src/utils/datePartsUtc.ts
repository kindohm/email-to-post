export const datePartsUtc = (now: Date): { yyyy: number; mm: string; dd: string } => ({
  yyyy: now.getUTCFullYear(),
  mm: String(now.getUTCMonth() + 1).padStart(2, "0"),
  dd: String(now.getUTCDate()).padStart(2, "0"),
});
