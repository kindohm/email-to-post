import crypto from "node:crypto";
import { uniqueSlug } from "./uniqueSlug";

jest.mock("node:crypto", () => ({
  randomBytes: jest.fn(),
}));

describe("uniqueSlug", () => {
  it("slugifies title, appends UTC time, and appends random hex", () => {
    (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from("abc123", "hex"));

    expect(uniqueSlug("Hello, Photo Post!", new Date("2026-04-18T09:08:07.000Z"))).toBe(
      "hello-photo-post-090807-abc123",
    );
  });
});
