import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Check,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  Inbox,
  ListOrdered,
  Lock,
  RotateCw,
  ScrollText,
  Server,
  ShieldAlert,
  Target,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { LabModule } from "../data/modules";

type MetricId = "latency" | "errors" | "cpu" | "queue";
type ActionId = "logs" | "database" | "queue" | "backend" | "cache";
type Severity = "critical" | "elevated";
type ToneId = "cyan" | "blue" | "amber" | "rose" | "emerald";

type Metric = {
  id: MetricId;
  label: string;
  incident: string;
  restored: string;
  note: string;
  icon: LucideIcon;
  severity: Severity;
};

type Action = {
  id: ActionId;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  tone: ToneId;
};

const METRICS: Metric[] = [
  { id: "latency", label: "API Latency", incident: "2.8s", restored: "120ms", note: "p95", icon: Gauge, severity: "critical" },
  { id: "errors", label: "Error Rate", incident: "14%", restored: "0.2%", note: "last 5 min", icon: Activity, severity: "critical" },
  { id: "cpu", label: "Database CPU", incident: "92%", restored: "14%", note: "aggregate", icon: Cpu, severity: "critical" },
  { id: "queue", label: "Queue Depth", incident: "High", restored: "Normal", note: "consumers", icon: ListOrdered, severity: "elevated" },
];

const ACTIONS: Action[] = [
  { id: "logs", label: "Inspect Logs", subtitle: "Application — request traces", icon: ScrollText, tone: "cyan" },
  { id: "database", label: "Check Database", subtitle: "Postgres — query profile", icon: Database, tone: "rose" },
  { id: "queue", label: "Inspect Queue", subtitle: "Broker — depth & consumers", icon: Inbox, tone: "amber" },
  { id: "backend", label: "Check Backend", subtitle: "Replicas — CPU & saturation", icon: Server, tone: "blue" },
  { id: "cache", label: "Enable Cache", subtitle: "In-memory read path fix", icon: Zap, tone: "emerald" },
];

const FINDINGS: Record<Exclude<ActionId, "cache">, string> = {
  logs: "App logs repeat thousands of identical slow SELECT reads every second — with no application exceptions. The code itself looks healthy.",
  database: "Database CPU is pinned at 92%. Nearly every query is a repeated read of the same hot rows: the in-memory cache in front of it is never being consulted.",
  queue: "Queue depth is high, but the workers are idle and fast. The backlog is a symptom of slow request handling — not its cause.",
  backend: "Backend replicas are healthy at low CPU. Response time is dominated by waiting on database reads, not by compute.",
};

const DIAG_OPTIONS = [
  { id: "db", label: "Repeated reads overloading the database" },
  { id: "backend", label: "Backend replicas undersized / compute-bound" },
  { id: "queue", label: "Worker backlog delaying responses" },
  { id: "code", label: "Application exceptions slowing requests" },
];

const WRONG_HINTS: Record<string, string> = {
  backend:
    "Backend CPU is low and replicas are healthy — the delay comes from the layer they are waiting on. Review Check Database and Inspect Logs.",
  queue:
    "Queue workers are idle and the backlog is only a symptom. Review Inspect Queue, Check Database, and Check Backend.",
  code: "Logs show no application exceptions. Review Inspect Logs and Check Database for the real signal.",
};

const ACTION_CHIP: Record<ToneId, string> = {
  cyan: "bg-cyan-accent/15 text-cyan-accent",
  blue: "bg-blue-accent/15 text-blue-accent",
  amber: "bg-amber-400/15 text-amber-500 dark:text-amber-300",
  rose: "bg-rose-500/15 text-rose-500 dark:text-rose-400",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
};

const SEV_TILE: Record<Severity, { wrap: string; chip: string; tag: string }> = {
  critical: {
    wrap: "border-rose-500/35 bg-rose-500/[0.07]",
    chip: "bg-rose-500/15 text-rose-500 dark:text-rose-400",
    tag: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  },
  elevated: {
    wrap: "border-amber-400/35 bg-amber-400/[0.07]",
    chip: "bg-amber-400/15 text-amber-500 dark:text-amber-300",
    tag: "bg-amber-400/15 text-amber-600 dark:text-amber-300",
  },
};

const NOMINAL = {
  wrap: "border-emerald-500/35 bg-emerald-500/[0.07]",
  chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  tag: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
};

export function ProductionIncidentLab({
  module,
  onBack,
}: {
  module: LabModule;
  onBack: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const rs = reduced ? 0.4 : 1;

  const [reviewed, setReviewed] = useState<Partial<Record<ActionId, boolean>>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"correct" | "wrong" | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function review(id: ActionId) {
    if (resolved) return;
    setReviewed((prev) => ({ ...prev, [id]: true }));
  }

  function submitDiagnosis() {
    if (!picked || resolved) return;
    setVerdict(picked === "db" ? "correct" : "wrong");
  }

  function applyFix() {
    if (verdict !== "correct" || resolved || resolving) return;
    setResolving(true);
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setResolving(false);
      setResolved(true);
    }, 900 * rs);
  }

  function reset() {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    setReviewed({});
    setPicked(null);
    setVerdict(null);
    setResolving(false);
    setResolved(false);
  }

  const reviewedCount = (["logs", "database", "queue", "backend"] as ActionId[]).filter(
    (id) => reviewed[id],
  ).length;

  const wrongHint =
    verdict === "wrong" && picked
      ? `${WRONG_HINTS[picked] ?? "None of the sources point there."}${
          reviewedCount < 4 ? " Some sources are still open — inspect them all." : ""
        }`
      : "";

  return (
    <section className="mx-auto max-w-7xl pb-24 pt-8 sm:pb-32">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="animate-fade-up flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
      >
        <Link
          to="/lab"
          className="font-medium text-muted-foreground transition-colors hover:text-cyan-accent"
        >
          BK Engineering Lab
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground/85">{module.name}</span>
        <button
          type="button"
          onClick={onBack}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
          All modules
        </button>
      </nav>

      {/* Header */}
      <div className="mt-8 animate-fade-up">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-accent/25 to-blue-accent/15 text-cyan-accent shadow-[0_0_40px_-12px_rgba(6,182,212,0.6)]">
            <ShieldAlert className="h-8 w-8" strokeWidth={1.6} />
          </div>
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-900/[0.06] hover:text-foreground dark:hover:bg-white/[0.06]"
          >
            Exit Lab
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs uppercase tracking-widest text-foreground/85 dark:text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Module · Interactive
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gradient sm:text-5xl">
          {module.name}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-cyan-accent">{module.tagline}</p>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          Triage a live incident like an on-call engineer. Read the signals,
          inspect each service, name the bottleneck, then apply the fix to
          restore service.
        </p>
      </div>

      {/* Incident status */}
      <div
        className={`mt-10 rounded-3xl glass-strong p-5 sm:p-6 ${
          resolved ? "border-emerald-500/40" : "border-rose-500/40"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {resolved ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
              </span>
            ) : (
              <span className="lab-inc-alert flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
                <TriangleAlert className="h-5 w-5" strokeWidth={2} />
              </span>
            )}
            <div>
              <h2
                className={`text-base font-bold uppercase tracking-[0.18em] ${
                  resolved
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-rose-600 dark:text-rose-300"
                }`}
              >
                {resolved ? "System Restored" : "Production Incident"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {resolved
                  ? "All services nominal — cache wired into the read path."
                  : "Open incident — triage the services below."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {resolved && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <Check className="h-3 w-3" strokeWidth={3} />
                Resolved
              </span>
            )}
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-slate-900/[0.03] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-cyan-accent/30 hover:text-foreground dark:border-white/10 dark:bg-white/[0.03]"
            >
              <RotateCw className="h-4 w-4" />
              New incident
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric, i) => {
            const Icon = metric.icon;
            const healthy = resolved;
            const sev = metric.severity;
            const style = healthy ? NOMINAL : SEV_TILE[sev];
            return (
              <div
                key={metric.id}
                className={`lab-raise flex flex-col gap-3 rounded-2xl border p-4 transition-colors duration-700 ${style.wrap}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.chip}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${style.tag}`}
                  >
                    {healthy ? "Nominal" : sev === "critical" ? "Critical" : "Elevated"}
                  </span>
                </div>
                <div>
                  <div
                    className={`text-xl font-bold tabular-nums transition-colors duration-700 ${
                      healthy
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-foreground"
                    }`}
                  >
                    {healthy ? metric.restored : metric.incident}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {metric.label}
                    <span className="ml-1.5 font-mono text-[0.625rem] text-muted-foreground/60">
                      {metric.note}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        {/* Investigation deck */}
        <div className="rounded-3xl glass p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-cyan-accent" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Investigate</h2>
            <span
              className={`ml-auto text-xs tabular-nums ${
                reviewedCount === 4 ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"
              }`}
            >
              {reviewedCount} / 4 sources
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Open every source to gather evidence before you diagnose.
          </p>

          <div className="mt-4 space-y-3">
            {ACTIONS.map((action, i) => {
              const Icon = action.icon;
              const isCache = action.id === "cache";
              const isReviewed = !isCache && !!reviewed[action.id];
              const ready = verdict === "correct" && !resolved;
              const awaitingReset = resolved && !ready;
              const locked = isCache && verdict !== "correct" && !resolved;
              return (
                <div
                  key={action.id}
                  className={`lab-raise rounded-2xl border p-4 transition-all duration-300 ${
                    isCache && ready
                      ? "lab-inc-ready border-emerald-500/40 bg-emerald-500/[0.07]"
                      : "border-slate-900/10 bg-slate-900/[0.025] dark:border-white/10 dark:bg-white/[0.03]"
                  } ${awaitingReset ? "opacity-60" : ""}`}
                  style={{ animationDelay: `${i * 55}ms` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACTION_CHIP[action.tone]}`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">
                          {action.label}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {action.subtitle}
                        </p>
                      </div>
                    </div>
                    {isCache ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                          resolved
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : verdict === "correct"
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "border-slate-900/10 bg-slate-900/[0.04] text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]"
                        }`}
                      >
                        {resolved ? (
                          <>
                            <Check className="h-3 w-3" strokeWidth={3} />
                            Enabled
                          </>
                        ) : resolving ? (
                          "Applying…"
                        ) : verdict === "correct" ? (
                          "Ready"
                        ) : (
                          <>
                            <Lock className="h-3 w-3" />
                            Locked
                          </>
                        )}
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                          isReviewed
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-cyan-accent/25 bg-cyan-accent/10 text-cyan-accent"
                        }`}
                      >
                        {isReviewed ? (
                          <>
                            <Check className="h-3 w-3" strokeWidth={3} />
                            Reviewed
                          </>
                        ) : (
                          "Tap to inspect"
                        )}
                      </span>
                    )}
                  </div>

                  {isCache ? (
                    <div className="mt-4 border-t border-slate-900/8 pt-3.5 dark:border-white/8">
                      {resolved ? (
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          Cache enabled — hot reads now served from memory. Wait it out,
                          then start a fresh incident to practice again.
                        </p>
                      ) : locked ? (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Lock className="h-3.5 w-3.5 shrink-0" />
                          Locked — complete a correct diagnosis above to apply the fix.
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={applyFix}
                          disabled={resolving}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-accent px-4 py-2.5 text-sm font-semibold text-background shadow-[0_8px_28px_-10px_rgba(16,185,129,0.55)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                          {resolving ? (
                            <>
                              <RotateCw className="h-4 w-4 animate-spin" />
                              Wiring cache into the read path…
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" fill="currentColor" />
                              Enable Cache
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : isReviewed ? (
                    <div className="lab-inc-pop mt-4 border-t border-slate-900/8 pt-3.5 dark:border-white/8">
                      <span className="text-[0.625rem] font-bold uppercase tracking-widest text-cyan-accent">
                        Finding
                      </span>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                        {FINDINGS[action.id]}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => review(action.id)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-accent/25 bg-cyan-accent/10 px-4 py-2 text-sm font-semibold text-cyan-accent transition-colors hover:bg-cyan-accent/20"
                    >
                      {action.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnosis */}
        <div className="rounded-3xl glass p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-cyan-accent" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Diagnose the bottleneck</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Based on the evidence, name the likely root cause.
          </p>

          {resolved ? (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-4 text-sm">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                Correct diagnosis — bottleneck resolved
              </p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                Repeated reads were overloading the database. The cache now
                absorbs the hot reads, and latency, errors, and database CPU
                returned to nominal.
              </p>
            </div>
          ) : (
            <>
              <div role="radiogroup" aria-label="Root cause options" className="mt-4 space-y-2">
                {DIAG_OPTIONS.map((option) => {
                  const selected = picked === option.id;
                  const isCorrectAnswer = option.id === "db";
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={verdict === "correct" && !isCorrectAnswer}
                      onClick={() => setPicked(option.id)}
                      className={`group flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                        verdict === "correct" && isCorrectAnswer
                          ? "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300"
                          : selected
                            ? "border-cyan-accent/40 bg-cyan-accent/10 text-foreground"
                            : "border-slate-900/10 bg-slate-900/[0.03] text-foreground/85 hover:border-cyan-accent/25 dark:border-white/10 dark:bg-white/[0.03]"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                          selected
                            ? "border-cyan-accent"
                            : "border-slate-900/25 dark:border-white/25"
                        }`}
                      >
                        {selected && <span className="h-2 w-2 rounded-full bg-cyan-accent" />}
                      </span>
                      <span className="min-w-0">{option.label}</span>
                      {verdict === "correct" && isCorrectAnswer && (
                        <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-500" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={submitDiagnosis}
                  disabled={!picked}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-5 py-2.5 text-sm font-semibold text-background shadow-[0_8px_28px_-10px_rgba(6,182,212,0.55)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  Submit diagnosis
                </button>
                {verdict === "wrong" && (
                  <button
                    type="button"
                    onClick={() => setPicked(null)}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Re-open
                  </button>
                )}
              </div>

              {verdict === "correct" && (
                <div className="lab-inc-pop mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Correct diagnosis
                  </p>
                  <p className="mt-1 leading-relaxed text-muted-foreground">
                    The database is saturated by repeated identical reads. Enable
                    Cache next to restore service.
                  </p>
                </div>
              )}

              {verdict === "wrong" && (
                <div className="lab-inc-pop mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.08] p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-300">
                    <TriangleAlert className="h-4 w-4" />
                    Investigate further
                  </p>
                  <p className="mt-1 leading-relaxed text-muted-foreground">{wrongHint}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Restore success */}
      {resolved && (
        <div className="lab-inc-pop mt-8 relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.07] p-8 text-center sm:p-12">
          <span aria-hidden className="lab-inc-ring" />
          <span aria-hidden className="lab-inc-ring lab-inc-ring--two" />
          <div className="relative flex flex-col items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/25 to-cyan-accent/20 text-emerald-500 shadow-[0_0_40px_-12px_rgba(16,185,129,0.7)]">
              <ShieldAlert className="h-7 w-7" strokeWidth={1.7} />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-gradient sm:text-4xl">
              SYSTEM RESTORED
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              In-memory cache wired into the hot read path. API latency, error
              rate, and database CPU returned to nominal — diagnosis confirmed.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-accent px-5 py-2.5 text-sm font-semibold text-background shadow-[0_10px_40px_-12px_rgba(16,185,129,0.6)] transition-all hover:-translate-y-0.5"
            >
              <RotateCw className="h-4 w-4" />
              Run a new incident
            </button>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl glass-strong px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-slate-900/10 dark:hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lab modules
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-cyan-accent transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]"
        >
          Exit Lab
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}