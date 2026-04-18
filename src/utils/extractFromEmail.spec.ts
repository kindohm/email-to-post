import { extractFromEmail } from "./extractFromEmail";

describe("extractFromEmail", () => {
  it("extracts an address from a display-name field", () => {
    expect(extractFromEmail("A Person <Person@Example.com>")).toBe("person@example.com");
  });

  it("normalizes a bare address", () => {
    expect(extractFromEmail(" PERSON@EXAMPLE.COM ")).toBe("person@example.com");
  });

  it("returns an empty string for missing input", () => {
    expect(extractFromEmail()).toBe("");
  });
});
