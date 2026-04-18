import { firstNonEmpty } from "./firstNonEmpty";

describe("firstNonEmpty", () => {
  it("returns the first non-empty string", () => {
    expect(firstNonEmpty("", "  ", "hello", "later")).toBe("hello");
  });

  it("returns an empty string when no values contain text", () => {
    expect(firstNonEmpty("", " ")).toBe("");
  });
});
