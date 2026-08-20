import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Bot,
  Brain,
  Database,
  LayoutGrid,
  Power,
  Rocket,
  ScanEye,
  Server,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import humanAiBgVideo from "@/assets/animation-videos/human-ai-bg-video.mp4";
import { BootNetwork } from "./BootNetwork";
import { playEnterSound, playOnlineSound, playWakeSound } from "../lib/boot-sound";

export type LabPhase = "dormant" | "initializing" | "online";

type BootNode = {
  name: string;
  code: string;
  role: string;
  icon: LucideIcon;
};

const INIT_ITEMS: readonly BootNode[] = [
  { name: "Neural Core", code: "NRL", role: "Neural Processing", icon: Brain },
  { name: "Perception", code: "PER", role: "Perception", icon: ScanEye },
  { name: "Memory", code: "MEM", role: "Memory", icon: Database },
  { name: "Knowledge", code: "KNW", role: "Knowledge", icon: BookOpen },
  { name: "Agent Runtime", code: "AGT", role: "Agents", icon: Bot },
  { name: "Tool System", code: "TLS", role: "Tools", icon: Wrench },
  { name: "Backend", code: "BKE", role: "Backend", icon: Server },
  { name: "ERP Interface", code: "ERP", role: "ERP", icon: LayoutGrid },
];

const STEP_MS = 190;
const ENTER_MS = 1300;

const NODES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

function BootCore({ phase }: { phase: LabPhase }) {
  const state =
    phase === "dormant" ? "is-dormant" : phase === "online" ? "is-active" : "is-booting";

  return (
    <div className={`ai-lab-boot__rig ${state}`} aria-hidden>
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

      {NODES.map((deg, i) => (
        <span
          key={deg}
          className={`ai-lab-boot__node ai-lab-boot__node--${deg}`}
          style={
            {
              "--a": `${deg}deg`,
              "--d": `${i * 0.14}s`,
            } as React.CSSProperties
          }
        />
      ))}

      <span className="ai-lab-boot__streak ai-lab-boot__streak--1" />
      <span className="ai-lab-boot__streak ai-lab-boot__streak--2" />
      <span className="ai-lab-boot__streak ai-lab-boot__streak--3" />
      <span className="ai-lab-boot__streak ai-lab-boot__streak--4" />

      <span className="ai-lab-boot__chip">
        <span className="ai-lab-boot__die">
          <b>BK·AI</b>
          <i>CORE L0</i>
        </span>
      </span>
      <span className="ai-lab-boot__pulse" />
    </div>
  );
}

export function WakeSystem({
  phase,
  onWake,
  onEntered,
}: {
  phase: LabPhase;
  onWake: () => void;
  onEntered?: () => void;
}) {
  const [item, setItem] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [entering, setEntering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const playTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const startedPlaybackRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionPrefChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onMotionPrefChange);
    return () => mq.removeEventListener("change", onMotionPrefChange);
  }, []);

  useEffect(
    () => () => {
      if (playTimerRef.current !== null) window.clearTimeout(playTimerRef.current);
      if (enterTimerRef.current !== null) window.clearTimeout(enterTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    const el = document.documentElement;
    if (hidden) {
      el.classList.remove("bk-transition-lock");
      return;
    }
    el.classList.add("bk-transition-lock");
    return () => el.classList.remove("bk-transition-lock");
  }, [hidden]);

  const videoActive = !hidden && !reducedMotion;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion || hidden) {
      video.pause();
      return;
    }
    if (startedPlaybackRef.current) return;
    playTimerRef.current = window.setTimeout(() => {
      if (reducedMotion || hidden) return;
      startedPlaybackRef.current = true;
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Autoplay blocked while buffering — the static gradient below stays.
        });
      }
    }, 500);
  }, [videoActive, reducedMotion, hidden, phase]);

  useEffect(() => {
    if (phase !== "initializing") return;
    const startedAt = performance.now();
    const iv = window.setInterval(() => {
      const idx = Math.min(
        INIT_ITEMS.length,
        Math.floor((performance.now() - startedAt) / STEP_MS) + 1,
      );
      setItem(idx);
    }, 80);
    return () => window.clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase !== "online") return;
    playOnlineSound();
  }, [phase]);

  const handleWake = () => {
    if (phase !== "dormant" || entering) return;
    playWakeSound();
    onWake();
  };

  const handleEnter = () => {
    if (phase !== "online" || entering) return;
    setEntering(true);
    playEnterSound();
    enterTimerRef.current = window.setTimeout(() => {
      // Release focus before the overlay becomes aria-hidden — React throws if
      // an element inside an aria-hidden subtree still holds focus.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setHidden(true);
      onEntered?.();
    }, ENTER_MS);
  };

  return (
    <div
      aria-hidden={hidden}
      className={`ai-lab-wake${hidden ? " ai-lab-wake--hidden" : ""}${
        entering ? " ai-lab-boot--entering" : ""
      }`}
    >
      <div className="ai-lab-wake__bg" aria-hidden>
        {videoActive && (
          <video
            ref={videoRef}
            className="ai-lab-boot__video-media"
            src={humanAiBgVideo}
            muted
            loop
            playsInline
            preload="auto"
            autoPlay
            tabIndex={-1}
          />
        )}
        <div className="ai-lab-wake__grid" />
        <div className="ai-lab-wake__glow ai-lab-wake__glow--c" />
        <div className="ai-lab-wake__glow ai-lab-wake__glow--b" />
        <div className="ai-lab-boot__particles ai-lab-boot__particles--far" />
        <div className="ai-lab-boot__particles ai-lab-boot__particles--near" />
        <div className="ai-lab-boot__horizon" />
        <div className="ai-lab-boot__video-overlay" />
      </div>

      <div className="ai-lab-boot__stage">
        <div className="ai-lab-boot__core-wrap">
          <BootCore phase={phase} />
        </div>

        {phase === "dormant" && (
          <div className="ai-lab-boot__dormant">
            <p className="ai-lab-boot__eyebrow">BK AI RESEARCH LAB</p>
            <h1 className="ai-lab-boot__title">AI CORE</h1>
            <div className="ai-lab-boot__status">
              <span>STATUS:</span>
              <strong className="ai-lab-boot__state ai-lab-boot__state--dormant">
                DORMANT
              </strong>
            </div>
            <button
              type="button"
              onClick={handleWake}
              className="ai-lab-boot__btn ai-lab-boot__btn--wake"
            >
              <Power className="h-4 w-4" strokeWidth={2} />
              <span>[ WAKE SYSTEM ]</span>
            </button>
            <p className="ai-lab-boot__hint">
              Activate the AI research core to enter the lab
            </p>
          </div>
        )}

        {phase === "initializing" && (
          <div className="ai-lab-boot__init">
            <p className="ai-lab-boot__init-head">
              <span>INITIALIZING AI CORE</span>
              <span className="animate-caret text-cyan-accent" aria-hidden>
                ▍
              </span>
            </p>
            <div className="ai-lab-boot__feed" aria-hidden>
              <i className="ai-lab-boot__feed-pulse" />
            </div>
            <BootNetwork item={item} />
          </div>
        )}

        {phase === "online" && (
          <div className="ai-lab-boot__online">
            <p className="ai-lab-boot__sys">SYSTEM ONLINE</p>
            <p className="ai-lab-boot__core-active">
              <span className="ai-lab-boot__active-dot" aria-hidden />
              AI CORE ACTIVE
            </p>
            <button
              type="button"
              onClick={handleEnter}
              className="ai-lab-boot__btn ai-lab-boot__btn--enter"
            >
              <Rocket className="h-4 w-4" strokeWidth={2} />
              <span>[ ENTER AI WORLD ]</span>
            </button>
            <p className="ai-lab-boot__hint">
              Step through the gateway into the AI Research Lab
            </p>
          </div>
        )}
      </div>

      <div className="ai-lab-boot__tunnel" aria-hidden />
      <div className="ai-lab-boot__flash" aria-hidden />
    </div>
  );
}