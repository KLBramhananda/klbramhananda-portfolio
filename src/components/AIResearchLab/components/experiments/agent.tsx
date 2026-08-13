import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  Database,
  NotebookText,
  Package,
  Search,
  Send,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { emitLabEvent } from "../../lib/lab-events";

/**
 * AI Agent — Experiment 03.
 *
 * A synthetic agent receives a business task, plans its steps, evaluates its
 * available toolkit and invokes the best-fit tool. All planning, tool results
 * and responses are deterministic mock data — no live agent runtime or tools.
 */

type ToolAccent = "cyan" | "blue" | "green" | "amber";

type AgentTool = {
  id: string;
  name: string;
  icon: LucideIcon;
  accent: ToolAccent;
  desc: string;
  method: "GET" | "POST";
  endpoint: string;
  latency: string;
};

const TOOLS: AgentTool[] = [
  {
    id: "search-knowledge",
    name: "Search Knowledge",
    icon: Search,
    accent: "cyan",
    desc: "Retrieve internal playbooks & docs",
    method: "GET",
    endpoint: "tools/search-knowledge",
    latency: "38ms",
  },
  {
    id: "query-database",
    name: "Query Database",
    icon: Database,
    accent: "blue",
    desc: "Read ERP records & workflow state",
    method: "POST",
    endpoint: "db/query",
    latency: "64ms",
  },
  {
    id: "check-inventory",
    name: "Check Inventory",
    icon: Package,
    accent: "green",
    desc: "Read current stock & reorder levels",
    method: "GET",
    endpoint: "inventory/check",
    latency: "21ms",
  },
  {
    id: "run-playbook",
    name: "Run Playbook",
    icon: NotebookText,
    accent: "amber",
    desc: "Execute a guided ops procedure",
    method: "POST",
    endpoint: "ops/run-playbook",
    latency: "112ms",
  },
  {
    id: "notify-team",
    name: "Notify Team",
    icon: Send,
    accent: "blue",
    desc: "Send a message to a team channel",
    method: "POST",
    endpoint: "notify/team",
    latency: "14ms",
  },
];

type AgentTask = {
  id: string;
  title: string;
  detail: string;
  goal: string;
  plan: string[];
  toolId: string;
  result: string;
  response: string;
};

const TASKS: AgentTask[] = [
  {
    id: "price-hike",
    title: "Negotiate the supplier price hike",
    detail: "A key supplier raised prices 12%. Four POs are open and stock is healthy.",
    goal: "Protect margins without a stockout",
    plan: [
      "Identify the largest open PO",
      "Pull supplier risk & price history",
      "Invoke the price-change playbook",
      "Notify the procurement team",
    ],
    toolId: "run-playbook",
    result: "Playbook applied · renegotiation steps queued · 30% volume shift flagged",
    response:
      "Handled — the price-change playbook is running on the largest PO, the backup-supplier volume shift is queued, and procurement has been notified.",
  },
  {
    id: "restock",
    title: "Restock SKU-1042 before it stockouts",
    detail: "SKU-1042 is at 620 units, below its 700-unit reorder level, with demand climbing.",
    goal: "Keep SKU-1042 in stock",
    plan: [
      "Check current SKU-1042 inventory",
      "Compare against reorder level & lead time",
      "Open an expedited PO via the backup supplier",
    ],
    toolId: "check-inventory",
    result: "SKU-1042 → 620 units · reorder level 700 (breached) · lead time 7d",
    response:
      "SKU-1042 is below its reorder level. I've opened an expedited PO with the backup supplier for 30-day coverage and flagged it for daily review.",
  },
  {
    id: "approval-backlog",
    title: "Clear the PO approval backlog",
    detail: "18 purchase orders are stuck in approval, ~40 hours backed up.",
    goal: "Unblock the approval queue",
    plan: [
      "Query open purchase orders",
      "Group by age and total amount",
      "Escalate stale approvals to the manager",
    ],
    toolId: "query-database",
    result: "18 open POs · 9 stale (>24h) · 4 above $25k threshold",
    response:
      "Found 18 open POs — 9 have exceeded the 24-hour window and 4 sit above the $25k threshold. The stale batch is now escalated to the procurement manager.",
  },
  {
    id: "quality-review",
    title: "Prepare the quality containment review",
    detail: "Defect rate rose 0.4 points across three lines; two batches are suspected.",
    goal: "Contain defects and draft a review",
    plan: [
      "Search quality & containment playbooks",
      "List the steps for the two suspect batches",
      "Draft the review brief for the quality team",
    ],
    toolId: "search-knowledge",
    result: "Containment playbook retrieved · 2 batches flagged · review brief drafted",
    response:
      "I retrieved the containment playbook, flagged both suspected batches for hold, and drafted the review brief for the quality team.",
  },
];

const STAGES = [
  { id: "task", label: "TASK RECEIVED" },
  { id: "plan", label: "PLANNING" },
  { id: "select", label: "TOOL SELECTION" },
  { id: "call", label: "TOOL CALL" },
  { id: "result", label: "RESULT" },
  { id: "done", label: "COMPLETE" },
];

type Phase = "idle" | "running" | "done";

function statusForStep(step: number, task: AgentTask | null): string {
  if (!task) return "Awaiting a task";
  switch (step) {
    case 0:
      return "Analyzing task…";
    case 1:
      return "Building a plan…";
    case 2:
      return "Evaluating toolkit…";
    case 3:
      return `Calling ${TOOLS.find((t) => t.id === task.toolId)?.name ?? "tool"}…`;
    case 4:
      return "Reading tool result…";
    default:
      return "Task complete";
  }
}

export function AgentExperiment() {
  const reducedRef = useRef(false);
  const runIdRef = useRef(1);

  const [task, setTask] = useState<AgentTask | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [planShown, setPlanShown] = useState(0);
  const [runId, setRunId] = useState(0);

  const running = phase === "running";

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (runId === 0 || !task) return;
    const rs = reducedRef.current ? 0.35 : 1;
    const stepMs = Math.round(640 * rs);
    const apiMs = Math.round(900 * rs);
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };

    at(stepMs, () => setStep(1));
    at(stepMs + 300 * rs, () => setPlanShown(1));
    task.plan.forEach((_, i) => {
      at(stepMs + 300 * rs + (i + 1) * Math.round(260 * rs), () => {
        setPlanShown(i + 2);
      });
    });
    at(stepMs * 2.2, () => setStep(2));
    at(stepMs * 3.1, () => setStep(3));
    at(stepMs * 3.1 + apiMs, () => setStep(4));
    at(stepMs * 4.2 + apiMs, () => setStep(5));
    at(stepMs * 4.8 + apiMs, () => {
      setPhase("done");
      emitLabEvent({ type: "experiment:success", id: "agent", name: "AI Agent", tone: "ok" });
    });

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [runId, task]);

  const execute = (t: AgentTask) => {
    if (running) return;
    setTask(t);
    setStep(0);
    setPlanShown(0);
    setPhase("running");
    setRunId(runIdRef.current++);
    emitLabEvent({ type: "experiment:started", id: "agent", name: "AI Agent" });
  };

  const tool = task ? TOOLS.find((t) => t.id === task.toolId) ?? null : null;
  const statusLabel = phase === "done" ? "COMPLETE" : phase === "running" ? "RUNNING" : "IDLE";

  return (
    <div className="ai-lab-expt-exp" aria-label="AI Agent experiment">
      <div className="ai-lab-expt-agent-grid">
        <div className="ai-lab-expt-col">
          <div className="ai-lab-tools-composer">
            <header className="ai-lab-tools-composer__head">
              <span className="ai-lab-tools-composer__title">
                <Bot className="h-4 w-4" strokeWidth={1.75} />
                Agent runtime
              </span>
              <span className="ai-lab-chip ai-lab-chip--cyan">
                <span className="ai-lab-dot ai-lab-dot--cyan" />
                Local sim
              </span>
            </header>

            <div className="ai-lab-expt-agent">
              <span className="ai-lab-expt-agent__avatar">
                <Bot strokeWidth={1.5} />
              </span>
              <div className="ai-lab-expt-agent__main">
                <b>Ops Agent · v0.1</b>
                <span className="ai-lab-expt-agent__status">
                  <span
                    className={`ai-lab-dot ${
                      phase === "done"
                        ? "ai-lab-dot--green"
                        : phase === "running"
                          ? "ai-lab-dot--cyan"
                          : "ai-lab-dot--amber"
                    }`}
                  />
                  {statusForStep(step, task)}
                </span>
                {task && (
                  <span className="ai-lab-expt-agent__goal">
                    Goal: {task.goal}
                  </span>
                )}
              </div>
            </div>

            <div className="ai-lab-expt-presets" aria-label="Agent tasks">
              {TASKS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => execute(t)}
                  disabled={running}
                  aria-pressed={task?.id === t.id}
                  className={`ai-lab-expt-preset${
                    task?.id === t.id ? " is-selected" : ""
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>

            {task && (
              <div className="ai-lab-expt-brief" key={task.id}>
                <span className="ai-lab-expt-brief__label">Incoming task</span>
                <b>{task.title}</b>
                <p>{task.detail}</p>
              </div>
            )}
          </div>

          <div className="ai-lab-tools-pipe">
            <header className="ai-lab-tools-pipe__head">
              <span className="ai-lab-tools-pipe__title">
                <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                Agent execution
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
                {statusLabel}
              </span>
            </header>

            <ul className="ai-lab-tools-stages">
              {STAGES.map((stage, i) => {
                const done = step > i;
                const active = step === i;
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
                        {stage.id === "task" && task && step >= 0 && (
                          <p className="ai-lab-tools-stage__text">{task.title}</p>
                        )}
                        {stage.id === "plan" && task && step >= 1 && (
                          <ul className="ai-lab-expt-plan">
                            {task.plan.slice(0, Math.max(1, planShown)).map((line) => (
                              <li key={line}>
                                <Check strokeWidth={3} />
                                {line}
                              </li>
                            ))}
                          </ul>
                        )}
                        {stage.id === "select" && tool && step >= 2 && (
                          <p className="ai-lab-tools-stage__text ai-lab-tools-stage__text--tool">
                            Best fit across {TOOLS.length} tools → {tool.name}
                            <span className="ai-lab-tools-tag">Selected</span>
                          </p>
                        )}
                        {stage.id === "call" && tool && step >= 3 && (
                          <p className="ai-lab-tools-stage__text ai-lab-tools-stage__text--api">
                            <code>
                              {tool.method} /{tool.endpoint}
                            </code>
                            <span className="ai-lab-tools-tag ai-lab-tools-tag--cyan">
                              Invoked
                            </span>
                          </p>
                        )}
                        {stage.id === "result" && task && step >= 4 && (
                          <p className="ai-lab-tools-stage__text ai-lab-tools-stage__text--result">
                            {task.result}
                          </p>
                        )}
                        {stage.id === "done" && task && step >= 5 && (
                          <p className="ai-lab-tools-stage__text ai-lab-tools-stage__text--response">
                            {task.response}
                          </p>
                        )}
                        {active && stage.id === "call" && (
                          <span className="ai-lab-tools-progress" aria-hidden>
                            <span />
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <aside className="ai-lab-expt-col">
          <div className="ai-lab-tools-tools">
            <header className="ai-lab-tools-tools__head">
              <span className="ai-lab-tools-tools__title">
                <Wrench className="h-4 w-4" strokeWidth={1.75} />
                Available tools
              </span>
              <span className="ai-lab-tools-tools__hint">
                {TOOLS.length} registered · simulated
              </span>
            </header>

            <div className="ai-lab-tools-list">
              {TOOLS.map((t) => {
                const Icon = t.icon;
                const isActive = tool?.id === t.id;
                const dimmed = running && !isActive;
                const invoked = isActive && step >= 3;
                return (
                  <div
                    key={t.id}
                    aria-label={`${t.name} — ${isActive ? "selected by agent" : "available"}`}
                    className={`ai-lab-tool ai-lab-tool--${t.accent}${
                      isActive ? " ai-lab-tool--active" : ""
                    }${dimmed ? " ai-lab-tool--dim" : ""}`}
                  >
                    <span className="ai-lab-tool__icon">
                      <Icon strokeWidth={1.75} />
                    </span>
                    <span className="ai-lab-tool__main">
                      <span className="ai-lab-tool__name">{t.name}</span>
                      <span className="ai-lab-expt-tool__desc">{t.desc}</span>
                    </span>
                    <span className="ai-lab-tool__badge">
                      {isActive ? (invoked ? "Invoked" : "Selected") : "Idle"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                Agent log
              </span>
              <span className="ai-lab-tools-console__id">
                {task ? task.id.toUpperCase() : "--"}
              </span>
            </header>

            {!task ? (
              <p className="ai-lab-tools-empty">
                Assign a task to watch the agent plan and call a tool.
              </p>
            ) : (
              <dl className="ai-lab-tools-console__rows">
                <div className="ai-lab-tools-console__row">
                  <dt>Task</dt>
                  <dd>{task.title}</dd>
                </div>
                <div className="ai-lab-tools-console__row">
                  <dt>Plan steps</dt>
                  <dd>{task.plan.length}</dd>
                </div>
                <div className="ai-lab-tools-console__row">
                  <dt>Tool</dt>
                  <dd>{tool?.name ?? "—"}</dd>
                </div>
                <div className="ai-lab-tools-console__row">
                  <dt>Latency</dt>
                  <dd>{tool?.latency ?? "--"}</dd>
                </div>
                <div className="ai-lab-tools-console__row ai-lab-tools-console__row--result">
                  <dt>Status</dt>
                  <dd>{phase === "done" ? "Task complete" : "In progress"}</dd>
                </div>
              </dl>
            )}

            {phase === "done" && task && (
              <p className="ai-lab-tools-console__response">{task.response}</p>
            )}
          </div>

          <p className="ai-lab-tools-note">
            Controlled simulation — the agent, its plan and every tool result are
            synthetic. No real tools or endpoints are contacted.
          </p>
        </aside>
      </div>
    </div>
  );
}
