import { createGithubFile } from "./github";

describe("createGithubFile", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    global.fetch = fetchMock;
  });

  it("uploads file content to the GitHub contents API", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ content: { path: "posts/post/index.md" } }),
    });

    await expect(
      createGithubFile({
        owner: "owner",
        repo: "repo",
        branch: "main",
        path: "posts/post/index.md",
        contentBuffer: Buffer.from("hello"),
        message: "Add post",
        token: "token",
      }),
    ).resolves.toEqual({ content: { path: "posts/post/index.md" } });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo/contents/posts/post/index.md",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
        body: JSON.stringify({
          message: "Add post",
          branch: "main",
          content: Buffer.from("hello").toString("base64"),
        }),
      }),
    );
  });

  it("throws with response text when GitHub rejects the request", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      text: jest.fn().mockResolvedValue("bad request"),
    });

    await expect(
      createGithubFile({
        owner: "owner",
        repo: "repo",
        branch: "main",
        path: "post.md",
        contentBuffer: Buffer.from("hello"),
        message: "Add post",
        token: "token",
      }),
    ).rejects.toThrow("GitHub API error 422: bad request");
  });
});
