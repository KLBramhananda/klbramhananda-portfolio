import { memo, useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, Cpu, Database, FlaskConical, Globe, Inbox, Monitor, Play, RotateCw, Scale, Server, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import type { LabModule } from "../data/modules";

const CANVAS_W = 1200;
const CANVAS_H = 640;
const NODE_W = 120;
const NODE_H = 54;
const MIN_SCALE = 0.72;

/* Subtle 3D camera & depth budget for the architecture canvas — kept modest
   so the diagram reads as a premium engineering workspace, never a game. */
const CAM_DEG = 3;
const CAM_PERSPECTIVE = 1350;
const PACKET_Z = 42;
const SVG_Z = -56;
const SELECTED_LIFT = 46;

/* Per-zone depth on the shared Z axis: user-facing edge floats closest to the
   viewer, core data layers (cache → database) recede. This gives a gentle
   parallax when the camera tilts. */
const NODE_Z: Record<NodeId, number> = {
  client: 90,
  cdn: 80,
  api: 70,
  lb: 60,
  queue: 52,
  worker: 44,
  backend: 36,
  cache: 22,
  database: 6,
};

type NodeId =
  | "client"
  | "cdn"
  | "api"
  | "lb"
  | "backend"
  | "cache"
  | "database"
  | "queue"
  | "worker";

type Kind = "request" | "response" | "error" | "data" | "store";

type LabNode = {
  id: NodeId;
  label: string;
  sub: string;
  x: number;
  y: number;
  icon: LucideIcon;
  detail: string;
};

type LabEdge = {
  id: string;
  from: NodeId;
  to: NodeId;
  d: string;
  async?: boolean;
  isReturn?: boolean;
};

type ScenarioId = "normal" | "high" | "cache-hit" | "cache-miss" | "failure";

type Step =
  | { kind: "hop"; edgeId: string; from: NodeId; to: NodeId; tone: Kind; note: string }
  | { kind: "mark"; nodeId: NodeId; tone: Kind; text: string };

type Scenario = {
  id: ScenarioId;
  name: string;
  blurb: string;
  explanation: string;
  traffic: "low" | "high" | "none";
  hopMs: number;
  pause: number;
  degraded: NodeId[];
  steps: Step[];
};

type FlowPacket = { id: number; edgeId: string; tone: Kind; dur: number };
type NodeFlash = { text: string; tone: Kind };

const NODES: LabNode[] = [
  {
    id: "client",
    label: "Client",
    sub: "Browser / App",
    x: 70,
    y: 190,
    icon: Monitor,
    detail:
      "The browser or mobile app that initiates the request. It resolves DNS, pulls cached static assets from the nearest CDN edge, and calls the API gateway for dynamic data.",
  },
  {
    id: "cdn",
    label: "CDN",
    sub: "Edge cache",
    x: 244,
    y: 190,
    icon: Globe,
    detail:
      "A globally distributed edge cache that serves static assets close to the user and can cache API responses. It answers a large share of traffic without the origin ever seeing it.",
  },
  {
    id: "api",
    label: "API Gateway",
    sub: "Auth · route · throttle",
    x: 418,
    y: 190,
    icon: ShieldCheck,
    detail:
      "The single entry point for clients: authentication, authorization, rate limiting, and request routing. It keeps security policies in one place and the backend boundary clean.",
  },
  {
    id: "lb",
    label: "Load Balancer",
    sub: "Traffic spread",
    x: 592,
    y: 190,
    icon: Scale,
    detail:
      "Sits between clients and backend replicas. Distributes connections across healthy instances, health-checks them, and routes around instances that fail — the first line of resilience.",
  },
  {
    id: "backend",
    label: "Backend",
    sub: "Services",
    x: 766,
    y: 190,
    icon: Server,
    detail:
      "Stateless application services holding the business logic. Statelessness means any replica can serve any request, so horizontal scaling is safe and failure recovery is cheap.",
  },
  {
    id: "cache",
    label: "Cache",
    sub: "In-memory",
    x: 940,
    y: 190,
    icon: Zap,
    detail:
      "An in-memory key-value store (e.g. Redis) that serves hot reads before they reach the database. Cutting database reads is usually the biggest latency and cost win in a read-heavy system.",
  },
  {
    id: "database",
    label: "Database",
    sub: "Source of truth",
    x: 1114,
    y: 190,
    icon: Database,
    detail:
      "The durable source of truth (e.g. Postgres). Writes are authoritative and reads fall through to it when the cache misses. It is intentionally kept as the slowest, most protected layer.",
  },
  {
    id: "queue",
    label: "Queue",
    sub: "Async buffer",
    x: 700,
    y: 500,
    icon: Inbox,
    detail:
      "A durable broker (e.g. Kafka or RabbitMQ) that buffers jobs the user doesn't wait for — emails, exports, index rebuilds, webhooks. It decouples the API from slow, heavy work.",
  },
  {
    id: "worker",
    label: "Worker",
    sub: "Consumers",
    x: 880,
    y: 500,
    icon: Cpu,
    detail:
      "Independent consumers that pull jobs off the queue and process them asynchronously. They let the API respond fast while processing happens in the background, and they scale independently.",
  },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<NodeId, LabNode>;

const EDGES: LabEdge[] = [
  { id: "e1", from: "client", to: "cdn", d: "M130 190 H184" },
  { id: "e2", from: "cdn", to: "api", d: "M304 190 H358" },
  { id: "e3", from: "api", to: "lb", d: "M478 190 H532" },
  { id: "e4", from: "lb", to: "backend", d: "M652 190 H706" },
  { id: "e5", from: "backend", to: "cache", d: "M826 190 H880" },
  { id: "e6", from: "cache", to: "database", d: "M1000 190 H1054" },
  { id: "e7", from: "backend", to: "queue", d: "M766 217 C 766 320 726 350 700 465", async: true },
  { id: "e8", from: "queue", to: "worker", d: "M760 500 H820", async: true },
  { id: "resp", from: "database", to: "client", d: "M1114 190 C 1172 345 12 345 70 190", isReturn: true },
];

const EDGE_BY_ID = Object.fromEntries(EDGES.map((e) => [e.id, e])) as Record<string, LabEdge>;

const CHEVRONS: { points: string }[] = [
  { points: "172 184 182 190 172 196" },
  { points: "346 184 356 190 346 196" },
  { points: "520 184 530 190 520 196" },
  { points: "694 184 704 190 694 196" },
  { points: "868 184 878 190 868 196" },
  { points: "1042 184 1052 190 1042 196" },
  { points: "732 424 738 434 744 424" },
  { points: "798 494 808 500 798 506" },
  { points: "602 334 592 340 602 346" },
];

const EDGE_STROKE: Record<Kind, string> = {
  request: "oklch(0.74 0.13 245)",
  response: "oklch(0.78 0.15 160)",
  error: "oklch(0.72 0.17 25)",
  data: "oklch(0.66 0.1 258)",
  store: "oklch(0.78 0.14 80)",
};

const SCENARIOS: Scenario[] = [
  {
    id: "normal",
    name: "Normal Traffic",
    blurb: "Baseline full-stack round trip",
    explanation:
      "A single typical request: Client → CDN → API Gateway → Load Balancer → Backend → Cache → Database, then the response returns to the client. The cache serves the data when it can; on a miss the database is read.",
    traffic: "low",
    hopMs: 560,
    pause: 200,
    degraded: [],
    steps: [
      { kind: "hop", edgeId: "e1", from: "client", to: "cdn", tone: "request", note: "Client → CDN" },
      { kind: "hop", edgeId: "e2", from: "cdn", to: "api", tone: "request", note: "CDN → API Gateway" },
      { kind: "hop", edgeId: "e3", from: "api", to: "lb", tone: "request", note: "API Gateway → Load Balancer" },
      { kind: "hop", edgeId: "e4", from: "lb", to: "backend", tone: "request", note: "Load Balancer → Backend" },
      { kind: "hop", edgeId: "e5", from: "backend", to: "cache", tone: "request", note: "Backend → Cache" },
      { kind: "hop", edgeId: "e6", from: "cache", to: "database", tone: "data", note: "Cache miss fallback → Database read" },
      { kind: "hop", edgeId: "resp", from: "database", to: "client", tone: "response", note: "Response → Client" },
    ],
  },
  {
    id: "high",
    name: "High Traffic",
    blurb: "Concurrent traffic + async offload",
    explanation:
      "When traffic spikes, the load balancer fans out across backend replicas, the cache absorbs repeated reads, and slow non-interactive work (exports, notifications) is pushed to the queue and drained by workers — the API stays fast under load.",
    traffic: "high",
    hopMs: 360,
    pause: 150,
    degraded: [],
    steps: [
      { kind: "hop", edgeId: "e1", from: "client", to: "cdn", tone: "request", note: "Client → CDN" },
      { kind: "hop", edgeId: "e2", from: "cdn", to: "api", tone: "request", note: "CDN → API Gateway" },
      { kind: "hop", edgeId: "e3", from: "api", to: "lb", tone: "request", note: "API Gateway → Load Balancer" },
      { kind: "hop", edgeId: "e4", from: "lb", to: "backend", tone: "request", note: "Load Balancer → Backend replica" },
      { kind: "hop", edgeId: "e5", from: "backend", to: "cache", tone: "request", note: "Backend → Cache (hot reads)" },
      { kind: "hop", edgeId: "e6", from: "cache", to: "database", tone: "data", note: "Cache → Database (selected reads)" },
      { kind: "hop", edgeId: "e7", from: "backend", to: "queue", tone: "data", note: "Backend enqueues async job → Queue" },
      { kind: "hop", edgeId: "e8", from: "queue", to: "worker", tone: "data", note: "Queue → Worker (background processing)" },
      { kind: "hop", edgeId: "resp", from: "database", to: "client", tone: "response", note: "Response → Client" },
    ],
  },
  {
    id: "cache-hit",
    name: "Cache Hit",
    blurb: "Answer served from memory",
    explanation:
      "The cache already holds the answer, so the request reaches the cache and returns immediately — the database is never touched. This is the cheapest, fastest outcome, and it's why hot paths are so heavily cached.",
    traffic: "none",
    hopMs: 480,
    pause: 220,
    degraded: [],
    steps: [
      { kind: "hop", edgeId: "e1", from: "client", to: "cdn", tone: "request", note: "Client → CDN" },
      { kind: "hop", edgeId: "e2", from: "cdn", to: "api", tone: "request", note: "CDN → API Gateway" },
      { kind: "hop", edgeId: "e3", from: "api", to: "lb", tone: "request", note: "API Gateway → Load Balancer" },
      { kind: "hop", edgeId: "e4", from: "lb", to: "backend", tone: "request", note: "Load Balancer → Backend" },
      { kind: "hop", edgeId: "e5", from: "backend", to: "cache", tone: "request", note: "Backend → Cache lookup" },
      { kind: "mark", nodeId: "cache", tone: "response", text: "HIT · served from memory" },
      { kind: "hop", edgeId: "resp", from: "database", to: "client", tone: "response", note: "Response → Client (database untouched)" },
    ],
  },
  {
    id: "cache-miss",
    name: "Cache Miss",
    blurb: "Falls through to the database",
    explanation:
      "The cache doesn't have the data, so the request falls through to the database, the value is stored back for the next request, and the response returns. Slightly slower the first time, fast afterward — the classic read-through pattern.",
    traffic: "none",
    hopMs: 520,
    pause: 240,
    degraded: [],
    steps: [
      { kind: "hop", edgeId: "e1", from: "client", to: "cdn", tone: "request", note: "Client → CDN" },
      { kind: "hop", edgeId: "e2", from: "cdn", to: "api", tone: "request", note: "CDN → API Gateway" },
      { kind: "hop", edgeId: "e3", from: "api", to: "lb", tone: "request", note: "API Gateway → Load Balancer" },
      { kind: "hop", edgeId: "e4", from: "lb", to: "backend", tone: "request", note: "Load Balancer → Backend" },
      { kind: "hop", edgeId: "e5", from: "backend", to: "cache", tone: "request", note: "Backend → Cache lookup" },
      { kind: "mark", nodeId: "cache", tone: "store", text: "MISS · no entry" },
      { kind: "hop", edgeId: "e6", from: "cache", to: "database", tone: "data", note: "Cache → Database (source read)" },
      { kind: "mark", nodeId: "cache", tone: "store", text: "Value stored for next time" },
      { kind: "hop", edgeId: "resp", from: "database", to: "client", tone: "response", note: "Response → Client" },
    ],
  },
  {
    id: "failure",
    name: "Service Failure",
    blurb: "Backend down — fail fast",
    explanation:
      "The backend is unhealthy, so the load balancer stops routing to it and the request fails fast with a 503. Fast failure beats stacking requests onto a dying service — the load balancer keeps the blast radius small while the unhealthy node restarts.",
    traffic: "none",
    hopMs: 440,
    pause: 220,
    degraded: ["backend"],
    steps: [
      { kind: "hop", edgeId: "e1", from: "client", to: "cdn", tone: "request", note: "Client → CDN" },
      { kind: "hop", edgeId: "e2", from: "cdn", to: "api", tone: "request", note: "CDN → API Gateway" },
      { kind: "hop", edgeId: "e3", from: "api", to: "lb", tone: "request", note: "API Gateway → Load Balancer" },
      { kind: "hop", edgeId: "e4", from: "lb", to: "backend", tone: "request", note: "Load Balancer → unhealthy Backend" },
      { kind: "mark", nodeId: "backend", tone: "error", text: "Unhealthy — no healthy hosts" },
      { kind: "hop", edgeId: "resp", from: "database", to: "client", tone: "error", note: "503 Service Unavailable → Client" },
    ],
  },
];

const TONE_DOT: Record<Kind, string> = {
  request: "bg-cyan-accent",
  response: "bg-emerald-500",
  error: "bg-rose-500",
  data: "bg-blue-accent",
  store: "bg-amber-400",
};

const TONE_TEXT: Record<Kind, string> = {
  request: "text-cyan-accent",
  response: "text-emerald-700 dark:text-emerald-300",
  error: "text-rose-600 dark:text-rose-400",
  data: "text-blue-accent",
  store: "text-amber-600 dark:text-amber-400",
};

const FLASH_BADGE: Record<Kind, string> = {
  request: "border-cyan-accent/40 bg-cyan-accent/15 text-cyan-accent",
  response: "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  error: "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300",
  data: "border-blue-accent/40 bg-blue-accent/15 text-blue-accent",
  store: "border-amber-400/40 bg-amber-400/15 text-amber-700 dark:text-amber-300",
};

type LogEntry = { id: number; time: string; text: string; tone: Kind };

/* The two static layers of the canvas graph — edges and nodes — are memoized
   so simulation updates (packets, logs, flashes) don't re-render the whole
   9-node diagram. Edges only change when the focused request hop changes; a
   node only re-renders when its own reactive bits (selection, degrade, flash,
   active hop) change. */

const SystemEdge = memo(function SystemEdge({
  edge,
  isFocus,
  tone,
}: {
  edge: LabEdge;
  isFocus: boolean;
  tone: Kind;
}) {
  const isReturn = edge.isReturn;
  return (
    <path
      d={edge.d}
      fill="none"
      stroke={
        isFocus
          ? EDGE_STROKE[tone]
          : isReturn
            ? "oklch(0.6 0.05 258 / 0.32)"
            : "oklch(0.6 0.05 258 / 0.42)"
      }
      strokeWidth={isFocus ? 2.2 : 1.4}
      strokeLinecap="round"
      strokeDasharray={isFocus ? undefined : isReturn || edge.async ? "4 9" : undefined}
      opacity={isFocus || !isReturn ? 1 : 0.8}
      className={isFocus ? "lab-sys-flowing" : undefined}
    />
  );
});

interface SystemNodeProps {
  node: LabNode;
  index: number;
  degraded: boolean;
  isActive: boolean;
  isSelected: boolean;
  flash: NodeFlash | undefined;
  cameraOff: boolean;
  onToggle: (id: NodeId) => void;
}

const SystemNode = memo(
  function SystemNode({
    node,
    index,
    degraded,
    isActive,
    isSelected,
    flash: flashState,
    cameraOff,
    onToggle,
  }: SystemNodeProps) {
    const Icon = node.icon;
    return (
      <button
        type="button"
        onClick={() => onToggle(node.id)}
        aria-pressed={isSelected}
        aria-label={`Inspect ${node.label}${degraded ? " — degraded" : ""}`}
        className={`absolute flex flex-col items-center justify-center gap-1 rounded-xl px-2 text-center transition-all duration-200 ${
          degraded
            ? "border-rose-500/60 bg-rose-500/[0.06]"
            : isSelected
              ? "border-cyan-accent/60 bg-slate-900/[0.06] dark:bg-white/[0.06]"
              : isActive
                ? "glass-strong border-cyan-accent/50 shadow-[0_0_22px_-6px_rgba(6,182,212,0.5)]"
                : "glass-strong"
        }`}
        style={{
          left: node.x - NODE_W / 2,
          top: node.y - NODE_H / 2,
          width: NODE_W,
          height: NODE_H,
          transformStyle: cameraOff ? undefined : "preserve-3d",
          transform: cameraOff
            ? undefined
            : `translateZ(${NODE_Z[node.id] + (isSelected ? SELECTED_LIFT : 0)}px)`,
        }}
      >
        {flashState && (
          <span
            className={`animate-fade-up absolute -top-2 -right-2 z-10 whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.5625rem] font-bold ${FLASH_BADGE[flashState.tone]}`}
          >
            {flashState.text}
          </span>
        )}
        <span
          className="lab-3d-float flex max-w-full flex-col items-center gap-1"
          style={{ animationDelay: `${-(index * 1.31)}s` }}
        >
          <span className="flex max-w-full items-center gap-1.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                degraded
                  ? "bg-rose-500/15 text-rose-400"
                  : "bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span
              className={`truncate text-xs font-semibold ${
                degraded ? "text-rose-400" : "text-foreground"
              }`}
            >
              {node.label}
            </span>
          </span>
          <span className="flex items-center gap-1">
            {degraded && (
              <span aria-hidden className="lab-sys-pulse h-1 w-1 shrink-0 rounded-full bg-rose-500" />
            )}
            <span
              className={`truncate text-[0.625rem] leading-none ${
                degraded ? "max-w-[96px] text-rose-500/80" : "max-w-[104px] text-muted-foreground"
              }`}
            >
              {degraded ? "Unavailable · 503" : node.sub}
            </span>
          </span>
        </span>
      </button>
    );
  },
  (prev, next) =>
    prev.degraded === next.degraded &&
    prev.isActive === next.isActive &&
    prev.isSelected === next.isSelected &&
    prev.flash === next.flash &&
    prev.cameraOff === next.cameraOff,
);

export function SystemDesignLab({
  module,
  onBack,
}: {
  module: LabModule;
  onBack: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const rs = reduced ? 0.25 : 1;

  /* Camera — spring-smoothed pointer parallax. `cameraOff` under reduced
     motion degrades the canvas back to the flat 2D diagram. */
  const cameraOff = reduced;
  const camX = useMotionValue(0);
  const camY = useMotionValue(0);
  const rotX = useSpring(useTransform(camY, (v) => -v * CAM_DEG), { stiffness: 140, damping: 22, mass: 0.6 });
  const rotY = useSpring(useTransform(camX, (v) => v * CAM_DEG), { stiffness: 140, damping: 22, mass: 0.6 });

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef(1);
  const logRef = useRef<HTMLDivElement | null>(null);
  const seqToken = useRef(0);
  const packetId = useRef(0);
  const startRef = useRef(0);
  const interactedRef = useRef(false);
  const packetTimers = useRef<number[]>([]);
  const flashTimers = useRef(new Map<NodeId, number>());

  const [scale, setScale] = useState(1);
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [running, setRunning] = useState(false);
  const [flow, setFlow] = useState<FlowPacket[]>([]);
  const [focus, setFocus] = useState<{ edgeIds: string[]; tone: Kind }>({ edgeIds: [], tone: "request" });
  const [nodeFlash, setNodeFlash] = useState<Partial<Record<NodeId, NodeFlash>>>({});
  const [selected, setSelected] = useState<NodeId | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const runSequenceRef = useRef(runSequence);
  useEffect(() => {
    runSequenceRef.current = runSequence;
  });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const next = Math.min(1, Math.max(MIN_SCALE, w / CANVAS_W));
        scaleRef.current = next;
        setScale(next);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Stage transform writer. Pushed by the camera springs' `change` events
     instead of an unconditional rAF loop: the springs only emit while they are
     animating (i.e. while the pointer is actually moving the camera), so when
     the canvas is idle nothing repaints and no CPU is burned. Folds the
     responsive scale in so the camera and layout never fight. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const apply = () => {
      el.style.transform = cameraOff
        ? `scale(${scaleRef.current})`
        : `perspective(${CAM_PERSPECTIVE}px) scale(${scaleRef.current}) rotateY(${rotY.get().toFixed(3)}deg) rotateX(${rotX.get().toFixed(3)}deg)`;
    };
    apply();
    if (cameraOff) return;
    const offX = rotX.on("change", apply);
    const offY = rotY.on("change", apply);
    return () => {
      offX();
      offY();
    };
  }, [rotY, rotX, cameraOff, scale]);

  function handleCameraMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    camX.set(Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)));
    camY.set(Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)));
  }

  function handleCameraLeave() {
    camX.set(0);
    camY.set(0);
  }

  useEffect(() => {
    const logEl = logRef.current;
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
  }, [logs]);

  useEffect(
    () => () => {
      seqToken.current += 1;
      packetTimers.current.forEach((t) => window.clearTimeout(t));
      flashTimers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  function log(text: string, tone: Kind) {
    const id = ++packetId.current;
    const time = `+${((performance.now() - startRef.current) / 1000).toFixed(2)}s`;
    setLogs((prev) => [...prev.slice(-39), { id, time, text, tone }]);
  }

  function flash(nodeId: NodeId, text: string, tone: Kind) {
    setNodeFlash((prev) => ({ ...prev, [nodeId]: { text, tone } }));
    const prevTimer = flashTimers.current.get(nodeId);
    if (prevTimer) window.clearTimeout(prevTimer);
    const timer = window.setTimeout(() => {
      setNodeFlash((prev) => {
        if (!prev[nodeId]) return prev;
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
      flashTimers.current.delete(nodeId);
    }, 2800);
    flashTimers.current.set(nodeId, timer);
  }

  function spawnPacket(edgeId: string, tone: Kind, dur: number) {
    const id = ++packetId.current;
    setFlow((prev) => [...prev, { id, edgeId, tone, dur }]);
    const t = window.setTimeout(() => {
      setFlow((prev) => prev.filter((p) => p.id !== id));
    }, dur + 80);
    packetTimers.current.push(t);
  }

  async function runSequence(steps: Step[], hopMs: number, pause: number) {
    const token = ++seqToken.current;
    setRunning(true);
    setLogs([]);
    setFocus({ edgeIds: [], tone: "request" });
    startRef.current = performance.now();
    log("Request in flight", "request");

    const total = hopMs * rs + pause * rs;

    for (const step of steps) {
      if (token !== seqToken.current) return;
      if (step.kind === "hop") {
        setFocus({ edgeIds: [step.edgeId], tone: step.tone });
        spawnPacket(step.edgeId, step.tone, hopMs * rs);
        log(step.note, step.tone);
      } else {
        flash(step.nodeId, step.text, step.tone);
        log(step.text, step.tone);
      }
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, total + (step.kind === "mark" ? 120 : 0));
      });
    }

    if (token !== seqToken.current) return;
    setFocus({ edgeIds: [], tone: "request" });
    log("Request completed", "response");
    setRunning(false);
  }

  function sendRequest() {
    if (running) return;
    interactedRef.current = true;
    void runSequence(scenario.steps, scenario.hopMs, scenario.pause);
  }

  function selectScenario(s: Scenario) {
    seqToken.current += 1;
    setRunning(false);
    setFocus({ edgeIds: [], tone: "request" });
    setNodeFlash({});
    setScenario(s);
    interactedRef.current = true;
  }

  const toggleSelect = useCallback((id: NodeId) => {
    setSelected((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    if (running) return;
    const pool =
      scenario.traffic === "high"
        ? ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"]
        : scenario.traffic === "low"
          ? ["e1", "e2", "e3", "e4", "e5", "e6"]
          : [];
    if (pool.length === 0) return;
    const delay = scenario.traffic === "high" ? 330 : 1500;
    const dur = scenario.traffic === "high" ? 360 : 720;
    let timer: number | undefined;
    const tick = () => {
      const edge = pool[Math.floor(Math.random() * pool.length)];
      spawnPacket(edge, edge === "e6" ? "data" : "request", dur);
      timer = window.setTimeout(tick, delay + Math.random() * delay * 0.6);
    };
    timer = window.setTimeout(tick, delay);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [running, scenario, reduced]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!interactedRef.current) {
        const normal = SCENARIOS[0];
        void runSequenceRef.current(normal.steps, normal.hopMs, normal.pause);
      }
    }, 900);
    return () => window.clearTimeout(t);
  }, []);

  const activeNodeIds = new Set<NodeId>();
  for (const id of focus.edgeIds) {
    const edge = EDGE_BY_ID[id];
    if (edge) {
      activeNodeIds.add(edge.from);
      activeNodeIds.add(edge.to);
    }
  }

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
            <FlaskConical className="h-8 w-8" strokeWidth={1.6} />
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
          A living architecture diagram. Pick a scenario and send a request, or
          tap any component to read what it does on the modern web stack.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Traffic scenarios">
          {SCENARIOS.map((s) => {
            const active = scenario.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectScenario(s)}
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
                  active
                    ? "border-cyan-accent/50 bg-cyan-accent/10 text-cyan-accent"
                    : "border-slate-900/10 bg-slate-900/[0.03] text-muted-foreground hover:border-cyan-accent/30 hover:text-foreground dark:border-white/10 dark:bg-white/[0.03]"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={sendRequest}
          disabled={running}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-5 py-2.5 text-sm font-semibold text-background shadow-[0_10px_40px_-12px_rgba(6,182,212,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_50px_-10px_rgba(6,182,212,0.75)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {running ? (
            <RotateCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" fill="currentColor" />
          )}
          {running ? "Request in flight…" : "Send Request"}
        </button>
      </div>

      {/* Canvas */}
      <div className="mt-6 rounded-3xl glass-strong p-4 sm:p-6">
        <div
          ref={wrapRef}
          className="relative w-full overflow-x-auto"
          style={{ height: CANVAS_H * scale }}
          onPointerMove={cameraOff ? undefined : handleCameraMove}
          onPointerLeave={cameraOff ? undefined : handleCameraLeave}
        >
          <div
            ref={stageRef}
            className="absolute left-0 right-0 top-0"
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              marginLeft: "auto",
              marginRight: "auto",
              transformStyle: cameraOff ? undefined : "preserve-3d",
              transformOrigin: "top center",
            }}
          >
            <svg
              aria-hidden
              width={CANVAS_W}
              height={CANVAS_H}
              className="absolute inset-0"
              style={{ transform: cameraOff ? undefined : `translateZ(${SVG_Z}px)` }}
            >
              {EDGES.map((e) => (
                <SystemEdge
                  key={e.id}
                  edge={e}
                  isFocus={focus.edgeIds.includes(e.id)}
                  tone={focus.tone}
                />
              ))}
              {CHEVRONS.map((c, i) => (
                <polygon key={i} points={c.points} className="lab-sys-chevron" aria-hidden />
              ))}
            </svg>

            {flow.map((p) => {
              const edge = EDGE_BY_ID[p.edgeId];
              if (!edge) return null;
              return (
                <span
                  key={p.id}
                  aria-hidden
                  className="absolute left-0 top-0 h-0 w-0"
                  style={{ transform: cameraOff ? undefined : `translateZ(${PACKET_Z}px)` }}
                >
                  <span
                    className={`lab-sys-packet lab-sys-kind-${p.tone}`}
                    style={{ offsetPath: `path("${edge.d}")`, animationDuration: `${p.dur}ms` }}
                  />
                </span>
              );
            })}

            <div
              aria-hidden
              className="absolute left-1/2 -translate-x-1/2 text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground/80"
              style={{ top: 318 }}
            >
              Response path
            </div>
            <div
              aria-hidden
              className="absolute right-6 text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground/60"
              style={{ top: 262 }}
            >
              Request →
            </div>

            {NODES.map((n, i) => (
              <SystemNode
                key={n.id}
                node={n}
                index={i}
                degraded={scenario.degraded.includes(n.id)}
                isActive={activeNodeIds.has(n.id)}
                isSelected={selected === n.id}
                flash={nodeFlash[n.id]}
                cameraOff={cameraOff}
                onToggle={toggleSelect}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-900/8 pt-4 text-[0.6875rem] text-muted-foreground dark:border-white/8">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-accent" />
            Request
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Response
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-accent" />
            Data / async work
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Failure / 503
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-5 border-t-2 border-dashed border-slate-900/15 dark:border-white/15" />
            Background path
          </span>
          <span className="ml-auto hidden items-center gap-2 sm:inline-flex">
            {scenario.traffic === "high" ? (
              <RotateCw className="h-3.5 w-3.5 animate-spin text-cyan-accent" aria-hidden />
            ) : (
              <span className="lab-sys-pulse h-1.5 w-1.5 rounded-full bg-cyan-accent" aria-hidden />
            )}
            {running ? "Simulating…" : scenario.blurb}
          </span>
          {!cameraOff && (
            <span className="hidden items-center gap-1.5 text-muted-foreground/60 lg:inline-flex">
              <Monitor className="h-3.5 w-3.5" aria-hidden />
              3D — move cursor to explore depth
            </span>
          )}
        </div>
        <p className="mt-3 text-[0.6875rem] text-muted-foreground/70 sm:hidden">
          Swipe or scroll horizontally to explore the full architecture.
        </p>
      </div>

      {/* Info panels */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl glass p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Live request trace</h2>
            <button
              type="button"
              onClick={() => {
                setLogs([]);
                interactedRef.current = true;
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-slate-900/[0.06] hover:text-foreground dark:hover:bg-white/[0.06]"
            >
              Clear
            </button>
          </div>
          <div
            ref={logRef}
            className="mt-4 max-h-64 space-y-1.5 overflow-y-auto pr-1 font-mono text-xs"
          >
            {logs.length === 0 && (
              <p className="p-2 text-muted-foreground/80">
                Press <span className="text-cyan-accent">Send Request</span> to
                watch a request cross the stack — or switch scenarios above.
              </p>
            )}
            {logs.map((entry) => (
              <div key={entry.id} className="flex items-baseline gap-2.5 leading-relaxed">
                <span className="shrink-0 tabular-nums text-muted-foreground/70">{entry.time}</span>
                <span className={`shrink-0 self-center h-1.5 w-1.5 rounded-full ${TONE_DOT[entry.tone]}`} />
                <span className={`${TONE_TEXT[entry.tone]}`}>{entry.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl glass p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">
            {selected ? NODE_BY_ID[selected].label : scenario.name}
          </h2>
          <p className="mt-2 text-muted-foreground/80">{scenario.blurb}</p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            {selected
              ? NODE_BY_ID[selected].detail
              : scenario.explanation}
          </p>
          {selected && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-4 text-xs font-medium text-cyan-accent transition-colors hover:text-foreground"
            >
              Show scenario explainer instead
            </button>
          )}
        </div>
      </div>

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