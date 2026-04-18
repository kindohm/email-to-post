import crypto from "node:crypto";
import slugify from "slugify";

export const uniqueSlug = (title: string, now: Date): string => {
  const base = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  }).slice(0, 60);

  const timePart = [
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
    String(now.getUTCSeconds()).padStart(2, "0"),
  ].join("");

  const rand = crypto.randomBytes(3).toString("hex");
  return `${base || "photo-post"}-${timePart}-${rand}`;
};
