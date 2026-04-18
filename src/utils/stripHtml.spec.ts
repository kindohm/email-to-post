import { stripHtml } from "./stripHtml";

describe("stripHtml", () => {
  it("removes tags and normalizes whitespace", () => {
    expect(stripHtml("<p>Hello<br> there</p>")).toBe("Hello there");
  });
});
