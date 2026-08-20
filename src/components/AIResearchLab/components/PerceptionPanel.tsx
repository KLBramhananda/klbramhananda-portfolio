import { useEffect, useRef, useState } from "react";
import { Bot, Database, Eye, Plug, Radar, Server, type LucideIcon } from "lucide-react";
import { usePauseAnimations } from "../../effects/use-pause-animations";

type LabObject = {
  id: string;
  name: string;
  classification: string;
  confidence: number;
  icon: LucideIcon;
  accent: "cyan" | "blue" | "green" | "amber";
};

const LAB_OBJECTS: LabObject[] = [
  { id: "data-node", name: "DATA NODE", classification: "Information Store", confidence: 99.1, icon: Database, accent: "cyan" },
  { id: "agent-node", name: "AGENT NODE", classification: "Autonomous Agent", confidence: 99.0, icon: Bot, accent: "blue" },
  { id: "erp-node", name: "ERP NODE", classification: "Enterprise System", confidence: 99.2, icon: Server, accent: "green" },
  { id: "api-node", name: "API NODE", classification: "Interface Gateway", confidence: 98.9, icon: Plug, accent: "amber" },
];

const CURSOR_CONFIDENCE = 98.6;
const IDLE_MS = 380;
const TICK_MS = 110;

export function PerceptionPanel() {
  const visibleRef = useRef(true);
  const rootRef = usePauseAnimations<HTMLElement>((visible) => {
    visibleRef.current = visible;
  });
  const lastMoveRef = useRef(0);
  const targetConfRef = useRef(CURSOR_CONFIDENCE);
  const acquiredRef = useRef(false);

  const [detected, setDetected] = useState<LabObject | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [acquired, setAcquired] = useState(false);
  const [interaction, setInteraction] = useState<"Move" | "Hover">("Move");
  const [confidence, setConfidence] = useState(CURSOR_CONFIDENCE);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let px = 0;
    let py = 0;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      px = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      py = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      lastMoveRef.current = performance.now();
      setPosition({ x: Math.round(px), y: Math.round(py) });
      if (!acquiredRef.current) {
        acquiredRef.current = true;
        setAcquired(true);
      }
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerover", onMove);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerover", onMove);
    };
  }, [rootRef]);

  useEffect(() => {
    const iv = window.setInterval(() => {
      if (!visibleRef.current) return;
      const target = targetConfRef.current;
      setConfidence((current) => {
        const delta = target - current;
        const next = current + delta * 0.16 + (Math.random() - 0.5) * 0.05;
        const band = 0.12;
        if (next > target + band) return target + band;
        if (next < target - band) return target - band;
        return next;
      });
      setInteraction(performance.now() - lastMoveRef.current > IDLE_MS ? "Hover" : "Move");
    }, TICK_MS);
    return () => window.clearInterval(iv);
  }, []);

  const handleEnter = (node: LabObject) => {
    targetConfRef.current = node.confidence;
    setConfidence(93.5);
    setDetected(node);
  };

  const handleLeave = () => {
    targetConfRef.current = CURSOR_CONFIDENCE;
    setConfidence(CURSOR_CONFIDENCE - 3.5);
    setDetected(null);
  };

  const status = !acquired ? "ACQUIRING" : detected ? "ANALYZING" : "TRACKING";
  const conf = confidence.toFixed(1);

  return (
    <section ref={rootRef} className="ai-lab-perception">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="ai-lab-label">AI Perception</h2>
        <span className="text-xs text-muted-foreground">
          Synthetic vision · pointer simulation
        </span>
      </div>

      <div className="ai-lab-perception-grid mt-5">
        <aside className="ai-lab-perception-readout">
          <div
            className={`ai-lab-perception-head${
              detected ? " ai-lab-perception-head--detect" : ""
            }`}
          >
            {detected ? (
              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
            ) : (
              <Radar className="h-3.5 w-3.5" strokeWidth={1.75} />
            )}
            {detected ? "OBJECT DETECTED" : "AI PERCEPTION"}
          </div>

          <div className="ai-lab-perception-body" key={detected?.id ?? "cursor"}>
            {detected ? (
              <>
                <div className="ai-lab-perception-row ai-lab-perception-row--hot">
                  <span>Object</span>
                  <b>{detected.name}</b>
                </div>
                <div className="ai-lab-perception-row">
                  <span>Classification</span>
                  <b>{detected.classification}</b>
                </div>
                <div className="ai-lab-perception-row ai-lab-perception-row--hot">
                  <span>Confidence</span>
                  <b>{conf}%</b>
                </div>
              </>
            ) : (
              <>
                <div className="ai-lab-perception-row">
                  <span>Object</span>
                  <b>Cursor</b>
                </div>
                <div className="ai-lab-perception-row">
                  <span>Position</span>
                  <b>
                    {acquired ? `${position.x} × ${position.y}` : "-- × --"}
                  </b>
                </div>
                <div className="ai-lab-perception-row">
                  <span>Interaction</span>
                  <b>{interaction}</b>
                </div>
                <div className="ai-lab-perception-row">
                  <span>Confidence</span>
                  <b>{conf}%</b>
                </div>
              </>
            )}

            <div className="ai-lab-perception-row ai-lab-perception-row--status">
              <span>Status</span>
              <b>
                <span
                  className={`ai-lab-dot ${
                    status === "TRACKING"
                      ? "ai-lab-dot--green"
                      : status === "ANALYZING"
                        ? "ai-lab-dot--cyan"
                        : "ai-lab-dot--amber"
                  }`}
                />
                {status}
              </b>
            </div>
          </div>

          <p className="ai-lab-perception-note">
            Visual simulation · pointer tracking only
          </p>
        </aside>

        <div className="ai-lab-perception-field">
          <span className="ai-lab-perception-radar" aria-hidden />

          {LAB_OBJECTS.map((node) => {
            const Icon = node.icon;
            const active = detected?.id === node.id;
            return (
              <button
                key={node.id}
                type="button"
                title={`${node.name} — ${node.classification}`}
                className={`ai-lab-perception-node ai-lab-perception-node--${node.accent}${
                  active ? " ai-lab-perception-node--detected" : ""
                }`}
                onPointerEnter={() => handleEnter(node)}
                onPointerLeave={handleLeave}
                onFocus={() => handleEnter(node)}
                onBlur={handleLeave}
              >
                <Icon strokeWidth={1.75} />
                <span className="ai-lab-perception-node__name">{node.name}</span>
                <span className="ai-lab-perception-node__cls">
                  {node.classification}
                </span>
                <span className="ai-lab-perception-node__tag">
                  {active ? "SEEN" : "SCAN"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}