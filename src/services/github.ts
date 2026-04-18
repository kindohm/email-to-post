export interface CreateGithubFileInput {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  contentBuffer: Buffer;
  message: string;
  token: string;
}

export const createGithubFile = async ({
  owner,
  repo,
  branch,
  path,
  contentBuffer,
  message,
  token,
}: CreateGithubFileInput): Promise<unknown> => {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path,
  ).replace(/%2F/g, "/")}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "email-to-post-server",
    },
    body: JSON.stringify({
      message,
      branch,
      content: contentBuffer.toString("base64"),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  return res.json();
};
