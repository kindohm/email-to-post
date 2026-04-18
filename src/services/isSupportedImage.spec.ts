import { isSupportedImage } from "./isSupportedImage";

describe("isSupportedImage", () => {
  it("accepts supported image content types", () => {
    expect(isSupportedImage("image/jpeg", "anything.bin")).toBe(true);
    expect(isSupportedImage("image/png", "anything.bin")).toBe(true);
  });

  it("accepts supported image extensions", () => {
    expect(isSupportedImage("application/octet-stream", "photo.JPG")).toBe(true);
  });

  it("rejects unsupported content", () => {
    expect(isSupportedImage("application/pdf", "file.pdf")).toBe(false);
  });
});
