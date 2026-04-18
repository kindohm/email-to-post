export interface AppConfig {
  inboundSecret: string;
  allowedFrom: string[];
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  postsDir: string;
  imageWidth: number;
}

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): AppConfig => {
  const inboundSecret = env.INBOUND_SECRET;
  const githubToken = env.GITHUB_TOKEN;
  const githubOwner = env.GITHUB_OWNER;
  const githubRepo = env.GITHUB_REPO;

  if (!inboundSecret || !githubToken || !githubOwner || !githubRepo) {
    throw new Error("Missing required environment variables");
  }

  return {
    inboundSecret,
    allowedFrom: parseAllowedFrom(env.ALLOWED_FROM),
    githubToken,
    githubOwner,
    githubRepo,
    githubBranch: env.GITHUB_BRANCH || "main",
    postsDir: env.BLOG_POST_DIR || "posts",
    imageWidth: Number(env.IMAGE_WIDTH || 1600),
  };
};

const parseAllowedFrom = (value = ""): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
