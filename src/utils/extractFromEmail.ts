export const extractFromEmail = (fromField?: string): string => {
  if (!fromField) return "";

  const match = fromField.match(/<([^>]+)>/);
  return (match ? match[1] : fromField).trim().toLowerCase();
};
