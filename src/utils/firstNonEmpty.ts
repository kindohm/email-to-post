export const firstNonEmpty = (...values: string[]): string =>
  values.find((value) => value.trim()) || "";
