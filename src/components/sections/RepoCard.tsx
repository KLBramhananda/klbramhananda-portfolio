import { useState, type Ref } from "react";
import { ExternalLink, GitFork as Github, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { usePointerTilt } from "../effects/use-pointer-tilt";

export type FeaturedRepo = {
  repo: string;
  title: string;
  description: string;
  tech: string[];
  context?: string;
  ownership: "personal" | "company";
  href?: string;
};

export interface SnapshotLanguage {
  name: string;
  color: string;
  percent: number;
}

export interface SnapshotRepo {
  name: string;
  url: string;
  description: string | null;
  pushedAt: string;
  stargazerCount: number;
  isArchived: boolean;
  languages: SnapshotLanguage[];
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "3 weeks ago", from an ISO timestamp, computed at render time. */
function relativeTime(iso: string, now: number) {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "second");
}

/** Thin stacked language bar plus a legend of up to three entries. */
function Languages({ languages }: { languages: SnapshotLanguage[] }) {
  const sum = languages.reduce((n, l) => n + l.percent, 0);
  if (!languages.length || sum <= 0) return null;
  return (
    <div className="mt-4">
      <div aria-hidden className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
        {languages.map((l) => (
          <span key={l.name} style={{ width: `${(l.percent / sum) * 100}%`, backgroundColor: l.color }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.6875rem] text-muted-foreground">
        {languages.slice(0, 3).map((l) => (
          <li key={l.name} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
            {l.name} <span className="tabular-nums">{l.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A featured repository. Language bar, "Updated …", stars and the link come
 * from the build-time snapshot, and only when this repo is in its public list;
 * otherwise the card says "Private repository" and has no link. Tilts and
 * glows on fine pointers (usePointerTilt is off on touch and reduced motion).
 */
export function RepoCard({ repo: r, index, found }: { repo: FeaturedRepo; index: number; found?: SnapshotRepo }) {
  const [tiltRef, tiltStyle] = usePointerTilt<HTMLElement>(3, { local: true });
  // The clock is read once, when the card mounts (relative times need no ticking).
  const [now] = useState(() => Date.now());
  const isCompany = r.ownership === "company";
  const url = found?.url;

  const inner = (
    <>
      <span aria-hidden className="repo-glow" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Github className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-semibold text-foreground">{r.title}</span>
        </div>
        {url && <ExternalLink className="repo-card__link h-4 w-4 shrink-0 text-muted-foreground" />}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {isCompany ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[0.6875rem] font-medium text-emerald-700 dark:text-emerald-300">
            Company contribution
          </span>
        ) : (
          <span className="rounded-full border border-slate-900/10 bg-slate-900/[0.05] px-2.5 py-0.5 text-[0.6875rem] text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]">
            Personal repository
          </span>
        )}
        {!found && (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-900/10 bg-slate-900/[0.05] px-2.5 py-0.5 text-[0.6875rem] text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]">
            <Lock className="h-3 w-3" aria-hidden />
            Private repository
          </span>
        )}
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{r.description}</p>

      <div className="mt-4">
        <div className="flex flex-wrap gap-1.5">
          {r.tech.map((t) => (
            <span
              key={t}
              className="repo-card__pill rounded-full border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-1 text-[0.6875rem] text-foreground/80 dark:border-white/10 dark:bg-white/[0.03]"
            >
              {t}
            </span>
          ))}
        </div>
        {r.context && <div className="mt-3 text-xs text-muted-foreground/80">{r.context}</div>}
      </div>

      {found && (
        <>
          <Languages languages={found.languages} />
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-900/10 pt-3 text-xs text-muted-foreground dark:border-white/10">
            <span className="flex items-center gap-3">
              <span>Updated {relativeTime(found.pushedAt, now)}</span>
              {found.stargazerCount > 0 && (
                <span className="tabular-nums" aria-label={`${found.stargazerCount} stars`}>
                  ★ {found.stargazerCount}
                </span>
              )}
            </span>
            <span className="font-medium text-cyan-accent">View repo ↗</span>
          </div>
        </>
      )}
    </>
  );

  const motionProps = {
    initial: { opacity: 0, y: 13 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-32px" },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.08 * index },
  };
  const cls = "repo-card repo-tilt glass-strong relative flex flex-col rounded-2xl p-5";

  if (url) {
    return (
      <motion.a
        ref={tiltRef as Ref<HTMLAnchorElement>}
        style={tiltStyle}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        {...motionProps}
        className={cls}
      >
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.div ref={tiltRef as Ref<HTMLDivElement>} style={tiltStyle} {...motionProps} className={cls}>
      {inner}
    </motion.div>
  );
}
