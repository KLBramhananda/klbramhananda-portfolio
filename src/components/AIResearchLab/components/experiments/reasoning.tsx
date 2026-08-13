import { useEffect, useRef, useState } from "react";
import {
  BrainCircuit,
  Check,
  CircleDot,
  Loader2,
  Play,
  Shuffle,
  Sparkles,
  Target,
} from "lucide-react";
import { emitLabEvent } from "../../lib/lab-events";

/**
 * AI Reasoning — Experiment 01.
 *
 * Gives the visitor a business problem and animates the AI processing it:
 * parse → reasoning loop (streaming chain-of-thought) → option scoring →
 * decision & plan. Everything is deterministic, in-session mock reasoning.
 * No real models are called.
 */

type ProblemOption = { label: string; score: number };

type Problem = {
  id: string;
  title: string;
  brief: string;
  parse: string[];
  thoughts: string[];
  options: ProblemOption[];
  plan: { title: string; points: string[] };
  confidence: number;
};

const PROBLEMS: Problem[] = [
  {
    id: "price-hike",
    title: "Supplier price hike",
    brief:
      "A key supplier raised prices 12% mid-quarter. Four open purchase orders and 2,300 units in stock; monthly demand runs at 1,900 units and safety stock must stay above 1,800.",
    parse: [
      "Supplier price delta → +12.0%",
      "Open purchase orders → 4",
      "Current stock → 2,300 units",
      "Monthly demand → 1,900 units",
      "Safety stock floor → 1,800 units",
    ],
    thoughts: [
      "Goal: hold margins without risking a stockout.",
      "Coverage at current stock ≈ 1.2 months — thin if demand stays firm.",
      "Accepting +12% on remaining volume erodes margin by ≈ 3.1 points.",
      "Constraint-safe path: protect price on the largest PO, shift volume to the backup supplier.",
      "Trade-off resolves toward volume shift over absorbing a double-digit cost.",
    ],
    options: [
      { label: "Renegotiate + shift 30% volume", score: 92 },
      { label: "Switch supplier outright", score: 58 },
      { label: "Absorb the increase", score: 41 },
    ],
    plan: {
      title: "Split procurement across suppliers",
      points: [
        "Renegotiate the largest open PO with price protection",
        "Shift ~30% of volume to the backup supplier",
        "Rush delivery to hold safety stock at 1,800 units",
      ],
    },
    confidence: 94,
  },
  {
    id: "stock-pressure",
    title: "Dwindling stock",
    brief:
      "SKU-1042 sits at 620 units, below its 700-unit reorder level, while demand is climbing 30% week over week. Replenishment lead time is 14 days.",
    parse: [
      "SKU-1042 on hand → 620 units",
      "Reorder level → 700 units (breached)",
      "Demand growth → +30% per week",
      "Replenishment lead time → 14 days",
    ],
    thoughts: [
      "Stock is already below the trigger; delay makes the gap worse.",
      "At +30% weekly growth, remaining stock covers only ~2 weeks.",
      "Normal PO timing would arrive after the stockout window closes.",
      "Best fit: expedited order with the backup supplier at shorter lead time.",
      "Preserve a demand-safety buffer rather than chasing minimum stock.",
    ],
    options: [
      { label: "Expedite replenishment + reserve buffer", score: 95 },
      { label: "Wait for the normal PO cycle", score: 34 },
      { label: "Place a single large catch-up order", score: 66 },
    ],
    plan: {
      title: "Trigger expedited replenishment",
      points: [
        "Open an expedited PO with the backup supplier (7-day lead)",
        "Order enough for 30-day coverage, not bare minimum",
        "Re-flag SKU-1042 for daily review until delivery",
      ],
    },
    confidence: 96,
  },
  {
    id: "approval-backlog",
    title: "Approval backlog",
    brief:
      "Eighteen purchase orders are stuck in approval, backed up ~40 hours, while a production line is waiting on materials. POs over $25k need manager sign-off and stale approvals auto-escalate after 24 hours.",
    parse: [
      "Unapproved POs → 18",
      "Backlog depth → ~40 hours",
      "Production wait → active (materials needed)",
      "Auto-escalation threshold → 24 hours",
    ],
    thoughts: [
      "The blocker is workflow delay, not authorization risk.",
      "Nine POs have already exceeded the 24h escalation window.",
      "Mass-approving bypasses control; holding everything starves production.",
      "Prioritize by line impact, then escalate the stale remainder.",
      "Fast path: route highest-impact POs to the manager first.",
    ],
    options: [
      { label: "Escalate stale POs + prioritize by impact", score: 90 },
      { label: "Approve everything immediately", score: 33 },
      { label: "Hold until finance reviews each one", score: 27 },
    ],
    plan: {
      title: "Escalate & prioritize approvals",
      points: [
        "Surface the 9 stale POs to the procurement manager",
        "Rank remaining POs by production-line impact",
        "Auto-escalate again if any PO exceeds 24h after reassignment",
      ],
    },
    confidence: 92,
  },
  {
    id: "quality-drift",
    title: "Quality drift",
    brief:
      "Defect rate across three product lines rose 0.4 points this month; two batches are under suspicion. The escalation rule triggers when any line exceeds a 1.5% monthly defect rate.",
    parse: [
      "Defect rate increase → +0.4 points this month",
      "Product lines affected → 3",
      "Suspected batches → 2",
      "Escalation threshold → 1.5% per line",
    ],
    thoughts: [
      "A 0.4-point swing is material enough to verify containment rules.",
      "The two suspected batches should be held before more units ship.",
      "Root cause is unknown — an open containment avoids re-spreads.",
      "Threshold check: affected lines are near/above the 1.5% trigger.",
      "Act containment first, run root cause in parallel.",
    ],
    options: [
      { label: "Hold batches + run root cause", score: 88 },
      { label: "Ship and monitor defect trend", score: 29 },
      { label: "Only flag to quality team", score: 52 },
    ],
    plan: {
      title: "Contain before investigating",
      points: [
        "Place both suspected batches on hold",
        "Run root cause on the 2 highest-defect lines",
        "Re-inspect downstream inventory before release",
      ],
    },
    confidence: 90,
  },
];

const STAGES = [
  { id: "parse", label: "PROBLEM PARSE" },
  { id: "reason", label: "REASONING LOOP" },
  { id: "options", label: "OPTION SCORING" },
  { id: "plan", label: "DECISION & PLAN" },
];

type Phase = "idle" | "running" | "done";

export function ReasoningExperiment() {
  const reducedRef = useRef(false);
  const runIdRef = useRef(1);

  const [problem, setProblem] = useState<Problem | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [runId, setRunId] = useState(0);

  const running = phase === "running";

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (runId === 0 || !problem) return;
    const rs = reducedRef.current ? 0.35 : 1;
    const parseMs = Math.round(520 * rs);
    const stepMs = Math.round(760 * rs);
    const n = problem.thoughts.length;

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };

    // Reveal the parse facts, then stream the thoughts one line at a time.
    at(parseMs, () => {
      setStep(1);
      setVisible(problem.parse.length);
    });
    for (let i = 0; i < n; i += 1) {
      at(parseMs + 300 * rs + i * Math.round(280 * rs), () => {
        setVisible((v) => v + 1);
      });
    }
    // Then move through scoring, decision and completion.
    at(parseMs + 300 * rs + n * Math.round(280 * rs) + 300 * rs, () => setStep(2));
    at(parseMs + 300 * rs + n * Math.round(280 * rs) + stepMs * 1.2, () => {
      setStep(3);
      setVisible((v) => v + 1);
    });
    at(parseMs + 300 * rs + n * Math.round(280 * rs) + stepMs * 2.1, () => setStep(4));
    at(parseMs + 300 * rs + n * Math.round(280 * rs) + stepMs * 2.9, () => {
      setVisible((v) => v + 1);
      setPhase("done");
      setConfidence(problem.confidence);
      emitLabEvent({ type: "experiment:success", id: "reasoning", name: "AI Reasoning", tone: "ok" });
    });

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [runId, problem]);

  const execute = (p: Problem) => {
    if (running) return;
    setProblem(p);
    setStep(0);
    setVisible(0);
    setConfidence(0);
    setPhase("running");
    setRunId(runIdRef.current++);
    emitLabEvent({ type: "experiment:started", id: "reasoning", name: "AI Reasoning" });
  };

  const runRandom = () => {
    if (running) return;
    const pool = PROBLEMS.filter((p) => p.id !== problem?.id);
    const pick = pool[runIdRef.current % pool.length] ?? PROBLEMS[0];
    execute(pick);
  };

  const traceFlow = problem
    ? [
        ...problem.parse.map((line) => ({ text: line, kind: "fact" as const })),
        ...problem.thoughts.map((line) => ({ text: line, kind: "thought" as const })),
        { text: `Scored ${problem.options.length} candidate strategies`, kind: "meta" as const },
        { text: `Selected → ${problem.plan.title}`, kind: "select" as const },
      ]
    : [];
  const shown = traceFlow.slice(0, visible);

  const tokens = problem ? (1240 + visible * 137 + (step > 1 ? 380 : 0)) : 0;

  return (
    <div className="ai-lab-expt-exp" aria-label="AI Reasoning experiment">
      <div className="ai-lab-expt-reason-grid">
        <div className="ai-lab-expt-col">
          <div className="ai-lab-tools-composer">
            <header className="ai-lab-tools-composer__head">
              <span className="ai-lab-tools-composer__title">
                <BrainCircuit className="h-4 w-4" strokeWidth={1.75} />
                Problem console
              </span>
              <span className="ai-lab-chip ai-lab-chip--cyan">
                <span className="ai-lab-dot ai-lab-dot--cyan" />
                Local sim
              </span>
            </header>

            <div className="ai-lab-expt-presets" aria-label="Business problems">
              {PROBLEMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => execute(p)}
                  disabled={running}
                  aria-pressed={problem?.id === p.id}
                  className={`ai-lab-expt-preset${
                    problem?.id === p.id ? " is-selected" : ""
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>

            <div className="ai-lab-expt-run">
              <button
                type="button"
                onClick={runRandom}
                disabled={running}
                className="ai-lab-expt-btn ai-lab-expt-btn--ghost"
              >
                <Shuffle className="h-4 w-4" aria-hidden />
                Random problem
              </button>
              <button
                type="button"
                onClick={() => problem && execute(problem)}
                disabled={running || !problem}
                className="ai-lab-expt-btn"
              >
                {running ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Play className="h-4 w-4" aria-hidden />
                )}
                {running ? "Reasoning…" : problem ? "Run again" : "Run"}
              </button>
            </div>

            {problem && (
              <div className="ai-lab-expt-brief" key={problem.id}>
                <span className="ai-lab-expt-brief__label">Business problem</span>
                <b>{problem.title}</b>
                <p>{problem.brief}</p>
              </div>
            )}
          </div>

          <div className="ai-lab-tools-pipe">
            <header className="ai-lab-tools-pipe__head">
              <span className="ai-lab-tools-pipe__title">
                <CircleDot className="h-4 w-4" strokeWidth={1.75} />
                Reasoning pipeline
              </span>
              <span
                className={`ai-lab-tools-pipe__status ai-lab-tools-pipe__status--${phase}`}
              >
                <span
                  className={`ai-lab-dot ${
                    phase === "done"
                      ? "ai-lab-dot--green"
                      : phase === "running"
                        ? "ai-lab-dot--cyan"
                        : "ai-lab-dot--amber"
                  }`}
                />
                {phase === "done" ? "DECIDED" : phase === "running" ? "PROCESSING" : "IDLE"}
              </span>
            </header>

            <ul className="ai-lab-tools-stages">
              {STAGES.map((stage, i) => {
                const done = step > i + 1;
                const active = step === i + 1;
                return (
                  <li
                    key={stage.id}
                    className={`ai-lab-tools-stage${
                      done ? " ai-lab-tools-stage--done" : ""
                    }${active ? " ai-lab-tools-stage--active" : ""}`}
                  >
                    <span className="ai-lab-tools-stage__rail" aria-hidden>
                      <span className="ai-lab-tools-stage__dot" />
                      {i < STAGES.length - 1 && (
                        <span className="ai-lab-tools-stage__line" />
                      )}
                    </span>
                    <div className="ai-lab-tools-stage__body">
                      <span className="ai-lab-tools-stage__label">
                        <em>{String(i + 1).padStart(2, "0")}</em>
                        {stage.label}
                      </span>
                      <div className="ai-lab-tools-stage__value">
                        {stage.id === "parse" && problem && step >= 1 && (
                          <p className="ai-lab-tools-stage__text">
                            {problem.parse.length} facts extracted · constraints bound
                          </p>
                        )}
                        {stage.id === "reason" && problem && step >= 2 && (
                          <p className="ai-lab-tools-stage__text">
                            {problem.thoughts.length} reasoning steps completed
                          </p>
                        )}
                        {stage.id === "options" && problem && step >= 3 && (
                          <p className="ai-lab-tools-stage__text ai-lab-tools-stage__text--tool">
                            Best fit: {problem.options[0].label}
                            <span className="ai-lab-tools-tag">
                              {problem.options[0].score}%
                            </span>
                          </p>
                        )}
                        {stage.id === "plan" && problem && step >= 4 && (
                          <p className="ai-lab-tools-stage__text ai-lab-tools-stage__text--result">
                            {problem.plan.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="ai-lab-expt-col">
          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                Inference trace
              </span>
              <span className="ai-lab-tools-console__id">
                {problem ? `${tokens.toLocaleString()} tok` : "--"}
              </span>
            </header>

            {!problem ? (
              <p className="ai-lab-tools-empty">
                Pick a business problem to watch the AI reason through it.
              </p>
            ) : (
              <ul className="ai-lab-expt-trace" aria-live="polite">
                {shown.map((line, i) => (
                  <li
                    key={`${problem.id}-${i}`}
                    className={`ai-lab-expt-trace-line ai-lab-expt-trace-line--${line.kind}`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {line.kind === "fact" && (
                      <span className="ai-lab-expt-trace-line__tag">FACT</span>
                    )}
                    {line.kind === "meta" && (
                      <span className="ai-lab-expt-trace-line__tag">SCORE</span>
                    )}
                    {line.text}
                    {line.kind === "select" && (
                      <Check strokeWidth={3} aria-hidden />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {problem && phase === "done" && (
            <div className="ai-lab-expt-decision">
              <div className="ai-lab-expt-decision__head">
                <span className="ai-lab-expt-decision__title">
                  <Target className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Recommended plan
                </span>
                <span className="ai-lab-expt-decision__conf">
                  {confidence}% confidence
                </span>
              </div>
              <b className="ai-lab-expt-decision__name">{problem.plan.title}</b>
              <ul className="ai-lab-expt-decision__points">
                {problem.plan.points.map((point, i) => (
                  <li key={point}>
                    <span className="ai-lab-expt-decision__idx">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <div className="ai-lab-expt-decision__bar" aria-hidden>
                <span style={{ width: `${confidence}%` }} />
              </div>
            </div>
          )}

          <p className="ai-lab-tools-note">
            Simulated reasoning only — deterministic, in-session. No live models
            or company data are contacted.
          </p>
        </div>
      </div>
    </div>
  );
}
