export interface MarkdownInput {
  title: string;
  date: string;
  imagePaths: string[];
  alt: string;
  text: string;
}

export const buildMarkdown = ({ title, date, imagePaths, alt, text }: MarkdownInput): string =>
  [
    "---",
    `title: "${yamlEscape(title)}"`,
    `date: "${yamlEscape(date)}"`,
    "draft: false",
    "---",
    ...imagePaths.map((imagePath) => `\n![${escapeMarkdown(alt)}](${imagePath})`),
    text ? `\n${text.trim()}` : "",
  ]
    .filter((part) => part !== "")
    .join("\n")
    .concat("\n");

const yamlEscape = (str = ""): string => String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const escapeMarkdown = (str = ""): string => String(str).replace(/[[\]\\*_`]/g, "\\$&");
