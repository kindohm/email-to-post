import type { Request, Response } from "express";
import { loadConfig } from "../config/env";
import { createGithubFile } from "../services/github";
import { isSupportedImage } from "../services/isSupportedImage";
import { buildMarkdown } from "../services/markdown";
import { processImageAttachment } from "../services/processImageAttachment";
import type { InboundEmailPayload } from "../types/inboundEmail";
import { datePartsUtc } from "../utils/datePartsUtc";
import { extractFromEmail } from "../utils/extractFromEmail";
import { firstNonEmpty } from "../utils/firstNonEmpty";
import { stripExtension } from "../utils/stripExtension";
import { stripHtml } from "../utils/stripHtml";
import { uniqueSlug } from "../utils/uniqueSlug";

export const emailToPostHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = loadConfig();

    if (req.query.secret !== config.inboundSecret) {
      console.error("unauthorized, invalid secret");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = req.body as InboundEmailPayload;
    const from = extractFromEmail(body.From);

    if (config.allowedFrom.length > 0 && !config.allowedFrom.includes(from)) {
      console.error("sender not allowed", from);
      res.status(403).json({ error: `Sender not allowed: ${from}` });
      return;
    }

    const subject = (body.Subject || "").trim();
    const textBody = (body.TextBody || "").trim();
    const htmlBody = (body.HtmlBody || "").trim();
    const attachments = Array.isArray(body.Attachments) ? body.Attachments : [];

    console.log("num attachments:", attachments.length);

    const imageAttachments = attachments.filter((attachment) =>
      isSupportedImage(attachment.ContentType, attachment.Name),
    );

    console.log("supported image attachments:", imageAttachments.length);

    const processedImages = await Promise.all(
      imageAttachments.map((attachment, index) =>
        processImageAttachment(attachment, index, config.imageWidth),
      ),
    );

    const now = new Date();
    const { yyyy, mm, dd } = datePartsUtc(now);
    const titleBase =
      subject ||
      (imageAttachments[0] ? stripExtension(imageAttachments[0].Name) : null) ||
      "Photo Post";
    const slug = uniqueSlug(`${yyyy}-${mm}-${dd}-${titleBase}`, now);
    const postRepoPath = `${config.postsDir}/${slug}/index.md`;
    const alt = subject || "Image";
    const text = firstNonEmpty(textBody, stripHtml(htmlBody), "");

    const postMarkdown = buildMarkdown({
      title: titleBase,
      date: now.toISOString(),
      imagePaths: processedImages.map((image) => image.filename),
      alt,
      text,
    });

    await Promise.all(
      processedImages.map(({ filename, buffer }) =>
        createGithubFile({
          owner: config.githubOwner,
          repo: config.githubRepo,
          branch: config.githubBranch,
          path: `${config.postsDir}/${slug}/${filename}`,
          contentBuffer: buffer,
          message: `Add image ${filename} from email`,
          token: config.githubToken,
        }),
      ),
    );

    await createGithubFile({
      owner: config.githubOwner,
      repo: config.githubRepo,
      branch: config.githubBranch,
      path: postRepoPath,
      contentBuffer: Buffer.from(postMarkdown, "utf8"),
      message: `Add post ${postRepoPath.split("/").pop()} from email`,
      token: config.githubToken,
    });

    res.status(200).json({
      ok: true,
      from,
      subject,
      imageCount: processedImages.length,
      postRepoPath,
    });
  } catch (err) {
    console.error("unknown error :(");
    console.error(err);

    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Missing required environment variables" ? 500 : 500;

    res.status(status).json({
      error: status === 500 ? "Unhandled error" : "Request failed",
      message,
    });
  }
};
