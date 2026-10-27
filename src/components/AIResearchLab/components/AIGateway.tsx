import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  BookOpen,
  Bot,
  Database,
  LayoutGrid,
  ScanEye,
  Server,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import humanAiBgVideo from "@/assets/animation-videos/human-ai-bg-video.mp4";
import { playEnterSound, playOnlineSound, playWakeSound } from "../lib/boot-sound";
import { markGatewaySeen } from "../data/rooms";
import "../styles/ai-world.css";

const GATE_NODES: readonly { name: string; code: string; icon: LucideIcon }[] = [
  { name: "Perception", code: "PER", icon: ScanEye },
  { name: "Memory", code: "MEM", icon: Database },
  { name: "Knowledge", code: "KNW", icon: BookOpen },
  { name: "Agent Runtime", code: "AGT", icon: Bot },
  { name: "Tool System", code: "TLS", icon: Wrench },
  { name: "Backend", code: "BKE", icon: Server },
  { name: "ERP Interface", code: "ERP", icon: LayoutGrid },
];

const HOLD_MS = 1800;
const DRAIN_MS = 400;
const NODE_STAGGER_MS = 120;
/** Module boot (7 x 120ms) plus about 1.2s of rest before the gateway fades out. */
const ONLINE_REST_MS = GATE_NODES.length * NODE_STAGGER_MS + 1200;
const FADE_MS = 600;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

function useReducedMotionPref() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * The gateway: one action, "hold to connect". Holding the chip fills a ring
 * over 1.8s and plays the background video; at full the fingers touch (spark +
 * ripple), the modules boot in around the chip, and AI World opens.
 *
 * Nothing per frame goes through React state: the rAF loop writes the ring's
 * rotations, the status text and the video imperatively.
 */
export function AIGateway({
  leaving,
  onLeave,
  onDone,
}: {
  leaving: boolean;
  onLeave: () => void;
  onDone: () => void;
}) {
  const reduced = useReducedMotionPref();
  const [online, setOnline] = useState(false);
  const [held, setHeld] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ringR = useRef<HTMLSpanElement | null>(null);
  const ringL = useRef<HTMLSpanElement | null>(null);
  const stateRef = useRef<HTMLElement | null>(null);
  const prog = useRef(0);
  const holding = useRef(false);
  const done = useRef(false);
  const raf = useRef(0);
  const last = useRef(0);
  const pct = useRef(-1);
  const sounded = useRef(false);
  const timers = useRef<number[]>([]);

  // Keep the page-transition overlay and cursor effects out of the way while
  // the gateway is on screen (same lock the old wake screen used).
  useEffect(() => {
    if (leaving) return;
    const el = document.documentElement;
    el.classList.add("bk-transition-lock");
    return () => el.classList.remove("bk-transition-lock");
  }, [leaving]);

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(onDone, FADE_MS);
    return () => window.clearTimeout(t);
  }, [leaving, onDone]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const finish = useCallback(() => {
    if (done.current && leaving) return;
    done.current = true;
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    markGatewaySeen();
    if (!reduced) playEnterSound();
    // Release focus before the overlay becomes aria-hidden.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    onLeave();
  }, [leaving, onLeave, reduced]);

  const apply = (p: number) => {
    const deg = p * 360;
    if (ringR.current) ringR.current.style.transform = `rotate(${Math.min(deg, 180) - 180}deg)`;
    if (ringL.current) ringL.current.style.transform = `rotate(${Math.max(0, deg - 180)}deg)`;
    const n = Math.round(p * 100);
    if (n !== pct.current && stateRef.current && !done.current) {
      pct.current = n;
      stateRef.current.textContent = n > 0 ? `CONNECTING… ${n}%` : "DORMANT";
    }
  };

  const complete = () => {
    done.current = true;
    holding.current = false;
    raf.current = 0;
    apply(1);
    playOnlineSound();
    setHeld(false);
    setOnline(true);
    timers.current.push(window.setTimeout(finish, ONLINE_REST_MS));
  };

  const tick = (now: number) => {
    const dt = Math.min(250, now - last.current);
    last.current = now;
    const p = clamp01(prog.current + (holding.current ? dt / HOLD_MS : -dt / DRAIN_MS));
    prog.current = p;
    apply(p);
    if (p >= 1) {
      complete();
      return;
    }
    if (p <= 0 && !holding.current) {
      raf.current = 0;
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    if (raf.current || done.current) return;
    last.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  const press = () => {
    if (done.current || reduced || holding.current) return;
    holding.current = true;
    setHeld(true);
    if (!sounded.current) {
      sounded.current = true;
      playWakeSound();
    }
    // The scrub-friendly copy isn't available, so the original plays while held.
    void videoRef.current?.play().catch(() => {
      /* playback blocked: the ring and status still run */
    });
    startLoop();
  };

  const release = () => {
    if (!holding.current) return;
    holding.current = false;
    setHeld(false);
    videoRef.current?.pause();
    startLoop();
  };

  // Esc skips straight to AI World.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !leaving) finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, leaving]);

  const state = online ? "is-active" : held ? "is-booting" : "is-dormant";

  return (
    <div
      aria-hidden={leaving}
      className={`ai-lab-wake aw-gw${leaving ? " ai-lab-wake--hidden" : ""}${online ? " aw-gw--online" : ""}`}
    >
      <div className="ai-lab-wake__bg" aria-hidden>
        <video
          ref={videoRef}
          className="ai-lab-boot__video-media"
          src={humanAiBgVideo}
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
        />
        <div className="ai-lab-wake__grid" />
        <div className="aw-gw__overlay" />
      </div>

      <button type="button" onClick={finish} className="aw-skip">
        Skip intro →
      </button>

      <div className="aw-stage">
        <div className="aw-ringbox">
          {online && (
            <ul className="aw-gring" aria-label="Modules online">
              {GATE_NODES.map((n, i) => {
                const Icon = n.icon;
                return (
                  <li
                    key={n.code}
                    className="aw-gnode"
                    style={
                      {
                        "--a": `${-90 + (i * 360) / GATE_NODES.length}deg`,
                        "--i": i,
                      } as CSSProperties
                    }
                  >
                    <span aria-hidden className="aw-gline" />
                    <span className="aw-gchip">
                      <span className="aw-gchip__in">
                        <Icon strokeWidth={1.6} aria-hidden />
                        <b>{n.name}</b>
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            aria-label="Hold to connect to the AI core"
            aria-describedby="aw-gate-hint"
            className="ai-lab-boot__core-wrap aw-core"
            onPointerDown={(e) => {
              if (e.button !== 0 && e.pointerType === "mouse") return;
              e.currentTarget.setPointerCapture(e.pointerId);
              press();
            }}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
            onKeyDown={(e) => {
              if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                e.preventDefault();
                press();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") release();
            }}
            onBlur={release}
            onClick={() => {
              // Reduced motion: a single press wakes it, no hold needed.
              if (reduced) finish();
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span aria-hidden className="aw-ring">
              <span className="aw-ring__half aw-ring__half--r">
                <span ref={ringR} className="aw-ring__arc" style={{ transform: "rotate(-180deg)" }} />
              </span>
              <span className="aw-ring__half aw-ring__half--l">
                <span ref={ringL} className="aw-ring__arc" />
              </span>
            </span>

            <span aria-hidden className={`ai-lab-boot__rig ${state}`}>
              <span className="ai-lab-boot__ring ai-lab-boot__ring--a" />
              <span className="ai-lab-boot__ring ai-lab-boot__ring--b" />
              <span className="ai-lab-boot__ring ai-lab-boot__ring--c" />
              <span className="ai-lab-boot__orbit ai-lab-boot__orbit--a">
                <i className="ai-lab-boot__orbit-ring">
                  <i className="ai-lab-boot__orb ai-lab-boot__orb--1" />
                  <i className="ai-lab-boot__orb ai-lab-boot__orb--2" />
                </i>
              </span>
              <span className="ai-lab-boot__orbit ai-lab-boot__orbit--b">
                <i className="ai-lab-boot__orbit-ring">
                  <i className="ai-lab-boot__orb ai-lab-boot__orb--3" />
                  <i className="ai-lab-boot__orb ai-lab-boot__orb--4" />
                </i>
              </span>
              <span className="ai-lab-boot__chip">
                <span className="ai-lab-boot__die">
                  <b>BK·AI</b>
                  <i>CORE L0</i>
                </span>
              </span>
              <span className="ai-lab-boot__pulse" />
            </span>
          </button>

          {online && !reduced && (
            <>
              <span aria-hidden className="aw-spark" />
              <span aria-hidden className="aw-ripple" />
            </>
          )}
        </div>

        <div className="aw-copy">
          <p className="ai-lab-boot__eyebrow">BK AI RESEARCH LAB</p>
          <h1 className="ai-lab-boot__title">AI CORE</h1>
          <div className="ai-lab-boot__status" aria-live="polite">
            <span>STATUS:</span>
            <strong
              ref={stateRef}
              className={`ai-lab-boot__state ${online ? "aw-state--online" : "ai-lab-boot__state--dormant"}`}
            >
              {online ? "SYSTEM ONLINE · AI CORE ACTIVE" : "DORMANT"}
            </strong>
          </div>
          {!online && (
            <p id="aw-gate-hint" className="aw-hint">
              {reduced ? "Press the core to connect" : "Press and hold the core to connect"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
