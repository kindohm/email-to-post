import type { Request, Response } from "express";
import { loadConfig } from "../config/env";
import { createGithubFile } from "../services/github";
import { isSupportedImage } from "../services/isSupportedImage";
import { buildMarkdown } from "../services/markdown";
import { processImageAttachment } from "../services/processImageAttachment";
import { datePartsUtc } from "../utils/datePartsUtc";
import { extractFromEmail } from "../utils/extractFromEmail";
import { firstNonEmpty } from "../utils/firstNonEmpty";
import { stripExtension } from "../utils/stripExtension";
import { stripHtml } from "../utils/stripHtml";
import { uniqueSlug } from "../utils/uniqueSlug";
import { emailToPostHandler } from "./emailToPost";

jest.mock("../config/env", () => ({ loadConfig: jest.fn() }));
jest.mock("../services/github", () => ({ createGithubFile: jest.fn() }));
jest.mock("../services/isSupportedImage", () => ({ isSupportedImage: jest.fn() }));
jest.mock("../services/markdown", () => ({ buildMarkdown: jest.fn() }));
jest.mock("../services/processImageAttachment", () => ({ processImageAttachment: jest.fn() }));
jest.mock("../utils/datePartsUtc", () => ({ datePartsUtc: jest.fn() }));
jest.mock("../utils/extractFromEmail", () => ({ extractFromEmail: jest.fn() }));
jest.mock("../utils/firstNonEmpty", () => ({ firstNonEmpty: jest.fn() }));
jest.mock("../utils/stripExtension", () => ({ stripExtension: jest.fn() }));
jest.mock("../utils/stripHtml", () => ({ stripHtml: jest.fn() }));
jest.mock("../utils/uniqueSlug", () => ({ uniqueSlug: jest.fn() }));

describe("emailToPostHandler", () => {
  const config = {
    inboundSecret: "secret",
    allowedFrom: ["person@example.com"],
    githubToken: "token",
    githubOwner: "owner",
    githubRepo: "repo",
    githubBranch: "main",
    postsDir: "posts",
    imageWidth: 1600,
  };

  const createResponse = (): Response & { status: jest.Mock; json: jest.Mock } => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    } as unknown as Response & { status: jest.Mock; json: jest.Mock };

    res.status.mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-18T12:34:56.000Z"));
    jest.mocked(loadConfig).mockReturnValue(config);
    jest.mocked(extractFromEmail).mockReturnValue("person@example.com");
    jest.mocked(isSupportedImage).mockReturnValue(true);
    jest.mocked(processImageAttachment).mockResolvedValue({
      filename: "photo.jpg",
      buffer: Buffer.from("photo"),
    });
    jest.mocked(datePartsUtc).mockReturnValue({ yyyy: 2026, mm: "04", dd: "18" });
    jest.mocked(stripExtension).mockReturnValue("photo");
    jest.mocked(uniqueSlug).mockReturnValue("2026-04-18-subject-123456-abcdef");
    jest.mocked(stripHtml).mockReturnValue("Text from html");
    jest.mocked(firstNonEmpty).mockReturnValue("Text from body");
    jest.mocked(buildMarkdown).mockReturnValue("markdown");
    jest.mocked(createGithubFile).mockResolvedValue({});
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("rejects requests with an invalid secret", async () => {
    const res = createResponse();

    await emailToPostHandler(
      { query: { secret: "wrong" }, body: {} } as unknown as Request,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(createGithubFile).not.toHaveBeenCalled();
  });

  it("rejects disallowed senders", async () => {
    jest.mocked(extractFromEmail).mockReturnValue("nope@example.com");
    const res = createResponse();

    await emailToPostHandler(
      {
        query: { secret: "secret" },
        body: { From: "Nope <nope@example.com>" },
      } as unknown as Request,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Sender not allowed: nope@example.com",
    });
    expect(createGithubFile).not.toHaveBeenCalled();
  });

  it("processes supported images and creates GitHub files", async () => {
    const res = createResponse();

    await emailToPostHandler(
      {
        query: { secret: "secret" },
        body: {
          From: "Person <person@example.com>",
          Subject: "Subject",
          TextBody: "Text body",
          HtmlBody: "<p>HTML body</p>",
          Attachments: [{ Name: "photo.png", ContentType: "image/png", Content: "abc" }],
        },
      } as unknown as Request,
      res,
    );

    expect(processImageAttachment).toHaveBeenCalledWith(
      { Name: "photo.png", ContentType: "image/png", Content: "abc" },
      0,
      1600,
    );
    expect(buildMarkdown).toHaveBeenCalledWith({
      title: "Subject",
      date: "2026-04-18T12:34:56.000Z",
      imagePaths: ["photo.jpg"],
      alt: "Subject",
      text: "Text from body",
    });
    expect(createGithubFile).toHaveBeenNthCalledWith(1, {
      owner: "owner",
      repo: "repo",
      branch: "main",
      path: "posts/2026-04-18-subject-123456-abcdef/photo.jpg",
      contentBuffer: Buffer.from("photo"),
      message: "Add image photo.jpg from email",
      token: "token",
    });
    expect(createGithubFile).toHaveBeenNthCalledWith(2, {
      owner: "owner",
      repo: "repo",
      branch: "main",
      path: "posts/2026-04-18-subject-123456-abcdef/index.md",
      contentBuffer: Buffer.from("markdown", "utf8"),
      message: "Add post index.md from email",
      token: "token",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      from: "person@example.com",
      subject: "Subject",
      imageCount: 1,
      postRepoPath: "posts/2026-04-18-subject-123456-abcdef/index.md",
    });
  });

  it("returns a server error when configuration cannot load", async () => {
    jest.mocked(loadConfig).mockImplementation(() => {
      throw new Error("Missing required environment variables");
    });
    const res = createResponse();

    await emailToPostHandler(
      { query: { secret: "secret" }, body: {} } as unknown as Request,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unhandled error",
      message: "Missing required environment variables",
    });
  });
});
