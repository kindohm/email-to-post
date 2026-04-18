import sharp from "sharp";
import { processImageAttachment } from "./processImageAttachment";

jest.mock("sharp", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("processImageAttachment", () => {
  const resized = Buffer.from("resized");
  const toBuffer = jest.fn();
  const jpeg = jest.fn();
  const resize = jest.fn();
  const rotate = jest.fn();

  beforeEach(() => {
    const pipeline = { rotate, resize, jpeg, toBuffer };
    rotate.mockReturnValue(pipeline);
    resize.mockReturnValue(pipeline);
    jpeg.mockReturnValue(pipeline);
    toBuffer.mockResolvedValue(resized);
    jest.mocked(sharp).mockReturnValue(pipeline as never);
  });

  it("resizes an image attachment and returns a safe jpg filename", async () => {
    const result = await processImageAttachment(
      {
        Name: "My Photo.PNG",
        Content: Buffer.from("original").toString("base64"),
      },
      0,
      800,
    );

    expect(sharp).toHaveBeenCalledWith(Buffer.from("original"));
    expect(resize).toHaveBeenCalledWith({ width: 800, withoutEnlargement: true });
    expect(jpeg).toHaveBeenCalledWith({ quality: 82, mozjpeg: true });
    expect(result).toEqual({ filename: "my-photo.jpg", buffer: resized });
  });

  it("throws when attachment content is missing", async () => {
    await expect(processImageAttachment({ Name: "photo.jpg" }, 0, 800)).rejects.toThrow(
      "Image attachment photo.jpg is missing content",
    );
  });
});
