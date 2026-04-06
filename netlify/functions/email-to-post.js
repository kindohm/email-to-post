const sharp = require("sharp");
const slugify = require("slugify");
const crypto = require("crypto");

exports.handler = async (event) => {
  try {
    console.log("HANDLER");
    if (event.httpMethod !== "POST") {
      console.warn("METHOD NOT ALLOWED", event.httpMethod);
      return json(405, { error: "Method not allowed" });
    }

    const secret = process.env.INBOUND_SECRET;
    const allowedFrom = (process.env.ALLOWED_FROM || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER;
    const githubRepo = process.env.GITHUB_REPO;
    const githubBranch = process.env.GITHUB_BRANCH || "main";

    // const imageDir = process.env.BLOG_IMAGE_DIR || "src/img/uploads";
    const postsDir = process.env.BLOG_POST_DIR || "posts";
    const imageWidth = Number(process.env.IMAGE_WIDTH || 1600);

    console.log("read all secrets");

    if (!secret || !githubToken || !githubOwner || !githubRepo) {
      console.error("MISSING REQUIRED ENVIRONMENT VARIABLES");
      return json(500, { error: "Missing required environment variables" });
    }

    // Simple shared-secret guard.
    // Example webhook URL:
    // /.netlify/functions/email-to-post?secret=YOUR_SECRET
    const qs = event.queryStringParameters || {};
    if (qs.secret !== secret) {
      return json(401, { error: "Unauthorized" });
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (err) {
      return json(400, { error: "Invalid JSON body" });
    }

    console.log("got body");

    const from = extractFromEmail(body.From);
    if (allowedFrom.length > 0 && !allowedFrom.includes(from)) {
      return json(403, { error: `Sender not allowed: ${from}` });
    }

    const subject = (body.Subject || "").trim();
    const textBody = (body.TextBody || "").trim();
    const htmlBody = (body.HtmlBody || "").trim();
    const attachments = Array.isArray(body.Attachments) ? body.Attachments : [];

    const imageAttachment = attachments.find((att) =>
      isSupportedImage(att.ContentType, att.Name),
    );

    if (!imageAttachment) {
      return json(400, { error: "No supported image attachment found" });
    }

    if (!imageAttachment.Content) {
      return json(400, { error: "Attachment content missing" });
    }

    const originalBuffer = Buffer.from(imageAttachment.Content, "base64");

    const resized = await sharp(originalBuffer)
      .rotate()
      .resize({
        width: imageWidth,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 82,
        mozjpeg: true,
      })
      .toBuffer();

    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");

    const titleBase =
      subject || stripExtension(imageAttachment.Name) || "Photo Post";
    // const slug = uniqueSlug(titleBase, now);
    const slug = `${yyyy}-${mm}-${dd}-${titleBase}`;

    const imageFilename = `${titleBase}.jpg`;
    // const imageRepoPath = `${imageDir}/${yyyy}/${mm}/${imageFilename}`;
    const postRepoPath = `${postsDir}/${slug}/index.md`;
    const imageRepoPath = `${postsDir}/${slug}/${imageFilename}`;

    const alt = subject || "Image";
    const caption = firstNonEmpty(textBody, stripHtml(htmlBody), "");
    const imageWebPath = `/${imageRepoPath.replace(/^src\//, "")}`;

    const postMarkdown = buildMarkdown({
      title: titleBase,
      date: now.toISOString(),
      imagePath: imageWebPath,
      alt,
      caption,
      from,
    });

    console.log("created post markdown");

    await createGithubFile({
      owner: githubOwner,
      repo: githubRepo,
      branch: githubBranch,
      path: imageRepoPath,
      contentBuffer: resized,
      message: `Add image ${imageFilename} from email`,
      token: githubToken,
    });

    await createGithubFile({
      owner: githubOwner,
      repo: githubRepo,
      branch: githubBranch,
      path: postRepoPath,
      contentBuffer: Buffer.from(postMarkdown, "utf8"),
      message: `Add post ${postRepoPath.split("/").pop()} from email`,
      token: githubToken,
    });

    return json(200, {
      ok: true,
      from,
      subject,
      imageRepoPath,
      postRepoPath,
    });
  } catch (err) {
    console.log("error?");
    console.error(err);
    return json(500, {
      error: "Unhandled error",
      message: err.message,
    });
  }
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data, null, 2),
  };
}

function extractFromEmail(fromField) {
  if (!fromField) return "";
  const match = fromField.match(/<([^>]+)>/);
  return (match ? match[1] : fromField).trim().toLowerCase();
}

function isSupportedImage(contentType = "", filename = "") {
  const ct = contentType.toLowerCase();
  const name = filename.toLowerCase();

  return (
    ct === "image/jpeg" ||
    ct === "image/jpg" ||
    ct === "image/png" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png")
  );
}

function stripExtension(name = "") {
  return name.replace(/\.[^.]+$/, "");
}

function stripHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstNonEmpty(...values) {
  return values.find((v) => typeof v === "string" && v.trim()) || "";
}

function uniqueSlug(title, now) {
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
}

function buildMarkdown({ title, date, imagePath, alt, caption, from }) {
  const escapedTitle = yamlEscape(title);
  const escapedAlt = yamlEscape(alt);
  const escapedFrom = yamlEscape(from);

  let md = `---
title: "${escapedTitle}"
draft: true
---

![${escapeMarkdown(alt)}](${imagePath})
`;

  if (caption) {
    md += `\n${caption.trim()}\n`;
  }

  return md;
}

function yamlEscape(str = "") {
  return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeMarkdown(str = "") {
  return String(str).replace(/[[\]\\*_`]/g, "\\$&");
}

async function createGithubFile({
  owner,
  repo,
  branch,
  path,
  contentBuffer,
  message,
  token,
}) {
  console.log("creating file in github at path:", path);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path,
  ).replace(/%2F/g, "/")}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "netlify-email-to-post",
    },
    body: JSON.stringify({
      message,
      branch,
      content: contentBuffer.toString("base64"),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  return res.json();
}
