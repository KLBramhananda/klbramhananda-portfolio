import { SectionEyebrow } from "./about";
import {
  Award,
  ExternalLink,
  FolderGit2,
  GitFork as Github,
} from "lucide-react";
import { motion } from "framer-motion";

type FeaturedRepo = {
  repo: string;
  title: string;
  description: string;
  tech: string[];
  context?: string;
  ownership: "personal" | "company";
  href?: string;
};

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
  {
    repo: "fastays",
    title: "Fastays",
    description:
      "Contributed to an event-driven travel booking platform as part of the engineering team.",
    tech: ["Java", "Spring Boot", "Kafka"],
    ownership: "company",
  },
];

const stats = [
  { value: "308", label: "Contributions (2023–2026)" },
  { value: "21", label: "Repositories" },
  { value: "4", label: "Featured Work" },
];

const selectedWork = [
  {
    title: "ERPNext Procurement",
    note: "ERPNext + Frappe implementation for enterprise purchasing workflows and business operations.",
  },
  {
    title: "S2P Matrix",
    note: "Source-to-pay platform covering procurement workflows, supplier processes, and enterprise integrations.",
  },
  {
    title: "ProcureAI",
    note: "AI-assisted procurement focused on purchase intelligence, validation, and risk detection.",
  },
  {
    title: "Fastays — Company Contribution",
    note: "Event-driven travel booking platform, contributed as part of the engineering team.",
  },
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
          Engineering work, repositories, and contributions.
        </h2>

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
                <dd className="text-2xl font-semibold mt-1">{s.value}</dd>
              </motion.div>
            ))}
          </dl>
        </div>

        <div className="mt-8 grid lg:grid-cols-[1.2fr_1fr] gap-6">
          {/* Featured repositories */}
          <div className="grid sm:grid-cols-2 gap-4">
            {repos.map((r, i) => (
              <RepoCard key={r.repo} repo={r} index={i} />
            ))}
          </div>

          {/* Selected engineering work */}
          <motion.div
            initial={{ opacity: 0, y: 13 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-32px" }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.24,
            }}
            className="glass-strong rounded-2xl p-5"
          >
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
              Selected Engineering Work
            </h3>
            <ul className="mt-4 space-y-3">
              {selectedWork.map((w, i) => (
                <motion.li
                  key={w.title}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-32px" }}
                  transition={{
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.28 + i * 0.06,
                  }}
                  className="flex gap-3"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-cyan-accent">
                    <FolderGit2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {w.title}
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {w.note}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
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
                    <span className="rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-[0.6875rem]">
                      Upcoming
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/5 text-foreground/70 px-2 py-0.5 text-[0.6875rem]">
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

function RepoCard({ repo: r, index }: { repo: FeaturedRepo; index: number }) {
  const isCompany = r.ownership === "company";

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Github className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-semibold text-foreground truncate">
            {r.title}
          </span>
        </div>
        {r.href && (
          <ExternalLink className="repo-card__link h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </div>

      <div className="mt-3">
        {isCompany ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[0.6875rem] font-medium text-emerald-300">
            Company contribution
          </span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[0.6875rem] text-muted-foreground">
            Personal repository
          </span>
        )}
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {r.description}
      </p>

      <div className="mt-4">
        <div className="flex flex-wrap gap-1.5">
          {r.tech.map((t) => (
            <span
              key={t}
              className="repo-card__pill rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.6875rem] text-foreground/80"
            >
              {t}
            </span>
          ))}
        </div>
        {r.context && (
          <div className="mt-3 text-xs text-muted-foreground/80">
            {r.context}
          </div>
        )}
      </div>
    </>
  );

  const motionProps = {
    initial: { opacity: 0, y: 13 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-32px" },
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.08 * index,
    },
  };

  if (r.href) {
    return (
      <motion.a
        href={r.href}
        target="_blank"
        rel="noopener noreferrer"
        {...motionProps}
        className="repo-card glass-strong rounded-2xl p-5 flex flex-col"
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.div
      {...motionProps}
      className="repo-card glass-strong rounded-2xl p-5 flex flex-col"
    >
      {inner}
    </motion.div>
  );
}
