import { EventEmitter } from "node:events";
import type { Request, Response } from "express";
import { createRequest, createResponse } from "node-mocks-http";
import { createApp } from "./createApp";
import { emailToPostHandler } from "./routes/emailToPost";

jest.mock("./routes/emailToPost", () => ({
  emailToPostHandler: jest.fn((_req, res) => res.status(200).json({ ok: true })),
}));

describe("createApp", () => {
  const requestApp = async (method: "GET" | "POST", url: string, body?: Record<string, unknown>) => {
    const app = createApp() as unknown as {
      handle: (req: Request, res: Response) => void;
    };
    const req = createRequest({ method, url, body }) as unknown as Request;
    const res = createResponse({ eventEmitter: EventEmitter });

    await new Promise<void>((resolve) => {
      res.on("end", resolve);
      app.handle(req, res as unknown as Response);
    });

    return res;
  };

  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("serves a health response", async () => {
    const res = await requestApp("GET", "/health");

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ ok: true });
  });

  it("routes POST /email-to-post to the email handler", async () => {
    const res = await requestApp("POST", "/email-to-post", {});

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ ok: true });
    expect(emailToPostHandler).toHaveBeenCalled();
  });

  it("rejects unsupported methods for /email-to-post", async () => {
    const res = await requestApp("GET", "/email-to-post");

    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toEqual({ error: "Method not allowed" });
  });
});
