import sharp from "sharp";
import slugify from "slugify";
import type { InboundAttachment, ProcessedImage } from "../types/inboundEmail";
import { stripExtension } from "../utils/stripExtension";

export const processImageAttachment = async (
  attachment: InboundAttachment,
  index: number,
  imageWidth: number,
): Promise<ProcessedImage> => {
  if (!attachment.Content) {
    throw new Error(`Image attachment ${attachment.Name || index + 1} is missing content`);
  }

  const originalBuffer = Buffer.from(attachment.Content, "base64");
  const resized = await sharp(originalBuffer)
    .rotate()
    .resize({ width: imageWidth, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const baseName = stripExtension(attachment.Name) || `image-${index + 1}`;
  const filename = `${slugify(baseName, { lower: true, strict: true, trim: true })}.jpg`;

  return { filename, buffer: resized };
};
