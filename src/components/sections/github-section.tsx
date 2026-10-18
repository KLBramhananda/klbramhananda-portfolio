import { SectionEyebrow } from "./about";
import { Award } from "lucide-react";
import { Reveal } from "../effects/hero-interactions";
import { motion } from "framer-motion";
import snapshot from "@/data/github-snapshot.json";
import { ContributionSkyline } from "./ContributionSkyline";
import { RepoCard, type FeaturedRepo, type SnapshotRepo } from "./RepoCard";

const repos: FeaturedRepo[] = [
  {
    repo: "erpnext-procurement",
    title: "ERPNext Procurement",
    description:
      "ERPNext + Frappe procurement implementation for enterprise purchasing workflows and business operations.",
    tech: ["Python", "ERPNext", "Frappe"],
    context: "KeeMeds / Healthcare Commerce",
    ownership: "personal",
    href: "https://github.com/KLBramhananda/erpnext-procurement",
  },
  {
    repo: "S2P-Matrix",
    title: "S2P Matrix",
    description:
      "Source-to-pay platform focused on procurement workflows, supplier processes, APIs, and enterprise integrations.",
    tech: ["Python", "FastAPI", "SAP HANA"],
    ownership: "personal",
    href: "https://github.com/KLBramhananda/S2P-Matrix",
  },
  {
    repo: "ProcureAI",
    title: "ProcureAI",
    description:
      "AI-assisted procurement platform focused on purchase intelligence, validation, risk detection, and decision support.",
    tech: ["JavaScript", "AI"],
    ownership: "personal",
    href: "https://github.com/KLBramhananda/ProcureAI",
  },
];

const publicRepos = snapshot.repos as SnapshotRepo[];

/** A featured repo is "found" only if the snapshot's public list has it, by its link or its name. */
const findRepo = (r: FeaturedRepo) =>
  publicRepos.find(
    (p) => p.name.toLowerCase() === r.repo.toLowerCase() || (r.href && p.url.toLowerCase() === r.href.toLowerCase()),
  );

const stats = [
  { value: snapshot.totalContributions, label: `Contributions (since ${snapshot.sinceYear})` },
  { value: snapshot.publicRepoCount, label: "Public repositories" },
  { value: repos.length, label: "Featured work" },
];

const updated = snapshot.generatedAt
  ? new Date(snapshot.generatedAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })
  : null;

const certs = [
  { name: "AWS Certified", org: "Cloud Practitioner", year: "2024", accent: "from-orange-400 to-amber-500" },
  { name: "Java Certified", org: "Oracle", year: "2023", accent: "from-red-400 to-orange-500" },
  { name: "Full Stack Development", org: "Coursework", year: "2023", accent: "from-cyan-400 to-blue-500" },
  { name: "ERPNext Certification", org: "Frappe · Upcoming", year: "2026", accent: "from-emerald-400 to-teal-500", upcoming: true },
];

export function GithubSection() {
  return (
    <section id="github" className="relative py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal>
          <SectionEyebrow>GitHub</SectionEyebrow>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
            Engineering work, repositories, and contributions.
          </h2>
        </Reveal>

        {/* Profile + stats */}
        <div className="mt-12 glass-strong rounded-3xl p-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-48px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent to-blue-accent text-background font-bold">
                B
              </div>
              <div>
                <div className="font-semibold">@KLBramhananda</div>
                <div className="text-xs text-muted-foreground">
                  Selected engineering work and contributions
                </div>
              </div>
            </div>
            <a
              href="https://github.com/KLBramhananda"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-accent hover:underline"
            >
              View on GitHub →
            </a>
          </motion.div>

          <dl className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-32px" }}
                transition={{
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.08 + i * 0.07,
                }}
                className="glass rounded-2xl p-4"
              >
                <dt className="text-xs text-muted-foreground leading-snug">
                  {s.label}
                </dt>
                <dd className="text-2xl font-semibold mt-1 tabular-nums">{s.value}</dd>
              </motion.div>
            ))}
          </dl>
          {updated && <p className="mt-4 text-xs text-muted-foreground">Updated {updated}</p>}
        </div>

        {/* 3D contribution skyline: hidden entirely until the snapshot has a calendar */}
        {snapshot.calendar.length > 0 && (
          <Reveal className="mt-6">
            <ContributionSkyline calendar={snapshot.calendar} />
          </Reveal>
        )}

        {/* Featured repositories */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((r, i) => (
            <RepoCard key={r.repo} repo={r} index={i} found={findRepo(r)} />
          ))}
        </div>

        {/* Certifications */}
        <div id="certifications" className="mt-24 lg:mt-32">
          <Reveal>
            <SectionEyebrow>Certifications</SectionEyebrow>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
              Validated skills and what's next.
            </h2>
          </Reveal>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {certs.map((c) => (
              <div
                key={c.name}
                className="relative glass-strong rounded-2xl p-6 overflow-hidden"
              >
                <div
                  aria-hidden
                  className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${c.accent} opacity-25 blur-2xl`}
                />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/5 dark:bg-white/5">
                  <Award className="h-6 w-6 text-cyan-accent" />
                </div>
                <div className="relative mt-4 text-lg font-semibold">
                  {c.name}
                </div>
                <div className="relative text-sm text-muted-foreground">
                  {c.org}
                </div>
                <div className="relative mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{c.year}</span>
                  {c.upcoming ? (
                    <span className="rounded-full bg-emerald-500/15 text-emerald-700 px-2 py-0.5 text-[0.6875rem] dark:text-emerald-300">
                      Upcoming
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-900/5 text-foreground/70 px-2 py-0.5 text-[0.6875rem] dark:bg-white/5">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
