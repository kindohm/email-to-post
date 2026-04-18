import { loadConfig } from "./env";

describe("loadConfig", () => {
  const baseEnv = {
    INBOUND_SECRET: "secret",
    GITHUB_TOKEN: "token",
    GITHUB_OWNER: "owner",
    GITHUB_REPO: "repo",
  };

  it("loads required and default configuration", () => {
    expect(loadConfig(baseEnv)).toEqual({
      inboundSecret: "secret",
      allowedFrom: [],
      githubToken: "token",
      githubOwner: "owner",
      githubRepo: "repo",
      githubBranch: "main",
      postsDir: "posts",
      imageWidth: 1600,
    });
  });

  it("parses optional configuration", () => {
    expect(
      loadConfig({
        ...baseEnv,
        ALLOWED_FROM: " One@Example.com, two@example.com ",
        GITHUB_BRANCH: "trunk",
        BLOG_POST_DIR: "content/posts",
        IMAGE_WIDTH: "900",
      }).allowedFrom,
    ).toEqual(["one@example.com", "two@example.com"]);
  });

  it("throws when required configuration is missing", () => {
    expect(() => loadConfig({ ...baseEnv, GITHUB_TOKEN: "" })).toThrow(
      "Missing required environment variables",
    );
  });
});
