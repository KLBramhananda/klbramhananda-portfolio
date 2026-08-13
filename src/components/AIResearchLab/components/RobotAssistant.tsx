import { useCallback, useEffect, useRef, useState } from "react";
import { Minus } from "lucide-react";
import { subscribeToLab } from "../lib/lab-events";

/**
 * Robot Assistant RK-01 — the Lab's resident guide, presented as an in-flow
 * showcase section (module 08) rather than a floating widget.
 *
 * A small glass pod that watches over the visitor:
 *   - its visor tracks the cursor, and it blinks on clicks,
 *   - it streams a status line, guidance and warnings from the lab event bus,
 *   - it suggests what to explore while the lab is idle.
 *
 * Everything is local and cosmetic — no models, no endpoints, no tracking data.
 */

type Tone = "ok" | "warn" | "info";

type Speech = {
  id: number;
  text: string;
  tone: Tone;
};

const GREETING = "Welcome to the AI Research Lab.";

const OPEN_TIPS: Record<string, string> = {
  reasoning: "Watch it weigh options before it commits to a plan.",
  rag: "Trace a question from embedding to answer.",
  agent: "Hand it a task and see which tool it picks.",
  failure: "Click a service to fail it — I'll flag the fallback.",
  traffic: "Push the dial past capacity and watch the fleet scale.",
};

const SUCCESS_MSGS: Record<string, string> = {
  reasoning: "Run complete — decision locked in.",
  rag: "Retrieval done — knowledge grounded the answer.",
  agent: "Task finished — tool call logged.",
  failure: "Incident mitigated — fallback held.",
  traffic: "Fleet scaled — the load was absorbed.",
};

const WARN_FALLBACK = "System failure detected. Investigate the backend.";

const IDLE_TIPS = [
  "Try asking the Agent to check inventory.",
  "Open the RAG pipeline and ask about the ERP sync.",
  "Crank the traffic dial toward Stress.",
  "Poke the Billing API and watch the circuit open.",
  "Reason through the price-hike scenario.",
];

const CLICK_MSGS = [
  "Click detected — I'm tracking.",
  "Curious — keep probing.",
  "Interface responding.",
];

const SPEECH_MS = 7000;
const WARN_MS = 12000;

export function RobotAssistant({ online = false }: { online?: boolean }) {
  const podRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(1);
  const busyUntilRef = useRef(0);
  const lastEventRef = useRef(0);
  const lastClickRef = useRef(0);
  const clickCountRef = useRef(0);
  const idleIdxRef = useRef(0);
  const blinkTimerRef = useRef<number | null>(null);

  const [speech, setSpeech] = useState<Speech | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const push = useCallback((text: string, tone: Tone, sticky = false) => {
    const now = Date.now();
    lastEventRef.current = now;
    busyUntilRef.current = now + (sticky ? WARN_MS : SPEECH_MS);
    setSpeech({ id: idRef.current++, text, tone });
    setRemaining(sticky ? Math.round(WARN_MS / 1000) : Math.round(SPEECH_MS / 1000));
  }, []);

  const triggerBlink = useCallback(() => {
    if (blinkTimerRef.current) window.clearTimeout(blinkTimerRef.current);
    setBlinking(true);
    blinkTimerRef.current = window.setTimeout(() => setBlinking(false), 150);
  }, []);

  // Count down the bubble lifetime.
  useEffect(() => {
    if (remaining <= 0) return;
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [remaining]);

  // Greet once the lab is live.
  useEffect(() => {
    if (!online) return;
    const t = window.setTimeout(() => push(GREETING, "ok"), 500);
    return () => window.clearTimeout(t);
  }, [online, push]);

  // React to the experiments via the lab event bus.
  useEffect(() => {
    const unsubscribe = subscribeToLab((event) => {
      if (event.type === "experiment:opened") {
        push(OPEN_TIPS[event.id] ?? `Exploring ${event.name}.`, "info");
      } else if (event.type === "experiment:started") {
        push("Simulation started — tracking the run.", "info");
      } else if (event.type === "experiment:success") {
        push(SUCCESS_MSGS[event.id] ?? "Run complete.", "ok");
      } else if (event.type === "experiment:warning") {
        setMinimized(false);
        push(event.detail ?? WARN_FALLBACK, "warn", true);
      }
    });
    return unsubscribe;
  }, [push]);

  // Suggest what to explore while nothing is happening.
  useEffect(() => {
    if (!online) return;
    const iv = window.setInterval(() => {
      const now = Date.now();
      if (now < busyUntilRef.current) return;
      if (now - lastEventRef.current < 6000) return;
      if (document.hidden) return;
      const tip = IDLE_TIPS[idleIdxRef.current++ % IDLE_TIPS.length];
      push(tip, "info");
    }, 9000);
    return () => window.clearInterval(iv);
  }, [online, push]);

  // Visor tracks the cursor; the pod tilts toward it.
  useEffect(() => {
    const el = podRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      const py = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
      tx = px;
      ty = py;
    };

    const tick = () => {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      el.style.setProperty("--rx", cx.toFixed(3));
      el.style.setProperty("--ry", cy.toFixed(3));
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  // Blink naturally, and react (blink + occasional note) to any click.
  useEffect(() => {
    if (!online) return;
    const blinkIv = window.setInterval(triggerBlink, 4500);

    const onPointerDown = () => {
      triggerBlink();
      const now = Date.now();
      if (now - lastClickRef.current < 6000) return;
      lastClickRef.current = now;
      if (now > busyUntilRef.current && clickCountRef.current % 4 === 0) {
        const msg = CLICK_MSGS[clickCountRef.current % CLICK_MSGS.length];
        push(msg, "info");
      }
      clickCountRef.current += 1;
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.clearInterval(blinkIv);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [online, push, triggerBlink]);

  const handlePodClick = () => {
    triggerBlink();
    if (minimized) {
      setMinimized(false);
      return;
    }
    push(
      online ? "Core linked · 9 modules · synthetic sandbox." : "Core standby — awaiting wake.",
      "info",
    );
  };

  const bubbleVisible = speech !== null && remaining > 0 && !minimized;

  return (
    <section
      className={`ai-lab-raise ai-lab-panel ai-lab-panel--robo ai-lab-robo-showcase${
        minimized ? " is-min" : ""
      }`}
      aria-label="Robot Assistant RK-01"
    >
      <div className="ai-lab-panel-head">
        <div className="flex min-w-0 items-center gap-3">
          <span className="ai-lab-label">Robot Assistant</span>
          <span className="ai-lab-divider hidden sm:block" />
          <span className="ai-lab-value hidden text-muted-foreground sm:block">
            ROBO / 08 — Embodied assistance
          </span>
        </div>
        <span className="ai-lab-chip">
          <span
            className={`ai-lab-dot ${online ? "ai-lab-dot--green" : "ai-lab-dot--amber"}`}
          />
          AI ASSISTANT · {online ? "LINKED" : "STANDBY"}
        </span>
      </div>

      <div className="ai-lab-robo-stage">
        <span className="ai-lab-robo-stage__beam ai-lab-robo-stage__beam--a" aria-hidden />
        <span className="ai-lab-robo-stage__beam ai-lab-robo-stage__beam--b" aria-hidden />
        <span className="ai-lab-robo-stage__pad" aria-hidden />

        {minimized ? (
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="ai-lab-robo__dot"
            aria-label="Restore robot assistant RK-01"
          >
            <span className="ai-lab-robo__dot-ring" aria-hidden />
            <span className={`ai-lab-robo__dot-core${online ? " is-on" : ""}`} aria-hidden />
          </button>
        ) : (
          <>
            {bubbleVisible && speech && (
              <div
                key={speech.id}
                className={`ai-lab-robo__bubble ai-lab-robo__bubble--${speech.tone}`}
                role="status"
              >
                <span className="ai-lab-robo__bubble-tag">RK-01 · AI ASSISTANT</span>
                <p>{speech.text}</p>
              </div>
            )}

            <div
              ref={podRef}
              className="ai-lab-robo__pod"
              role="button"
              tabIndex={0}
              aria-label="Robot Assistant RK-01 — inspect system status"
              onClick={handlePodClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePodClick();
                }
              }}
            >
              <span className="ai-lab-robo__halo" aria-hidden />
              <span className="ai-lab-robo__antenna" aria-hidden>
                <i className={`ai-lab-robo__light${online ? " is-on" : ""}`} />
              </span>
              <span className="ai-lab-robo__dome" aria-hidden>
                <span className={`ai-lab-robo__visor${blinking ? " is-blink" : ""}`}>
                  <i className="ai-lab-robo__eye ai-lab-robo__eye--l" />
                  <i className="ai-lab-robo__eye ai-lab-robo__eye--r" />
                  <i className="ai-lab-robo__mouth" />
                </span>
              </span>
              <span className="ai-lab-robo__collar" aria-hidden />
              <span className="ai-lab-robo__base">
                <b>RK-01</b>
                <span className="ai-lab-robo__status">
                  <span className={`ai-lab-dot ${online ? "ai-lab-dot--green" : "ai-lab-dot--amber"}`} />
                  {online ? "LINKED" : "STANDBY"}
                </span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMinimized(true);
                }}
                aria-label="Minimize robot assistant"
                className="ai-lab-robo__min"
              >
                <Minus className="h-3 w-3" strokeWidth={2.25} />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}