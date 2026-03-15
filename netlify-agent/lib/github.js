const BASE = "https://api.github.com";

const OWNER = () => process.env.GITHUB_OWNER;
const REPO  = () => process.env.GITHUB_REPO;

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * Fetch a file from the repo. Returns { content (decoded), sha }.
 * Returns null if not found.
 */
export async function getFile(path) {
  const res = await fetch(
    `${BASE}/repos/${OWNER()}/${REPO()}/contents/${path}`,
    { headers: headers() }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GH getFile ${path}: ${res.status}`);
  const data = await res.json();
  return {
    content: Buffer.from(data.content, "base64").toString("utf8"),
    sha: data.sha,
  };
}

/**
 * Upsert a file — creates or updates.
 */
export async function upsertFile(path, content, message) {
  const existing = await getFile(path);
  const body = {
    message,
    content: Buffer.from(content).toString("base64"),
  };
  if (existing) body.sha = existing.sha;

  const res = await fetch(
    `${BASE}/repos/${OWNER()}/${REPO()}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`GH upsertFile ${path}: ${JSON.stringify(err)}`);
  }
  console.log(`  GH: committed ${path}`);
}

/**
 * Read package.json for a given app directory.
 * Returns parsed JSON or null.
 */
export async function getPackageJson(repoDir) {
  const file = await getFile(`${repoDir}/package.json`);
  if (!file) return null;
  return JSON.parse(file.content);
}

/**
 * Get the repo's default branch and full GitHub repo ID for Netlify linking.
 */
export async function getRepoMeta() {
  const res = await fetch(
    `${BASE}/repos/${OWNER()}/${REPO()}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`GH getRepoMeta: ${res.status}`);
  const data = await res.json();
  return { id: data.id, defaultBranch: data.default_branch, fullName: data.full_name };
}
