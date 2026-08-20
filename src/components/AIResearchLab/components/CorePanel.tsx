import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AI_RESEARCH_MODULES } from "../data/modules";
import { usePauseAnimations } from "../../effects/use-pause-animations";

type Point = { x: number; y: number };

const ORBIT_A = [0, 52, 104, 156, 208, 260, 312];
const ORBIT_B = [28, 104, 180, 256];

function layout(width: number, height: number): Point[] {
  const rX = Math.max(18, Math.min(36, (width / 2 - 170) / width) * 100);
  const rY = Math.max(13, Math.min(rX * 0.8, ((height / 2 - 84) / height) * 100));
  return AI_RESEARCH_MODULES.map((_, i) => {
    const angle = ((i * 40 + 20) * Math.PI) / 180;
    return { x: 50 + rX * Math.cos(angle), y: 51 + rY * Math.sin(angle) };
  });
}

export function CorePanel({ online = false }: { online?: boolean }) {
  const visibleRef = useRef(true);
  const rootRef = usePauseAnimations<HTMLElement>((visible) => {
    visibleRef.current = visible;
  });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const coreRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 1200, h: 620 });
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        setSize({ w, h });
        setCompact(w < 700);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const core = coreRef.current;
    const stage = stageRef.current;
    if (!core || !stage) return;

    const MAX_TILT = 8;
    let raf = 0;
    let tiltX = 0;
    let tiltY = 0;
    let targetX = 0;
    let targetY = 0;
    let hovering = false;

    const applyFrame = () => {
      core.style.transform = `translate(-50%, -50%) rotateY(${tiltX.toFixed(3)}deg) rotateX(${tiltY.toFixed(3)}deg)`;
      const perX = (hovering ? tiltX : 0) / MAX_TILT;
      const perY = (hovering ? tiltY : 0) / -MAX_TILT;
      core.style.setProperty("--per-x", perX.toFixed(3));
      core.style.setProperty("--per-y", perY.toFixed(3));
    };

    const tick = () => {
      raf = 0;
      tiltX += (targetX - tiltX) * 0.07;
      tiltY += (targetY - tiltY) * 0.07;
      applyFrame();
      if (visibleRef.current && (Math.abs(targetX - tiltX) > 0.005 || Math.abs(targetY - tiltY) > 0.005)) {
        raf = requestAnimationFrame(tick);
      }
    };

    const ensureLoop = () => {
      if (raf === 0) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const px = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      const py = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
      targetX = px * MAX_TILT;
      targetY = py * -MAX_TILT;
      hovering = true;
      if (visibleRef.current) ensureLoop();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      hovering = false;
      ensureLoop();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      core.style.transform = "translate(-50%, -50%)";
      return;
    }

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const points = layout(size.w, size.h);

  return (
    <section ref={rootRef} className="ai-lab-panel ai-lab-panel--core mt-10">
      <div className="ai-lab-panel-head">
        <div className="flex min-w-0 items-center gap-3">
          <span className="ai-lab-label">Central AI Core</span>
          <span className="ai-lab-divider hidden sm:block" />
          <span className="ai-lab-value hidden text-muted-foreground sm:block">
            ARC / 01 — Synthesis hub
          </span>
        </div>
        <span
          className={`ai-lab-chip${online ? " ai-lab-chip--online" : " ai-lab-chip--green"}`}
        >
          <span
            className={`ai-lab-dot ${
              online ? "ai-lab-dot--green" : "ai-lab-dot--amber"
            }`}
          />
          {online ? "AI core active" : "Standby"}
        </span>
      </div>

      <div
        ref={stageRef}
        className={`ai-lab-core-stage${compact ? " ai-lab-core-stage--compact" : ""}${
          online ? " ai-lab-core-stage--online" : ""
        }`}
      >
        <div className="ai-lab-core-fx" />

        {!compact && (
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="ai-lab-core-lines"
          >
            {points.map((p, i) => (
              <line
                key={`ln-${AI_RESEARCH_MODULES[i].id}`}
                x1="50"
                y1="51"
                x2={p.x}
                y2={p.y}
              />
            ))}
            {points.map((p, i) => (
              <circle
                key={`dot-${AI_RESEARCH_MODULES[i].id}`}
                cx={p.x}
                cy={p.y}
                r={1.25}
              />
            ))}
          </svg>
        )}

        <div
          ref={coreRef}
          className="ai-lab-core"
          aria-label="Central AI Core — robotic neural core"
        >
          <span className="ai-lab-core__shell" aria-hidden />

          <span className="ai-lab-core__gyro" aria-hidden>
            <i className="ai-lab-core__ring ai-lab-core__ring--a" />
            <i className="ai-lab-core__ring ai-lab-core__ring--b" />
            <i className="ai-lab-core__ring ai-lab-core__ring--c" />
          </span>

          <span className="ai-lab-core__orbit ai-lab-core__orbit--a" aria-hidden>
            <span className="ai-lab-core__orbit-ring">
              {ORBIT_A.map((a, idx) => (
                <i
                  key={idx}
                  className={`ai-lab-core__p${idx === 0 ? " ai-lab-core__p--lead" : ""}`}
                  style={{ "--a": `${a}deg`, "--r": "4.1rem" } as CSSProperties}
                />
              ))}
            </span>
          </span>

          <span className="ai-lab-core__orbit ai-lab-core__orbit--b" aria-hidden>
            <span className="ai-lab-core__orbit-ring">
              {ORBIT_B.map((a, idx) => (
                <i
                  key={idx}
                  className="ai-lab-core__p ai-lab-core__p--dim"
                  style={{ "--a": `${a}deg`, "--r": "2.6rem" } as CSSProperties}
                />
              ))}
            </span>
          </span>

          <span className="ai-lab-core__chip" aria-hidden>
            <i className="ai-lab-core__die">
              <b>CORE</b>
              <span>SYNTHESIS NODE</span>
            </i>
          </span>

          <span className="ai-lab-core__retina" aria-hidden />
          <span className="ai-lab-core__pulse" />
        </div>

        {!compact &&
          points.map((p, i) => {
            const module = AI_RESEARCH_MODULES[i];
            const Icon = module.icon;
            const blue = module.accent === "blue";
            return (
              <div
                key={module.id}
                title={module.name}
                className={`ai-lab-module-node${blue ? " ai-lab-module-node--blue" : ""}`}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <Icon strokeWidth={1.75} />
                <code>{module.code}</code>
                <span className={`ai-lab-dot ${blue ? "ai-lab-dot--cyan" : "ai-lab-dot--green"}`} />
              </div>
            );
          })}

        {compact && (
          <div className="ai-lab-core-mini" aria-label="Surrounding system modules">
            {AI_RESEARCH_MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <span key={module.id} className="ai-lab-core-chip">
                  <Icon strokeWidth={1.75} />
                  {module.code}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="ai-lab-core-readout">
        <span>
          <b>Modules linked</b> 09
        </span>
        <span className="ai-lab-divider" />
        <span>
          <b>Active</b> {online ? "01" : "00"}
        </span>
        <span className="ai-lab-divider" />
        <span>
          <b>System load</b> {online ? "4%" : "0%"}
        </span>
        <span className="ai-lab-divider" />
        <span>
          <b>Status</b>
          <span className="ai-lab-dot ai-lab-dot--green" style={{ marginLeft: 5 }} />
        </span>
      </div>
    </section>
  );
}