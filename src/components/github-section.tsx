import { SectionEyebrow } from "./about";
import {
  GitFork as Github,
  Star,
  GitFork,
  GitCommit,
  Award,
} from "lucide-react";

const repos = [
  {
    name: "s2p-matrix-core",
    desc: "Source-to-pay platform core services (FastAPI + SAP HANA).",
    lang: "Python",
    stars: 128,
    forks: 22,
  },
  {
    name: "fastays-booking",
    desc: "Event-driven booking backend (Spring Boot + Kafka).",
    lang: "Java",
    stars: 96,
    forks: 14,
  },
  {
    name: "procurement-services",
    desc: "Reusable procurement microservices toolkit.",
    lang: "Python",
    stars: 74,
    forks: 9,
  },
  {
    name: "keemeds-erpnext",
    desc: "ERPNext + Frappe custom apps for healthcare commerce.",
    lang: "Python",
    stars: 41,
    forks: 6,
  },
];

const stats = [
  { label: "Contributions (365d)", value: "1,240+" },
  { label: "Pull Requests", value: "180+" },
  { label: "Repositories", value: "36" },
  { label: "Longest streak", value: "68 days" },
];

const commits = [
  { repo: "s2p-matrix-core", msg: "feat(rfq): AI-assisted supplier scoring", when: "2d ago" },
  { repo: "keemeds-erpnext", msg: "chore: catalog compliance validators", when: "3d ago" },
  { repo: "procurement-services", msg: "refactor(contracts): idempotent status transitions", when: "5d ago" },
  { repo: "fastays-booking", msg: "perf(orders): dedupe kafka consumer keys", when: "1w ago" },
];

const certs = [
  { name: "AWS Certified", org: "Cloud Practitioner", year: "2024", accent: "from-orange-400 to-amber-500" },
  { name: "Java Certified", org: "Oracle", year: "2023", accent: "from-red-400 to-orange-500" },
  { name: "Full Stack Development", org: "Coursework", year: "2023", accent: "from-cyan-400 to-blue-500" },
  { name: "ERPNext Certification", org: "Frappe · Upcoming", year: "2026", accent: "from-emerald-400 to-teal-500", upcoming: true },
];

export function GithubSection() {
  return (
    <section id="github" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionEyebrow>Open Source</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          Open-source cadence and pinned work.
        </h2>

        {/* Profile + stats */}
        <div className="mt-12 glass-strong rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent to-blue-accent text-background font-bold">
                B
              </div>
              <div>
                <div className="font-semibold">@KLBramhananda</div>
                <div className="text-xs text-muted-foreground">
                  Public work, shipped in the open
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
          </div>

          <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4">
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="text-lg font-semibold mt-1">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-8 grid lg:grid-cols-[1.2fr_1fr] gap-6">
          {/* Pinned repos */}
          <div className="grid sm:grid-cols-2 gap-4">
            {repos.map((r) => (
              <a
                key={r.name}
                href="#github"
                className="glass-strong rounded-2xl p-5 block transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-2 text-foreground">
                  <Github className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-cyan-accent">{r.name}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground min-h-[2.5rem]">
                  {r.desc}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-cyan-accent" />
                    {r.lang}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" /> {r.stars}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="h-3.5 w-3.5" /> {r.forks}
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Latest commits */}
          <div className="glass-strong rounded-2xl p-5">
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
              Latest commits
            </h3>
            <ul className="mt-4 space-y-3">
              {commits.map((c, i) => (
                <li key={i} className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-cyan-accent">
                    <GitCommit className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground truncate">
                      {c.msg}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.repo} · {c.when}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Certifications */}
        <div id="certifications" className="mt-24 lg:mt-32">
          <SectionEyebrow>Certifications</SectionEyebrow>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
            Validated skills and what's next.
          </h2>

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
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
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
                    <span className="rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-[11px]">
                      Upcoming
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/5 text-foreground/70 px-2 py-0.5 text-[11px]">
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
