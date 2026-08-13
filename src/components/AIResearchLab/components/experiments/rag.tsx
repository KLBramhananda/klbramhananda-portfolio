import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Check,
  Database,
  Layers,
  Loader2,
  Play,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { emitLabEvent } from "../../lib/lab-events";

/**
 * RAG / Retrieval — Experiment 02.
 *
 * Visualizes a retrieval-augmented generation pipeline over a tiny synthetic
 * knowledge base:
 *   Question → Embedding → Vector Search → Retrieved Knowledge → AI Response.
 *
 * The embedding, the vector index and the scores are all simulated and
 * deterministic (keyword overlap + a stable jitter). Nothing is sent to a real
 * embedding model, vector store or LLM.
 */

type Chunk = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
};

const KNOWLEDGE: Chunk[] = [
  {
    id: "so-001",
    title: "Reorder Policy — SKU Base",
    category: "Inventory",
    tags: ["reorder", "stock", "inventory"],
    content:
      "Set reorder level to 30-day coverage: daily demand x 30, plus a two-week safety-stock buffer.",
  },
  {
    id: "po-002",
    title: "PO Approval Escalation",
    category: "Procurement",
    tags: ["approval", "po", "purchase"],
    content:
      "POs above $25k require manager sign-off. Approvals still pending after 24 hours escalate automatically.",
  },
  {
    id: "sup-003",
    title: "Supplier Risk Scoring",
    category: "Supply",
    tags: ["supplier", "risk", "delivery"],
    content:
      "Score suppliers on delivery variance, defect rate and financial health. Scores below 60 flag the supplier.",
  },
  {
    id: "inv-004",
    title: "Stockout Prevention",
    category: "Inventory",
    tags: ["stockout", "demand", "spike"],
    content:
      "When demand spikes over 30%, trigger expedited replenishment through the backup supplier with batch sizing.",
  },
  {
    id: "price-005",
    title: "Price Increase Playbook",
    category: "Procurement",
    tags: ["price", "increase", "renegotiate"],
    content:
      "Apply price-protection clauses. If an increase exceeds 10%, renegotiate and shift volume to a second source.",
  },
  {
    id: "qa-006",
    title: "Quality Escalation Rule",
    category: "Quality",
    tags: ["quality", "defect", "batch"],
    content:
      "A monthly defect rate above 1.5% on any line triggers batch hold, containment and root-cause analysis.",
  },
];

type Question = {
  id: string;
  label: string;
  query: string;
  answer: string;
};

const QUESTIONS: Question[] = [
  {
    id: "low-stock",
    label: "How do we stop inventory running low?",
    query: "How do we stop inventory from running low during a demand spike?",
    answer:
      "From the retrieved records: demand spikes above 30% trigger expedited replenishment via the backup supplier, and reorder levels should hold at 30-day coverage plus a two-week safety buffer.",
  },
  {
    id: "price-rise",
    label: "What if a supplier raises prices?",
    query: "What should we do when a supplier raises prices by more than 10%?",
    answer:
      "The playbook says to invoke price-protection clauses, renegotiate the affected PO, and shift volume to a second source whenever the increase exceeds 10%.",
  },
  {
    id: "po-approval",
    label: "How should PO approvals be routed?",
    query: "How are purchase order approvals supposed to be routed?",
    answer:
      "Purchase orders above $25k route to the procurement manager, and any approval still pending after 24 hours escalates automatically to the next level.",
  },
  {
    id: "quality-escalate",
    label: "When does quality escalate a batch?",
    query: "When does quality control escalate and hold a batch?",
    answer:
      "Quality escalation fires when a line's monthly defect rate exceeds 1.5% — triggering batch hold, containment and root-cause analysis.",
  },
];

const STAGES = [
  { id: "question", label: "QUESTION" },
  { id: "embedding", label: "EMBEDDING" },
  { id: "search", label: "VECTOR SEARCH" },
  { id: "retrieved", label: "RETRIEVED KNOWLEDGE" },
  { id: "response", label: "AI RESPONSE" },
];

type Phase = "idle" | "running" | "done";

const EMBED_DIMS = 32;

function hashJitter(id: string): number {
  return ((id.length * 7 + id.charCodeAt(0)) % 5) / 100;
}

function scoreChunk(query: string, chunk: Chunk): number {
  const q = query.toLowerCase();
  let hits = 0;
  for (const tag of chunk.tags) if (q.includes(tag)) hits += 1;
  for (const word of chunk.title.toLowerCase().split(/\W+/)) {
    if (word.length > 2 && q.includes(word)) hits += 1;
  }
  for (const word of chunk.content.toLowerCase().split(/\W+/)) {
    if (word.length > 4 && q.includes(word)) hits += 1;
  }
  const jitter = hashJitter(chunk.id);
  return Math.min(0.98, Math.max(0.4, 0.42 + hits * 0.12 + jitter));
}

function matchedTerms(query: string, chunk: Chunk): string[] {
  const q = query.toLowerCase();
  return chunk.tags.filter((tag) => q.includes(tag));
}

type ScoredChunk = { chunk: Chunk; score: number; matched: string[] };

function rank(query: string): ScoredChunk[] {
  return KNOWLEDGE.map((chunk) => ({
    chunk,
    score: scoreChunk(query, chunk),
    matched: matchedTerms(query, chunk),
  })).sort((a, b) => b.score - a.score);
}

function buildAnswer(query: string, top: ScoredChunk[]): string {
  if (top.length === 0) return "No relevant knowledge was retrieved.";
  const first = top[0];
  return `Based on ${top.length} retrieved ${top.length === 1 ? "record" : "records"} — primarily "${first.chunk.title}" (${
    first.chunk.category
  }): ${first.chunk.content}`;
}

type LogEntry = { id: number; query: string; top: string; latency: number };

export function RagExperiment() {
  const reducedRef = useRef(false);
  const runIdRef = useRef(1);
  const logIdRef = useRef(1);

  const [input, setInput] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [runId, setRunId] = useState(0);
  const [results, setResults] = useState<ScoredChunk[]>([]);
  const [answer, setAnswer] = useState("");
  const [latency, setLatency] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);

  const running = phase === "running";

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (runId === 0 || !query) return;
    const rs = reducedRef.current ? 0.35 : 1;
    const stepMs = Math.round(760 * rs);
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };

    const ranked = rank(query);
    const resolved = buildAnswer(query, ranked);

    at(stepMs, () => setStep(1));
    at(stepMs * 2, () => setStep(2));
    at(stepMs * 3, () => {
      setResults(ranked);
      setStep(3);
    });
    at(stepMs * 4, () => {
      setAnswer(resolved);
      setStep(4);
    });
    at(stepMs * 4 + Math.round(420 * rs), () => {
      const newLatency = 18 + (runId % 23) * 3 + (query.length % 11);
      setPhase("done");
      setLatency(newLatency);
      setLog((prev) =>
        [
          {
            id: logIdRef.current++,
            query,
            top: ranked[0]?.chunk.title ?? "—",
            latency: newLatency,
          },
          ...prev,
        ].slice(0, 5),
      );
      emitLabEvent({ type: "experiment:success", id: "rag", name: "RAG / Retrieval", tone: "ok" });
    });

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [runId, query]);

  const execute = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || running) return;
    setInput(text);
    setQuery(text);
    setResults([]);
    setAnswer("");
    setLatency(0);
    setStep(0);
    setPhase("running");
    setRunId(runIdRef.current++);
    emitLabEvent({ type: "experiment:started", id: "rag", name: "RAG / Retrieval" });
  };

  const topResults = results.slice(0, 3);
  const scoredTotal = results.length;

  return (
    <div className="ai-lab-expt-exp" aria-label="RAG / Retrieval experiment">
      <div className="ai-lab-tools-composer ai-lab-expt-controls">
        <header className="ai-lab-tools-composer__head">
          <span className="ai-lab-tools-composer__title">
            <ScanSearch className="h-4 w-4" strokeWidth={1.75} />
            Ask the knowledge base
          </span>
          <span className="ai-lab-chip ai-lab-chip--cyan">
            <span className="ai-lab-dot ai-lab-dot--cyan" />
            Local sim
          </span>
        </header>

        <div className="ai-lab-tools-input">
          <label htmlFor="ai-expt-rag-query" className="sr-only">
            Question to retrieve against
          </label>
          <input
            id="ai-expt-rag-query"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") execute();
            }}
            placeholder='e.g. "How do we handle a supplier price rise?"'
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
            {running ? "Retrieving" : "Run"}
          </button>
        </div>

        <div className="ai-lab-tools-presets" aria-label="Example questions">
          <span className="ai-lab-tools-presets__label">Presets</span>
          <div className="ai-lab-tools-presets__list">
            {QUESTIONS.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => execute(q.query)}
                disabled={running}
                className="ai-lab-tools-preset"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ai-lab-expt-rag-grid">
        <div className="ai-lab-expt-rag-flow" role="list" aria-label="Retrieval pipeline">
          {STAGES.map((stage, i) => {
            const done = step > i;
            const active = step === i;
            const isQuestion = stage.id === "question";
            const isEmbedding = stage.id === "embedding";
            const isSearch = stage.id === "search";
            const isRetrieved = stage.id === "retrieved";
            const isResponse = stage.id === "response";

            return (
              <div key={stage.id} className="ai-lab-expt-rag-step-wrap">
                {i > 0 && (
                  <div
                    className={`ai-lab-expt-rag-connector${
                      step >= i ? " is-live" : ""
                    }`}
                    aria-hidden
                  />
                )}
                <div
                  role="listitem"
                  className={`ai-lab-expt-rag-step${
                    done ? " is-done" : active ? " is-active" : ""
                  }`}
                >
                  <div className="ai-lab-expt-rag-step__head">
                    <span
                      className={`ai-lab-expt-rag-step__num${done ? " is-done" : ""}`}
                    >
                      {done ? <Check strokeWidth={3} /> : String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="ai-lab-expt-rag-step__label">{stage.label}</span>
                    <span
                      className={`ai-lab-expt-rag-step__chip${
                        active ? " is-active" : ""
                      }`}
                    >
                      {active ? "RUNNING" : done ? "DONE" : "WAITING"}
                    </span>
                  </div>

                  <div className="ai-lab-expt-rag-step__body">
                    {isQuestion && (
                      <p className="ai-lab-expt-rag-step__text">
                        {query ?? "Awaiting a question…"}
                      </p>
                    )}

                    {isEmbedding && step >= 1 && (
                      <>
                        <p className="ai-lab-expt-rag-step__text">
                          {query
                            ? `"${query.length > 42 ? `${query.slice(0, 42)}…` : query}"`
                            : ""}{" "}
                          → 768-dim vector · normalized · 32 dims shown
                        </p>
                        <div className="ai-lab-expt-embed" aria-hidden>
                          {Array.from({ length: EMBED_DIMS }, (_, i) => (
                            <i
                              key={i}
                              className="ai-lab-expt-embed__cell"
                              style={{ "--i": i } as CSSProperties}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {isSearch && step >= 2 && (
                      <>
                        <p className="ai-lab-expt-rag-step__text">
                          Cosine similarity vs {KNOWLEDGE.length} chunks · top-k = 3
                        </p>
                        <ul className="ai-lab-expt-cands">
                          {results.map((r, i) => (
                            <li
                              key={r.chunk.id}
                              className={`ai-lab-expt-cand${i < 3 ? " is-top" : ""}`}
                              style={{ animationDelay: `${i * 50}ms` }}
                            >
                              <span className="ai-lab-expt-cand__name">
                                {r.chunk.title}
                                {i < 3 && (
                                  <span className="ai-lab-expt-cand__badge">TOP {i + 1}</span>
                                )}
                              </span>
                              <span className="ai-lab-expt-cand__bar">
                                <i style={{ width: `${Math.round(r.score * 100)}%` }} />
                              </span>
                              <span className="ai-lab-expt-cand__score">
                                {r.score.toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {isRetrieved && step >= 3 && (
                      <div className="ai-lab-expt-docs">
                        {topResults.map((r, i) => (
                          <article
                            key={r.chunk.id}
                            className="ai-lab-expt-doc"
                            style={{ animationDelay: `${i * 90}ms` }}
                          >
                            <div className="ai-lab-expt-doc__head">
                              <span className="ai-lab-expt-doc__rank">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <div className="ai-lab-expt-doc__main">
                                <b>{r.chunk.title}</b>
                                <em>
                                  {r.chunk.category} · similarity{" "}
                                  {r.score.toFixed(2)}
                                </em>
                              </div>
                            </div>
                            <p>{r.chunk.content}</p>
                            <div className="ai-lab-expt-doc__tags">
                              {r.matched.length > 0 ? (
                                r.matched.map((tag) => (
                                  <span key={tag} className="ai-lab-expt-doc__tag">
                                    <Check strokeWidth={3} />
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="ai-lab-expt-doc__tag">
                                  fuzzy match
                                </span>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}

                    {isResponse && step >= 4 && (
                      <p className="ai-lab-expt-rag-step__text ai-lab-expt-rag-step__text--answer">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        {answer || "Synthesizing answer…"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="ai-lab-expt-col ai-lab-expt-rag-side">
          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <Database className="h-3.5 w-3.5" strokeWidth={1.75} />
                Vector index
              </span>
              <span className="ai-lab-tools-console__id">
                {scoredTotal > 0 ? `${scoredTotal} scored` : "INDEX"}
              </span>
            </header>
            <dl className="ai-lab-tools-console__rows">
              <div className="ai-lab-tools-console__row">
                <dt>Chunks</dt>
                <dd>{KNOWLEDGE.length} · synthetic</dd>
              </div>
              <div className="ai-lab-tools-console__row">
                <dt>Dimensions</dt>
                <dd>768 · normalized</dd>
              </div>
              <div className="ai-lab-tools-console__row">
                <dt>Top-k</dt>
                <dd>3</dd>
              </div>
              <div className="ai-lab-tools-console__row">
                <dt>Search latency</dt>
                <dd>{latency > 0 ? `${latency}ms` : "--"}</dd>
              </div>
              <div className="ai-lab-tools-console__row ai-lab-tools-console__row--result">
                <dt>Best match</dt>
                <dd>{topResults[0]?.chunk.title ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
                Session log
              </span>
              <span className="ai-lab-tools-console__id">LOCAL</span>
            </header>
            {log.length === 0 ? (
              <p className="ai-lab-tools-empty">
                Run a query to log the retrieval path.
              </p>
            ) : (
              <ul className="ai-lab-expt-log">
                {log.map((entry) => (
                  <li key={entry.id} className="ai-lab-expt-log__item">
                    <span className="ai-lab-expt-log__top">{entry.top}</span>
                    <span className="ai-lab-expt-log__query">{entry.query}</span>
                    <span className="ai-lab-expt-log__lat">{entry.latency}ms</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="ai-lab-tools-note">
            Embeddings, index and scores are simulated — deterministic keyword
            scoring over 6 mock records. Nothing leaves the sandbox.
          </p>
        </aside>
      </div>
    </div>
  );
}
