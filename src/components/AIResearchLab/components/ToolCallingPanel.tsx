import { useEffect, useRef, useState } from "react";
import {
  Braces,
  Calculator,
  Database,
  Loader2,
  Package,
  Play,
  Plug,
  Search,
  Send,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * AI Tool Calling — a controlled simulation of structured tool invocation.
 *
 * The visitor composes (or picks) a task; the lab then animates the full call
 * path — user request → AI reasoning → tool selection → selected tool →
 * API call → result → AI response — while the chosen tool card lights up.
 *
 * No real tools, databases, or endpoints are touched. Everything is a local,
 * in-session simulation with deterministic mock results.
 */

type ToolAccent = "cyan" | "blue" | "green" | "amber";

type Tool = {
  id: string;
  name: string;
  icon: LucideIcon;
  accent: ToolAccent;
  method: "GET" | "POST";
  endpoint: string;
  prompt: string;
  keywords: RegExp;
  result: string;
  response: string;
  latency: string;
};

const TOOLS: Tool[] = [
  {
    id: "search-knowledge",
    name: "Search Knowledge",
    icon: Search,
    accent: "cyan",
    method: "GET",
    endpoint: "tools/search-knowledge",
    prompt: "Search knowledge for ERP best practices.",
    keywords: /search|find|look up|knowledge|learn|explain|docs/i,
    result: "3 records matched · source-to-pay · inventory reorder · incident runbook",
    response:
      "I found 3 relevant knowledge records. Based on them: run the source-to-pay check before ordering and keep reorder levels per warehouse.",
    latency: "38ms",
  },
  {
    id: "query-database",
    name: "Query Database",
    icon: Database,
    accent: "blue",
    method: "POST",
    endpoint: "db/query",
    prompt: "Query database for open purchase orders.",
    keywords: /query|database|db|select|sql|fetch|rows/i,
    result: "2 rows returned · purchase_orders WHERE status = 'open'",
    response:
      "Query complete — 2 open purchase orders are awaiting approval. Want me to draft the approval batch?",
    latency: "64ms",
  },
  {
    id: "check-inventory",
    name: "Check Inventory",
    icon: Package,
    accent: "green",
    method: "GET",
    endpoint: "inventory/check",
    prompt: "Check inventory for low-stock products.",
    keywords: /inventory|stock|supply|warehouse|low-stock|reorder|products/i,
    result: "3 low-stock items detected · SKU-1042, SKU-1188, SKU-0933",
    response:
      "3 low-stock items detected. I recommend reordering SKU-1042, SKU-1188 and SKU-0933 to avoid stockouts.",
    latency: "21ms",
  },
  {
    id: "calculate",
    name: "Calculate",
    icon: Calculator,
    accent: "amber",
    method: "POST",
    endpoint: "compute/evaluate",
    prompt: "Calculate the total cost of approved POs.",
    keywords: /calculate|compute|sum|total|average|math|evaluate/i,
    result: "Total approved PO value = 14,250.00",
    response:
      "The calculation completed: approved purchase orders total 14,250.00 across 4 line items.",
    latency: "9ms",
  },
  {
    id: "call-api",
    name: "Call API",
    icon: Plug,
    accent: "blue",
    method: "POST",
    endpoint: "api/proxy",
    prompt: "Call the supplier API to confirm order status.",
    keywords: /api|endpoint|post|get|request|webhook|external|confirm/i,
    result: "200 OK · 12ms · { ok: true, id: 'REQ-204' }",
    response:
      "The external API call succeeded (HTTP 200). The supplier confirmed the order in 12ms.",
    latency: "12ms",
  },
];

const STAGES = [
  { id: "request", label: "USER REQUEST" },
  { id: "reason", label: "AI REASONING" },
  { id: "select", label: "TOOL SELECTION" },
  { id: "tool", label: "SELECTED TOOL" },
  { id: "api", label: "API CALL" },
  { id: "result", label: "RESULT" },
  { id: "response", label: "AI RESPONSE" },
];

const PRESETS = [
  "Check inventory for low-stock products.",
  "Search knowledge for ERP best practices.",
  "Query database for open purchase orders.",
  "Calculate the total cost of approved POs.",
  "Call the supplier API to confirm order status.",
];

function matchTool(input: string): Tool | null {
  return TOOLS.find((tool) => tool.keywords.test(input)) ?? null;
}

type Run = {
  id: number;
  request: string;
  tool: Tool;
  reasoning: string;
  selectionNote: string;
  result: string;
  response: string;
  latency: string;
};

type Phase = "idle" | "running" | "done";

export function ToolCallingPanel() {
  const reducedRef = useRef(false);
  const reqIdRef = useRef(1);
  const [input, setInput] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [runId, setRunId] = useState(0);

  const running = phase === "running";

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (runId === 0) return;
    const rs = reducedRef.current ? 0.35 : 1;
    const stepMs = Math.round(650 * rs);
    const apiMs = Math.round(950 * rs);
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };

    at(stepMs, () => setStep(1));
    at(stepMs * 2, () => setStep(2));
    at(stepMs * 3, () => setStep(3));
    at(stepMs * 4, () => setStep(4));
    at(stepMs * 4 + apiMs, () => setStep(5));
    at(stepMs * 5 + apiMs, () => setStep(6));
    at(stepMs * 5 + apiMs + stepMs, () => setPhase("done"));

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [runId]);

  const execute = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || running) return;
    const matched = matchTool(text);
    const tool = matched ?? TOOLS[0];
    const reasoning = matched
      ? `Intent matched by keywords → ${tool.name}.`
      : "No strong keyword match — defaulting to Search Knowledge.";
    setInput(text);
    setRun({
      id: reqIdRef.current++,
      request: text,
      tool,
      reasoning,
      selectionNote: matched ? "Best match" : "Fallback heuristic",
      result: tool.result,
      response: tool.response,
      latency: tool.latency,
    });
    setStep(0);
    setPhase("running");
    setRunId((n) => n + 1);
  };

  const activeToolId = run ? run.tool.id : null;
  const statusLabel = phase === "done" ? "COMPLETE" : phase === "running" ? "RUNNING" : "IDLE";

  return (
    <section
      id="ai-tool-calling"
      aria-label="AI Tool Calling — structured tool invocation"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="ai-lab-label">AI Tool Calling</h2>
        <span className="text-xs text-muted-foreground">
          Controlled simulation · no live endpoints
        </span>
      </div>

      <div className="ai-lab-tools-grid mt-5">
        <div className="ai-lab-tools-pipeline">
          <div className="ai-lab-tools-composer">
            <header className="ai-lab-tools-composer__head">
              <span className="ai-lab-tools-composer__title">
                <Braces className="h-4 w-4" strokeWidth={1.75} />
                Request composer
              </span>
              <span className="ai-lab-chip ai-lab-chip--cyan">
                <span className="ai-lab-dot ai-lab-dot--cyan" />
                Local sim
              </span>
            </header>

            <div className="ai-lab-tools-input">
              <label htmlFor="ai-tools-request" className="sr-only">
                Task to run
              </label>
              <input
                id="ai-tools-request"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") execute();
                }}
                placeholder='e.g. "Check inventory for low-stock products."'
                className="ai-lab-tools-input__field"
              />
              <button
                type="button"
                onClick={() => execute()}
                disabled={running || !input.trim()}
                className="ai-lab-tools-input__run"
              >
                {running ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Play className="h-4 w-4" aria-hidden />
                )}
                {running ? "Running" : "Run"}
              </button>
            </div>

            <div className="ai-lab-tools-presets" aria-label="Example tasks">
              <span className="ai-lab-tools-presets__label">Presets</span>
              <div className="ai-lab-tools-presets__list">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => execute(preset)}
                    disabled={running}
                    className="ai-lab-tools-preset"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="ai-lab-tools-pipe">
            <header className="ai-lab-tools-pipe__head">
              <span className="ai-lab-tools-pipe__title">
                <Workflow className="h-4 w-4" strokeWidth={1.75} />
                Execution path
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
                        {stage.id === "request" && run && (
                          <p className="ai-lab-tools-stage__text">{run.request}</p>
                        )}
                        {stage.id === "reason" && run && step >= 1 && (
                          <p className="ai-lab-tools-stage__text">{run.reasoning}</p>
                        )}
                        {stage.id === "select" && run && step >= 2 && (
                          <p className="ai-lab-tools-stage__text">
                            {run.selectionNote} · {run.tool.name}
                          </p>
                        )}
                        {stage.id === "tool" && run && step >= 3 && (
                          <p className="ai-lab-tools-stage__text ai-lab-tools-stage__text--tool">
                            {run.tool.name}
                            <span className="ai-lab-tools-tag">Active</span>
                          </p>
                        )}
                        {stage.id === "api" && run && step >= 4 && (
                          <p className="ai-lab-tools-stage__text ai-lab-tools-stage__text--api">
                            <code>
                              {run.tool.method} /{run.tool.endpoint}
                            </code>
                            <span className="ai-lab-tools-tag ai-lab-tools-tag--cyan">
                              Request sent
                            </span>
                          </p>
                        )}
                        {stage.id === "result" && run && step >= 5 && (
                          <p className="ai-lab-tools-stage__text ai-lab-tools-stage__text--result">
                            {run.result}
                          </p>
                        )}
                        {stage.id === "response" && run && step >= 6 && (
                          <p className="ai-lab-tools-stage__text ai-lab-tools-stage__text--response">
                            {run.response}
                          </p>
                        )}
                        {active && stage.id === "api" && (
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

        <aside className="ai-lab-tools-side">
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
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeToolId === tool.id;
                const dimmed = running && !isActive;
                const sent = isActive && step >= 4;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => execute(tool.prompt)}
                    disabled={running}
                    aria-label={`${tool.name} — ${
                      isActive ? (sent ? "request sent" : "active") : "idle"
                    }. Click to run an example.`}
                    className={`ai-lab-tool ai-lab-tool--${tool.accent}${
                      isActive ? " ai-lab-tool--active" : ""
                    }${dimmed ? " ai-lab-tool--dim" : ""}`}
                  >
                    <span className="ai-lab-tool__icon">
                      <Icon strokeWidth={1.75} />
                    </span>
                    <span className="ai-lab-tool__name">{tool.name}</span>
                    <span className="ai-lab-tool__badge">
                      {isActive ? (sent ? "Request sent" : "Active") : "Idle"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                Result console
              </span>
              <span className="ai-lab-tools-console__id">
                {run ? `REQ-${String(run.id).padStart(3, "0")}` : "--"}
              </span>
            </header>

            {!run ? (
              <p className="ai-lab-tools-empty">
                Run a task to see the call path and result here.
              </p>
            ) : (
              <dl className="ai-lab-tools-console__rows">
                <div className="ai-lab-tools-console__row">
                  <dt>Request</dt>
                  <dd>{run.request}</dd>
                </div>
                <div className="ai-lab-tools-console__row">
                  <dt>Tool</dt>
                  <dd>{run.tool.name}</dd>
                </div>
                <div className="ai-lab-tools-console__row">
                  <dt>API</dt>
                  <dd>
                    <code>
                      {run.tool.method} /{run.tool.endpoint}
                    </code>
                  </dd>
                </div>
                <div className="ai-lab-tools-console__row">
                  <dt>Latency</dt>
                  <dd>{run.latency}</dd>
                </div>
                <div className="ai-lab-tools-console__row ai-lab-tools-console__row--result">
                  <dt>Result</dt>
                  <dd>{phase === "done" ? run.result : "Awaiting response…"}</dd>
                </div>
              </dl>
            )}

            {phase === "done" && run && (
              <p className="ai-lab-tools-console__response">{run.response}</p>
            )}
          </div>

          <p className="ai-lab-tools-note">
            Controlled simulation — synthetic tools and mock results only. No real
            databases or production endpoints are contacted.
          </p>
        </aside>
      </div>
    </section>
  );
}