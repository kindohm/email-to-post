import { stripExtension } from "./stripExtension";

describe("stripExtension", () => {
  it("removes the final extension", () => {
    expect(stripExtension("photo.large.jpg")).toBe("photo.large");
  });

  it("leaves extensionless names alone", () => {
    expect(stripExtension("photo")).toBe("photo");
  });
});
