import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowRight, Minus, MousePointer2, Plus, RotateCw, X } from "lucide-react";
import {
  WORLD_FLOOR_Y,
  WORLD_FLOW,
  WORLD_LINKS,
  WORLD_ZONES,
  getZone,
  type WorldZone,
} from "../data/digital-world";

type Vec3 = { x: number; y: number; z: number };

const ZOOM_MIN = 820;
const ZOOM_MAX = 1850;
const ZOOM_STEP = 110;
const PITCH_MIN = -14;
const PITCH_MAX = 52;
const CAMERA_START = { yaw: -26, pitch: 25, zoom: 1150 };

/** Zoom out a little further on small screens so the world fits the stage. */
function getInitialZoom() {
  if (typeof window === "undefined") return CAMERA_START.zoom;
  return window.innerWidth < 640 ? 1500 : CAMERA_START.zoom;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Style a thin plane so its local X axis runs from point `a` to point `b`.
 * Used for connectors, stalks and ground pads inside the 3D scene.
 */
function lineStyle(a: Vec3, b: Vec3, thickness: number): CSSProperties {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dy, dz) || 1;
  const yaw = (Math.atan2(-dz, Math.hypot(dx, dy)) * 180) / Math.PI;
  const pitch = (Math.atan2(dy, dx) * 180) / Math.PI;
  return {
    width: `${length}px`,
    height: `${thickness}px`,
    marginLeft: `${-length / 2}px`,
    marginTop: `${-thickness / 2}px`,
    transform: `translate3d(${(a.x + b.x) / 2}px, ${(a.y + b.y) / 2}px, ${
      (a.z + b.z) / 2
    }px) rotateZ(${pitch}deg) rotateY(${yaw}deg)`,
  };
}

function padStyle(p: Vec3): CSSProperties {
  return {
    width: "180px",
    height: "180px",
    marginLeft: "-90px",
    marginTop: "-90px",
    transform: `translate3d(${p.x}px, ${WORLD_FLOOR_Y}px, ${p.z}px) rotateX(90deg)`,
  };
}

export function DigitalWorld({ online = false }: { online?: boolean }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const camRef = useRef<HTMLSpanElement | null>(null);
  const camera = useRef({ ...CAMERA_START, zoom: getInitialZoom(), auto: true });
  const drag = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
    moved: boolean;
  } | null>(null);
  const movedRef = useRef(false);
  const autoTimer = useRef<number | null>(null);
  const camTextRef = useRef("");
  const reduced = useRef(false);

  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const apply = useCallback(() => {
    const c = camera.current;
    if (sceneRef.current) {
      sceneRef.current.style.transform = `rotateX(${c.pitch}deg) rotateY(${c.yaw}deg)`;
    }
    if (stageRef.current) {
      stageRef.current.style.perspective = `${c.zoom}px`;
    }
    if (camRef.current) {
      const yaw = ((Math.round(c.yaw) % 360) + 360) % 360;
      const text = `YAW ${String(yaw).padStart(3, "0")}° · PITCH ${Math.round(
        c.pitch,
      )}° · DOL ${Math.round((c.zoom / CAMERA_START.zoom) * 100)}%`;
      if (text !== camTextRef.current) {
        camTextRef.current = text;
        camRef.current.textContent = text;
      }
    }
  }, []);

  const pauseAuto = useCallback(() => {
    camera.current.auto = false;
    if (autoTimer.current !== null) window.clearTimeout(autoTimer.current);
  }, []);

  const resumeAuto = useCallback(() => {
    if (reduced.current) return;
    if (autoTimer.current !== null) window.clearTimeout(autoTimer.current);
    autoTimer.current = window.setTimeout(() => {
      camera.current.auto = true;
    }, 3400);
  }, []);

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    camera.current.auto = false;
    if (autoTimer.current !== null) window.clearTimeout(autoTimer.current);
    movedRef.current = false;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      yaw: camera.current.yaw,
      pitch: camera.current.pitch,
      moved: false,
    };
    stageRef.current?.classList.add("is-dragging");
  }, []);

  const handleWindowMove = useCallback(
    (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
      camera.current.yaw = d.yaw + dx * 0.32;
      camera.current.pitch = clamp(d.pitch - dy * 0.26, PITCH_MIN, PITCH_MAX);
      apply();
    },
    [apply],
  );

  const handleWindowUp = useCallback(() => {
    if (!drag.current) return;
    movedRef.current = drag.current.moved;
    drag.current = null;
    stageRef.current?.classList.remove("is-dragging");
    resumeAuto();
  }, [resumeAuto]);

  const selectZone = useCallback((id: string) => {
    if (movedRef.current) return;
    setSelected(id);
  }, []);

  const zoomStep = useCallback(
    (delta: number) => {
      camera.current.zoom = clamp(camera.current.zoom + delta, ZOOM_MIN, ZOOM_MAX);
      apply();
    },
    [apply],
  );

  const resetView = useCallback(() => {
    camera.current.yaw = CAMERA_START.yaw;
    camera.current.pitch = CAMERA_START.pitch;
    camera.current.zoom = getInitialZoom();
    apply();
  }, [apply]);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    camera.current.auto = !reduced.current;
    apply();
  }, [apply]);

  useEffect(() => {
    window.addEventListener("pointermove", handleWindowMove);
    window.addEventListener("pointerup", handleWindowUp);
    window.addEventListener("pointercancel", handleWindowUp);
    return () => {
      window.removeEventListener("pointermove", handleWindowMove);
      window.removeEventListener("pointerup", handleWindowUp);
      window.removeEventListener("pointercancel", handleWindowUp);
    };
  }, [handleWindowMove, handleWindowUp]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.current.zoom = clamp(
        camera.current.zoom + (e.deltaY > 0 ? ZOOM_STEP : -ZOOM_STEP),
        ZOOM_MIN,
        ZOOM_MAX,
      );
      apply();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [apply]);

  useEffect(() => {
    if (reduced.current) return;
    let raf = 0;
    let frame = 0;
    const loop = () => {
      frame += 1;
      if (camera.current.auto && !drag.current && frame % 2 === 0) {
        camera.current.yaw += 0.05;
        apply();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [apply]);

  useEffect(() => {
    if (hovered) pauseAuto();
    else resumeAuto();
  }, [hovered, pauseAuto, resumeAuto]);

  useEffect(
    () => () => {
      if (autoTimer.current !== null) window.clearTimeout(autoTimer.current);
    },
    [],
  );

  const core = getZone("ai-core");
  const hoveredZone = hovered ? getZone(hovered) : undefined;
  const inspected = selected ? getZone(selected) : undefined;

  return (
    <section className="ai-lab-panel ai-lab-panel--world mt-10">
      <div className="ai-lab-panel-head">
        <div className="flex min-w-0 items-center gap-3">
          <span className="ai-lab-label">AI Digital World</span>
          <span className="ai-lab-divider hidden sm:block" />
          <span className="ai-lab-value hidden text-muted-foreground sm:block">
            WRLD / 05 — Simulated environment
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
          {online ? "World active" : "World standby"}
        </span>
      </div>

      <div ref={wrapRef} className="ai-lab-world-stage-wrap">
        <div
          ref={stageRef}
          className="ai-lab-world-stage"
          style={{ perspective: `${CAMERA_START.zoom}px` }}
          onPointerDown={handlePointerDown}
        >
          <div ref={sceneRef} className="ai-lab-world-scene">
            <div className="ai-lab-world-floor" aria-hidden />
            <div className="ai-lab-world-floor-glow" aria-hidden />
            <div className="ai-lab-world-ring ai-lab-world-ring--a" aria-hidden />
            <div className="ai-lab-world-ring ai-lab-world-ring--b" aria-hidden />

            {core && (
              <WorldCore
                position={core.position}
                accent={core.accent}
                selected={selected === core.id}
                hovered={hovered === core.id}
                onSelect={selectZone}
                onHover={setHovered}
              />
            )}

            {WORLD_LINKS.map((link, i) => {
              const a = getZone(link.from);
              const b = getZone(link.to);
              if (!a || !b) return null;
              return (
                <Connector
                  key={`${link.from}-${link.to}`}
                  a={a.position}
                  b={b.position}
                  index={i}
                />
              );
            })}

            {WORLD_ZONES.filter((zone) => zone.id !== "ai-core").map((zone) => (
              <WorldNode
                key={zone.id}
                zone={zone}
                online={online}
                selected={selected}
                hovered={hovered}
                onSelect={selectZone}
                onHover={setHovered}
              />
            ))}
          </div>
        </div>

        <div className="ai-lab-world-hud">
          <div className="ai-lab-world-hud__top" aria-hidden>
            <span className="ai-lab-chip ai-lab-chip--cyan">
              <span className="ai-lab-dot ai-lab-dot--cyan" />
              Synthetic sandbox
            </span>
            <span ref={camRef} className="ai-lab-world-hud__cam" />
          </div>

          {hoveredZone && (
            <div className="ai-lab-world-hud__readout" aria-live="polite">
              <span
                className={`ai-lab-dot ai-lab-dot--${hoveredZone.accent === "blue" ? "blue" : "cyan"}`}
              />
              <span className="ai-lab-world-hud__readout-name">
                {hoveredZone.name}
              </span>
              <span className="ai-lab-world-hud__readout-tag">
                {hoveredZone.tagline}
              </span>
            </div>
          )}

          <div
            className="ai-lab-world-hud__ctrl"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="ai-lab-world-hud__btn"
              aria-label="Zoom in"
              onClick={() => zoomStep(-ZOOM_STEP)}
            >
              <Plus strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="ai-lab-world-hud__btn"
              aria-label="Zoom out"
              onClick={() => zoomStep(ZOOM_STEP)}
            >
              <Minus strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="ai-lab-world-hud__btn"
              aria-label="Reset camera"
              onClick={resetView}
            >
              <RotateCw strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      <div className="ai-lab-world-legend">
        <span className="ai-lab-world-legend__label">Data flow</span>
        <div className="ai-lab-world-legend__flow">
          {WORLD_FLOW.map((id, i) => {
            const zone = getZone(id);
            if (!zone) return null;
            return (
              <span key={id} className="ai-lab-world-legend__step">
                {i > 0 && (
                  <ArrowRight
                    className="ai-lab-world-legend__arrow"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                )}
                <button
                  type="button"
                  className={`ai-lab-world-legend__chip${
                    selected === id ? " is-selected" : ""
                  }`}
                  onClick={() => setSelected(id)}
                >
                  {zone.code}
                </button>
              </span>
            );
          })}
        </div>
        <span className="ai-lab-world-legend__hint">
          <MousePointer2 strokeWidth={1.75} />
          Drag to orbit · Scroll to zoom · Click a system
        </span>
      </div>

      <div className="ai-lab-world-inspector">
        {inspected ? (
          <WorldInspector
            zone={inspected}
            online={online}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div className="ai-lab-world-inspector__intro">
            <div>
              <p className="ai-lab-world-inspector__title">Inspect a system</p>
              <p className="ai-lab-world-inspector__desc">
                Hover the beacons to preview each system, then click one to open
                its details. The chain runs from the AI Core out through the Data
                Center, Agent Room, ERP Hub, Backend and Cloud — a fully
                synthetic, isolated simulation.
              </p>
            </div>
            <div className="ai-lab-world-inspector__stats">
              <span>
                <b>Zones</b> {WORLD_ZONES.length}
              </span>
              <span>
                <b>Links</b> {WORLD_LINKS.length}
              </span>
              <span>
                <b>State</b> {online ? "ACTIVE" : "STANDBY"}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function WorldNode({
  zone,
  online,
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  zone: WorldZone;
  online: boolean;
  selected: string | null;
  hovered: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const Icon = zone.icon;
  const active = selected === zone.id;
  const hover = hovered === zone.id;
  const className = [
    "ai-lab-world-node",
    `ai-lab-world-node--${zone.accent}`,
    active ? "is-selected" : "",
    hover ? "is-hovered" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      aria-label={`${zone.name} — ${zone.tagline}`}
      aria-pressed={active}
      className={className}
      style={{
        transform: `translate3d(${zone.position.x}px, ${zone.position.y}px, ${zone.position.z}px)`,
      }}
      onClick={() => onSelect(zone.id)}
      onPointerEnter={() => onHover(zone.id)}
      onPointerLeave={() => onHover(null)}
    >
      <span className="ai-lab-world-node__pad" style={padStyle(zone.position)} aria-hidden />
      <span
        className="ai-lab-world-node__stalk"
        style={lineStyle(zone.position, { x: zone.position.x, y: WORLD_FLOOR_Y, z: zone.position.z }, 3)}
        aria-hidden
      />
      <span className="ai-lab-world-node__face ai-lab-world-node__face--a">
        <span className="ai-lab-world-node__head">
          <Icon strokeWidth={1.75} />
          <code>{zone.code}</code>
        </span>
        <b>{zone.name}</b>
        <em>{zone.tagline}</em>
        <span
          className={`ai-lab-world-node__dot${
            online ? "" : " ai-lab-world-node__dot--standby"
          }`}
          aria-hidden
        />
      </span>
      <span className="ai-lab-world-node__face ai-lab-world-node__face--b" aria-hidden>
        <span className="ai-lab-world-node__head">
          <Icon strokeWidth={1.75} />
          <code>{zone.code}</code>
        </span>
        <b>{zone.name}</b>
        <em>{zone.tagline}</em>
        <span
          className={`ai-lab-world-node__dot${
            online ? "" : " ai-lab-world-node__dot--standby"
          }`}
          aria-hidden
        />
      </span>
    </button>
  );
}

function WorldCore({
  position,
  accent,
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  position: Vec3;
  accent: "cyan" | "blue";
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const className = [
    "ai-lab-world-core",
    `ai-lab-world-core--${accent}`,
    selected ? "is-selected" : "",
    hovered ? "is-hovered" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      aria-label="Central AI Core — the synthesis hub"
      aria-pressed={selected}
      className={className}
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, ${position.z}px)` }}
      onClick={() => onSelect("ai-core")}
      onPointerEnter={() => onHover("ai-core")}
      onPointerLeave={() => onHover(null)}
    >
      <span className="ai-lab-world-core__glow" aria-hidden />
      <span className="ai-lab-world-core__tilt ai-lab-world-core__tilt--a" aria-hidden>
        <span className="ai-lab-world-core__ring">
          <i
            className="ai-lab-world-core__dot"
            style={{ "--a": "30deg", "--r": "4.6rem" } as CSSProperties}
          />
        </span>
      </span>
      <span className="ai-lab-world-core__tilt ai-lab-world-core__tilt--b" aria-hidden>
        <span className="ai-lab-world-core__ring ai-lab-world-core__ring--b">
          <i
            className="ai-lab-world-core__dot ai-lab-world-core__dot--blue"
            style={{ "--a": "210deg", "--r": "4.6rem" } as CSSProperties}
          />
        </span>
      </span>
      <span className="ai-lab-world-core__face ai-lab-world-core__face--a">
        <span className="ai-lab-world-core__chip">
          <b>CORE</b>
          <span>SYNTHESIS NODE</span>
        </span>
      </span>
      <span className="ai-lab-world-core__face ai-lab-world-core__face--b" aria-hidden>
        <span className="ai-lab-world-core__chip">
          <b>CORE</b>
          <span>SYNTHESIS NODE</span>
        </span>
      </span>
      <span className="ai-lab-world-core__pulse" aria-hidden />
    </button>
  );
}

function Connector({ a, b, index }: { a: Vec3; b: Vec3; index: number }) {
  return (
    <span className="ai-lab-world-link" style={lineStyle(a, b, 3)} aria-hidden>
      <span className="ai-lab-world-link__core" />
      <span
        className="ai-lab-world-link__flow"
        style={{ animationDelay: `${index * -0.24}s` }}
      />
    </span>
  );
}

function WorldInspector({
  zone,
  online,
  onClose,
}: {
  zone: WorldZone;
  online: boolean;
  onClose: () => void;
}) {
  const Icon = zone.icon;
  return (
    <div
      className={`ai-lab-world-inspector__zone${
        zone.accent === "blue" ? " ai-lab-world-inspector__zone--blue" : ""
      }`}
    >
      <button
        type="button"
        className="ai-lab-world-inspector__close"
        aria-label="Close inspection"
        onClick={onClose}
      >
        <X strokeWidth={2} />
      </button>

      <div className="ai-lab-world-inspector__icon">
        <Icon strokeWidth={1.6} />
      </div>

      <div className="ai-lab-world-inspector__main">
        <div className="ai-lab-world-inspector__head">
          <div>
            <span className="ai-lab-code">WRLD / {zone.code}</span>
            <h3 className="ai-lab-world-inspector__name">{zone.name}</h3>
            <p className="ai-lab-world-inspector__tag">{zone.tagline}</p>
          </div>
          <span className="ai-lab-chip">
            <span className="ai-lab-dot ai-lab-dot--green" />
            {online ? "Operational" : "Standby"}
          </span>
        </div>

        <p className="ai-lab-world-inspector__desc">{zone.description}</p>

        <div className="ai-lab-world-inspector__rows">
        <dl className="ai-lab-world-inspector__row">
          <dt>Role</dt>
          <dd>{zone.role}</dd>
        </dl>
        <dl className="ai-lab-world-inspector__row">
          <dt>Interface</dt>
          <dd>{zone.interface_}</dd>
        </dl>
        <dl className="ai-lab-world-inspector__row">
          <dt>Detail</dt>
          <dd>{zone.detail}</dd>
        </dl>
        </div>
      </div>

      <div className="ai-lab-world-inspector__flow">
        <span className="ai-lab-world-inspector__flow-label">Flow</span>
        <div className="ai-lab-world-inspector__flow-row">
          <span className="ai-lab-chip ai-lab-chip--cyan">
            <ArrowRight className="h-3 w-3" strokeWidth={2} />
            {zone.linkIn}
          </span>
          <span className="ai-lab-chip ai-lab-chip--cyan">
            <ArrowRight className="h-3 w-3" strokeWidth={2} />
            {zone.linkOut}
          </span>
        </div>
      </div>
    </div>
  );
}
