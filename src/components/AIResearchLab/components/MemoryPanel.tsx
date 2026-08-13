import { useCallback, useEffect, useRef, useState } from "react";
import {
  Brain,
  Check,
  Database,
  FolderKanban,
  Layers,
  Search,
  Server,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * AI Memory — a controlled local simulation of a memory system.
 *
 * The panel owns its own knowledge archive (the five domains below) but also
 * listens passively to pointer activity across the rest of the lab
 * (the AI Core module nodes and the Perception field objects). When a visitor
 * hovers any of those nodes, a visual "memory write" is shown here — without
 * touching the modules that own those nodes.
 *
 * Everything is in-session only and resets on reload. This is a UI simulation
 * of memory, not persistent production AI storage.
 */

type MemoryAccent = "cyan" | "blue" | "green" | "amber";

type KnowledgeDomain = {
  id: string;
  name: string;
  icon: LucideIcon;
  accent: MemoryAccent;
  prompt: string;
  records: string[];
  /** Keyword matcher used to classify arbitrary lab nodes into a domain. */
  keywords: RegExp;
};

const DOMAINS: KnowledgeDomain[] = [
  {
    id: "erp",
    name: "ERP",
    icon: Workflow,
    accent: "green",
    prompt: "Enterprise resources & flows",
    records: ["Procurement", "Inventory", "Purchase Order", "Supplier", "Invoice"],
    keywords: /erp|procure|supplier|purchase|inventory|invoice|rfq|source|pay/i,
  },
  {
    id: "architecture",
    name: "Architecture",
    icon: Layers,
    accent: "blue",
    prompt: "System structure & trade-offs",
    records: ["API Boundaries", "Data Model", "Queues", "Caching", "Scaling"],
    keywords: /architect|api|gateway|interface|system|design|edge/i,
  },
  {
    id: "ai",
    name: "AI",
    icon: Brain,
    accent: "cyan",
    prompt: "Reasoning, agents & models",
    records: ["Reasoning Core", "Perception", "Memory", "Agents", "Tool Calling"],
    keywords:
      /ai|agent|core|percept|memory|robot|voice|cognitive|model|experiment|chamber|sandbox|digital/i,
  },
  {
    id: "backend",
    name: "Backend",
    icon: Server,
    accent: "amber",
    prompt: "Services, APIs & data stores",
    records: ["Services", "REST APIs", "Database", "Auth", "Background Jobs"],
    keywords: /data|server|backend|service|store|deploy/i,
  },
  {
    id: "projects",
    name: "Projects",
    icon: FolderKanban,
    accent: "blue",
    prompt: "Work & experiments I build",
    records: [
      "BK Engineering Lab",
      "AI Research Lab",
      "Procurement Playground",
      "Portfolio",
      "Incident Simulator",
    ],
    keywords: /project|lab|portfolio|incident|playground/i,
  },
];

/** Node selectors across the lab that the memory system passively observes. */
const OBSERVED_SELECTOR = ".ai-lab-module-node, .ai-lab-perception-node";

const EMPTY_COUNTS: Record<string, number> = Object.fromEntries(
  DOMAINS.map((d) => [d.id, 0]),
);

type MemoryKind = "ingest" | "query";

type MemoryEvent = {
  id: number;
  kind: MemoryKind;
  domainId: string;
  node: string;
};

function labelFor(node: HTMLElement): string | null {
  const title = node.getAttribute("title");
  if (title && title.trim()) return title.trim();
  const name = node.querySelector<HTMLElement>("[class$='__name']");
  if (name) {
    const text = name.textContent?.trim();
    if (text) return text;
  }
  const text = node.textContent?.trim();
  return text && text.length > 0 ? text : null;
}

function classify(label: string): KnowledgeDomain | null {
  return DOMAINS.find((domain) => domain.keywords.test(label)) ?? null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="ai-lab-memory-row">
      <dt>{label}</dt>
      <dd key={value} className="ai-lab-memory-row__value">
        <span className="ai-lab-memory-row__dot" aria-hidden />
        {value}
      </dd>
    </div>
  );
}

function FeedItem({ event }: { event: MemoryEvent }) {
  const domain = DOMAINS.find((d) => d.id === event.domainId);
  const ingest = event.kind === "ingest";
  return (
    <li
      className={`ai-lab-memory-feed-item${
        ingest
          ? " ai-lab-memory-feed-item--ingest"
          : " ai-lab-memory-feed-item--query"
      }`}
    >
      <span className="ai-lab-memory-feed-item__head">
        <span className={`ai-lab-dot ${ingest ? "ai-lab-dot--green" : "ai-lab-dot--cyan"}`} />
        {ingest ? "NEW MEMORY" : "MEMORY QUERY"}
      </span>
      <span className="ai-lab-memory-feed-item__line">
        {ingest ? "User hovered:" : "Request:"}
      </span>
      <b className="ai-lab-memory-feed-item__node">
        {event.node}
        <span className="ai-lab-memory-feed-item__tag">{domain?.name ?? "?"}</span>
      </b>
      <span className="ai-lab-memory-feed-item__ok">
        {ingest ? "Context stored" : "Records gathered"}
        <Check strokeWidth={3} aria-hidden />
      </span>
    </li>
  );
}

export function MemoryPanel() {
  const countsRef = useRef<Record<string, number>>({ ...EMPTY_COUNTS });
  const lastObservedRef = useRef({ source: "", at: 0 });
  const timerRef = useRef<number | null>(null);
  const idRef = useRef(0);
  const reducedRef = useRef(false);

  const [stored, setStored] = useState<Record<string, number>>({ ...EMPTY_COUNTS });
  const [events, setEvents] = useState<MemoryEvent[]>([]);
  const [short, setShort] = useState({
    interaction: "Awaiting interaction",
    task: "Standby",
    context: "No context loaded",
  });
  const [retrieval, setRetrieval] = useState<{
    domain: KnowledgeDomain;
    items: string[];
    phase: "recalling" | "ready";
  } | null>(null);

  const popTotal = DOMAINS.reduce((sum, d) => sum + (stored[d.id] ?? 0), 0);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const writeMemory = useCallback(
    (domain: KnowledgeDomain, source: string, kind: MemoryKind) => {
      countsRef.current[domain.id] += 1;
      setStored({ ...countsRef.current });

      const nextEvent: MemoryEvent = {
        id: idRef.current++,
        kind,
        domainId: domain.id,
        node: source,
      };
      setEvents((prev) => [nextEvent, ...prev].slice(0, 10));

      const count = countsRef.current[domain.id];
      const label = `${count} record${count === 1 ? "" : "s"}`;
      setShort(
        kind === "ingest"
          ? {
              interaction: `Hovered ${domain.name}`,
              task: "Encoding context",
              context: `${domain.name} · ${label}`,
            }
          : {
              interaction: `Queried ${domain.name}`,
              task: "Running retrieval",
              context: `${domain.name} · ${label}`,
            },
      );
    },
    [],
  );

  // Passively watch the rest of the lab: hovering a Core or Perception node
  // feeds the reference into memory. Keyed on source + timestamp so rapid
  // re-entries of the same node (re-renders firing pointerover again) don't
  // flood the stream.
  useEffect(() => {
    const onEnter = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      const node = target.closest(OBSERVED_SELECTOR) as HTMLElement | null;
      if (!node || !node.isConnected) return;
      const label = labelFor(node);
      const domain = label ? classify(label) : null;
      if (!domain) return;
      const now = performance.now();
      if (now - lastObservedRef.current.at < 700 && lastObservedRef.current.source === label) {
        return;
      }
      lastObservedRef.current = { source: label, at: now };
      writeMemory(domain, label, "ingest");
    };
    document.addEventListener("pointerover", onEnter, true);
    return () => document.removeEventListener("pointerover", onEnter, true);
  }, [writeMemory]);

  const handleRecall = (domain: KnowledgeDomain) => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    writeMemory(domain, `${domain.name} Node`, "query");
    setRetrieval({ domain, items: [], phase: "recalling" });
    const rs = reducedRef.current ? 0.35 : 1;
    timerRef.current = window.setTimeout(() => {
      setRetrieval({ domain, items: domain.records, phase: "ready" });
    }, 540 * rs);
  };

  return (
    <section id="ai-memory" aria-label="AI Memory — short-term store and knowledge archive">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="ai-lab-label">AI Memory</h2>
        <span className="text-xs text-muted-foreground">
          Local simulation · interaction to memory
        </span>
      </div>

      <div className="ai-lab-memory-grid mt-5">
        <aside className="ai-lab-memory-bank">
          <header className="ai-lab-memory-bank__head">
            <span className="ai-lab-memory-bank__title">
              <Brain className="h-4 w-4" strokeWidth={1.75} />
              Memory bank
            </span>
            <span className="ai-lab-chip ai-lab-chip--cyan">
              <span className="ai-lab-dot ai-lab-dot--cyan" />
              Local sim
            </span>
          </header>

          <div className="ai-lab-memory-card">
            <h3 className="ai-lab-memory-card__label">
              <span className="ai-lab-code">STM</span>
              Short-term memory
            </h3>
            <dl className="ai-lab-memory-rows">
              <Row label="Current interaction" value={short.interaction} />
              <Row label="Current task" value={short.task} />
              <Row label="Current context" value={short.context} />
            </dl>
          </div>

          <div className="ai-lab-memory-card ai-lab-memory-card--feed">
            <h3 className="ai-lab-memory-card__label">
              <span className="ai-lab-code">STREAM</span>
              Incoming events
            </h3>
            {events.length === 0 ? (
              <p className="ai-lab-memory-empty">
                Hover any system node or knowledge node to write a memory…
              </p>
            ) : (
              <ul className="ai-lab-memory-feed">
                {events.map((event) => (
                  <FeedItem key={event.id} event={event} />
                ))}
              </ul>
            )}
          </div>

          <p className="ai-lab-memory-note">
            Working set: <b>{popTotal}</b> records · in-session only, cleared on reload. Not
            persistent production AI memory.
          </p>
        </aside>

        <div className="ai-lab-memory-field">
          <header className="ai-lab-memory-field__head">
            <span className="ai-lab-memory-field__title">
              <Database className="h-4 w-4" strokeWidth={1.75} />
              Knowledge archive
            </span>
            <span className="ai-lab-memory-field__hint">Hover to ingest · click to retrieve</span>
          </header>

          <div className="ai-lab-memory-nodes">
            {DOMAINS.map((domain) => {
              const Icon = domain.icon;
              const count = stored[domain.id] ?? 0;
              return (
                <button
                  key={domain.id}
                  type="button"
                  aria-label={`${domain.name} — ${count} ${count === 1 ? "record" : "records"} stored. Click to retrieve.`}
                  className={`ai-lab-memory-node ai-lab-memory-node--${domain.accent}${
                    count > 0 ? " ai-lab-memory-node--stored" : ""
                  }`}
                  onPointerEnter={() => writeMemory(domain, `${domain.name} Node`, "ingest")}
                  onClick={() => handleRecall(domain)}
                >
                  <Icon strokeWidth={1.75} />
                  <b>{domain.name}</b>
                  <em>{domain.prompt}</em>
                  <span className="ai-lab-memory-node__badge">
                    {count > 0 ? `${count} stored` : "empty"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="ai-lab-memory-retrieve">
            <div className="ai-lab-memory-retrieve__head">
              <span className="ai-lab-memory-retrieve__title">
                <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
                Memory retrieved
              </span>
              <span className="ai-lab-memory-retrieve__chip">{retrieval?.domain.name ?? "--"}</span>
            </div>
            <div className="ai-lab-memory-retrieve__body">
              {!retrieval ? (
                <p className="ai-lab-memory-empty">
                  Select a knowledge node above to run a simulated retrieval.
                </p>
              ) : retrieval.phase === "recalling" ? (
                <div className="ai-lab-memory-recalling">
                  <span className="ai-lab-memory-sweep" aria-hidden />
                  Recalling from {retrieval.domain.name} knowledge…
                </div>
              ) : (
                <ul className="ai-lab-memory-results">
                  {retrieval.items.map((item, i) => (
                    <li
                      key={item}
                      className="ai-lab-memory-result"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <span className="ai-lab-memory-result__check">
                        <Check strokeWidth={3} aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}