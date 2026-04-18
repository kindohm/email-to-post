export const isSupportedImage = (contentType = "", filename = ""): boolean => {
  const ct = contentType.toLowerCase();
  const name = filename.toLowerCase();

  return (
    ct === "image/jpeg" ||
    ct === "image/jpg" ||
    ct === "image/png" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png")
  );
};
