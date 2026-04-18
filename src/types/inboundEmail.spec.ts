import type { InboundEmailPayload } from "./inboundEmail";

describe("InboundEmailPayload", () => {
  it("documents the inbound email payload shape", () => {
    const payload: InboundEmailPayload = {
      From: "Person <person@example.com>",
      Subject: "Photo",
      TextBody: "A note",
      HtmlBody: "<p>A note</p>",
      Attachments: [
        {
          Name: "photo.jpg",
          ContentType: "image/jpeg",
          Content: "base64",
        },
      ],
    };

    expect(payload.Attachments?.[0]?.Name).toBe("photo.jpg");
  });
});
