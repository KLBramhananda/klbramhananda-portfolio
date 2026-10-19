#!/usr/bin/env node
/**
 * Refreshes src/data/github-snapshot.json from GitHub at build time (the
 * `prebuild` script). Plain Node ESM, global `fetch`, no dependencies.
 *
 *  - With GITHUB_TOKEN (a fine-grained, public read-only token): GraphQL, for
 *    the contribution calendar (last 365 days), the total since SINCE_YEAR and
 *    the public, non-fork repositories with their top languages.
 *  - Without a token (local builds): one notice, and only the repository list
 *    is refreshed through the unauthenticated REST API. The calendar and the
 *    totals are kept as they are.
 *
 * It must never break a build: any failure keeps the existing snapshot, logs
 * a warning and exits 0. The token is only read from the environment, is sent
 * only as an Authorization header to GitHub, and is never logged or written.
 *
 * GITHUB_API_URL overrides the API host. It exists so a network failure can be
 * simulated in tests; leave it unset otherwise.
 */
import { readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const LOGIN = "KLBramhananda";
const SINCE_YEAR = 2023;
const FEATURED = ["erpnext-procurement", "S2P-Matrix", "ProcureAI"];
const API = (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/+$/, "");
const TOKEN = process.env.GITHUB_TOKEN || "";
const OUT = fileURLToPath(new URL("../src/data/github-snapshot.json", import.meta.url));
const TIMEOUT_MS = 10_000;
const DAY = 86_400_000;

// Colours GitHub uses for the languages of these repositories; the REST API
// does not return colours (GraphQL does).
const LANG_COLORS = {
  Python: "#3572A5",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Java: "#b07219",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  "Jupyter Notebook": "#DA5B0B",
};

const log = (msg) => console.log(`[github] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET/POST with a 10 s timeout and one retry. Errors never include the token. */
async function request(url, init, label) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 1) throw new Error(e instanceof Error && e.message.startsWith(label) ? e.message : `${label}: ${e instanceof Error ? e.name : "request failed"}`);
      await sleep(800);
    }
  }
}

async function graphql(query, variables, label) {
  const json = await request(
    `${API}/graphql`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", "User-Agent": "portfolio-build" },
      body: JSON.stringify({ query, variables }),
    },
    label,
  );
  if (json.errors?.length) throw new Error(`${label}: GraphQL error`);
  if (!json.data) throw new Error(`${label}: empty response`);
  return json.data;
}

async function rest(path, label) {
  return request(`${API}${path}`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "portfolio-build" } }, label);
}

const round1 = (n) => Math.round(n * 10) / 10;

function languagesFromGraphQL(languages) {
  const total = languages?.totalSize ?? 0;
  return (languages?.edges ?? [])
    .filter((e) => e?.node?.name && total > 0)
    .map((e) => ({ name: e.node.name, color: e.node.color || "#8b949e", percent: round1((e.size / total) * 100) }));
}

// ── authenticated: calendar, totals, repositories ──────────────────────────
async function fetchFull() {
  const now = new Date();
  const from = new Date(now.getTime() - 364 * DAY);
  const calendarData = await graphql(
    `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`,
    { login: LOGIN, from: from.toISOString(), to: now.toISOString() },
    "calendar",
  );
  const weeks = calendarData.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
  const cutoff = from.toISOString().slice(0, 10);
  const calendar = weeks
    .flatMap((w) => w.contributionDays)
    .filter((d) => d.date >= cutoff)
    .map((d) => ({ date: d.date, count: d.contributionCount }));

  // One query per calendar year (each spans at most one year), summed.
  let totalContributions = 0;
  for (let y = SINCE_YEAR; y <= now.getUTCFullYear(); y++) {
    const to = y === now.getUTCFullYear() ? now : new Date(Date.UTC(y, 11, 31, 23, 59, 59));
    const data = await graphql(
      `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions}}}}`,
      { login: LOGIN, from: new Date(Date.UTC(y, 0, 1)).toISOString(), to: to.toISOString() },
      `contributions ${y}`,
    );
    totalContributions += data.user?.contributionsCollection?.contributionCalendar?.totalContributions ?? 0;
  }

  const repoData = await graphql(
    `query($login:String!){user(login:$login){repositories(first:100,ownerAffiliations:OWNER,privacy:PUBLIC,isFork:false,orderBy:{field:PUSHED_AT,direction:DESC}){totalCount nodes{name url description pushedAt stargazerCount isArchived languages(first:5,orderBy:{field:SIZE,direction:DESC}){totalSize edges{size node{name color}}}}}}}`,
    { login: LOGIN },
    "repositories",
  );
  const conn = repoData.user?.repositories;
  const repos = (conn?.nodes ?? []).map((n) => ({
    name: n.name,
    url: n.url,
    description: n.description ?? null,
    pushedAt: n.pushedAt,
    stargazerCount: n.stargazerCount,
    isArchived: n.isArchived,
    languages: languagesFromGraphQL(n.languages),
  }));
  return { generatedAt: now.toISOString(), totalContributions, calendar, publicRepoCount: conn?.totalCount, repos };
}

// ── unauthenticated: repositories only ─────────────────────────────────────
async function fetchReposOnly() {
  const list = await rest(`/users/${LOGIN}/repos?per_page=100&type=owner&sort=pushed`, "repositories");
  if (!Array.isArray(list)) throw new Error("repositories: unexpected response");
  const repos = [];
  for (const r of list.filter((r) => !r.fork)) {
    let languages = [];
    if (FEATURED.includes(r.name)) {
      const bytes = await rest(`/repos/${LOGIN}/${r.name}/languages`, `languages ${r.name}`);
      const total = Object.values(bytes).reduce((a, b) => a + b, 0);
      languages = Object.entries(bytes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, size]) => ({ name, color: LANG_COLORS[name] || "#8b949e", percent: round1((size / total) * 100) }));
    }
    repos.push({
      name: r.name,
      url: r.html_url,
      description: r.description ?? null,
      pushedAt: r.pushed_at,
      stargazerCount: r.stargazers_count,
      isArchived: r.archived,
      languages,
    });
  }
  return { repos };
}

// ── validation: nothing is written unless the shape is right ───────────────
const isInt = (n) => Number.isInteger(n) && n >= 0;
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isUrl = (s) => typeof s === "string" && /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(s);

function validateRepos(repos) {
  if (!Array.isArray(repos)) throw new Error("repos: not a list");
  for (const r of repos) {
    const ok =
      typeof r.name === "string" &&
      r.name &&
      isUrl(r.url) &&
      (r.description === null || typeof r.description === "string") &&
      typeof r.pushedAt === "string" &&
      !Number.isNaN(Date.parse(r.pushedAt)) &&
      isInt(r.stargazerCount) &&
      typeof r.isArchived === "boolean" &&
      Array.isArray(r.languages) &&
      r.languages.every((l) => typeof l.name === "string" && typeof l.color === "string" && typeof l.percent === "number");
    if (!ok) throw new Error(`repos: unexpected shape for "${r?.name}"`);
  }
}

function validateSnapshot(s) {
  if (s.login !== LOGIN) throw new Error("snapshot: wrong login");
  if (!isInt(s.totalContributions)) throw new Error("snapshot: totalContributions");
  if (!isInt(s.sinceYear)) throw new Error("snapshot: sinceYear");
  if (!isInt(s.publicRepoCount)) throw new Error("snapshot: publicRepoCount");
  if (!Array.isArray(s.calendar) || !s.calendar.every((d) => isDate(d.date) && isInt(d.count))) throw new Error("snapshot: calendar");
  if (s.generatedAt !== null && Number.isNaN(Date.parse(s.generatedAt))) throw new Error("snapshot: generatedAt");
  validateRepos(s.repos);
}

async function readExisting() {
  try {
    return JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const existing = await readExisting();
  const base = existing ?? {
    generatedAt: null,
    login: LOGIN,
    totalContributions: 0,
    sinceYear: SINCE_YEAR,
    calendar: [],
    publicRepoCount: 0,
    repos: [],
  };

  let next;
  let summary;
  if (TOKEN) {
    const full = await fetchFull();
    next = { ...base, ...full, login: LOGIN, sinceYear: SINCE_YEAR };
    summary = `${full.repos.length} repos, ${full.calendar.length} calendar days, ${full.totalContributions} contributions`;
  } else {
    log("GITHUB_TOKEN is not set: refreshing the repository list only (calendar and totals are kept).");
    const { repos } = await fetchReposOnly();
    next = { ...base, repos, publicRepoCount: existing ? base.publicRepoCount : repos.length };
    summary = `${repos.length} public repos`;
  }

  validateSnapshot(next);
  const text = JSON.stringify(next, null, 2) + "\n";
  if (existing && JSON.stringify(existing, null, 2) + "\n" === text) {
    log(`snapshot is already up to date (${summary})`);
    return;
  }
  const tmp = `${OUT}.tmp`;
  await writeFile(tmp, text, "utf8");
  await rename(tmp, OUT);
  log(`wrote src/data/github-snapshot.json (${summary})`);
}

try {
  await main();
} catch (e) {
  console.warn(`[github] WARNING: could not refresh the snapshot (${e instanceof Error ? e.message : "unknown error"}); keeping the existing one.`);
}
process.exit(0);
