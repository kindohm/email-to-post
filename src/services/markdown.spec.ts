import { buildMarkdown } from "./markdown";

describe("buildMarkdown", () => {
  it("builds frontmatter, image markdown, and body text", () => {
    expect(
      buildMarkdown({
        title: 'A "quoted" title',
        date: "2026-04-18T00:00:00.000Z",
        imagePaths: ["photo.jpg"],
        alt: "A [photo]",
        text: "Body text",
      }),
    ).toBe(`---
title: "A \\"quoted\\" title"
date: "2026-04-18T00:00:00.000Z"
draft: false
---

![A \\[photo\\]](photo.jpg)

Body text
`);
  });
});
