import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { onScrollFrame } from "../layout/use-nav-scroll";

// Damped pendulum around the pin: θ'' = -(g/L)·sin θ - c·θ' + impulse.
const W0_SQ = 9.5; // g/L  (period ≈ 2 s)
const DAMPING = 0.85; // c
const STEP = 1 / 120; // fixed integration step (s)
const MAX_THETA = (35 * Math.PI) / 180;
const EPS_THETA = 0.0012;
const EPS_OMEGA = 0.012;
const TAP_SLOP = 6; // px of pointer travel that still counts as a tap

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface PhysicsRefs {
  stage: RefObject<HTMLElement | null>;
  swing: RefObject<HTMLElement | null>;
  shadow: RefObject<HTMLElement | null>;
  cable: RefObject<SVGPathElement | null>;
  reduced: boolean;
  onTap: () => void;
}

/**
 * Hanging-badge physics, custom (no library). θ is the angle from straight down,
 * positive toward the right. The loop runs only while the badge is moving: it
 * sleeps once |θ| and |θ'| are tiny, and wakes on drag, hover, key, or scroll.
 * Transform only (plus the cable path's `d`); the shadow's blur is never animated.
 */
export function useBadgePhysics({ stage, swing, shadow, cable, reduced, onTap }: PhysicsRefs) {
  const s = useRef({
    theta: 0,
    omega: 0,
    raf: 0,
    running: false,
    last: 0,
    acc: 0,
    dragging: false,
    moved: false,
    startX: 0,
    startY: 0,
    pinX: 0,
    pinY: 0,
    width: 0,
    inView: false,
    samples: [] as { t: number; theta: number }[],
  });
  const tapRef = useRef(onTap);
  useEffect(() => {
    tapRef.current = onTap;
  }, [onTap]);

  const paint = useRef(() => {});
  const wake = useRef(() => {});

  useEffect(() => {
    const st = s.current;
    const swingEl = swing.current;
    const stageEl = stage.current;
    if (!swingEl || !stageEl) return;

    const draw = () => {
      swingEl.style.transform = `rotate(${-st.theta}rad)`;
      const sh = shadow.current;
      if (sh) {
        sh.style.transform = `translateX(${Math.sin(st.theta) * st.width * 0.55}px) scaleX(${1 - 0.12 * Math.abs(st.theta)})`;
      }
      // The cable bends against the swing direction.
      const bend = clamp(-st.omega * 5, -14, 14);
      cable.current?.setAttribute("d", `M30 0 Q${30 + bend} 55 30 100`);
    };
    paint.current = draw;

    const tick = (now: number) => {
      const dt = Math.min((now - st.last) / 1000, 0.05);
      st.last = now;
      st.acc += dt;
      while (st.acc >= STEP) {
        st.omega += (-W0_SQ * Math.sin(st.theta) - DAMPING * st.omega) * STEP;
        st.theta += st.omega * STEP;
        if (Math.abs(st.theta) > MAX_THETA) {
          st.theta = Math.sign(st.theta) * MAX_THETA;
          st.omega *= -0.3;
        }
        st.acc -= STEP;
      }
      draw();
      if (Math.abs(st.theta) < EPS_THETA && Math.abs(st.omega) < EPS_OMEGA) {
        st.theta = 0;
        st.omega = 0;
        draw();
        st.running = false; // sleep: no rAF at rest
        return;
      }
      st.raf = requestAnimationFrame(tick);
    };

    wake.current = () => {
      if (reduced || st.running || st.dragging) return;
      st.running = true;
      st.last = performance.now();
      st.acc = 0;
      st.raf = requestAnimationFrame(tick);
    };

    const measure = () => {
      st.width = swingEl.offsetWidth;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(swingEl);
    const io = new IntersectionObserver(([e]) => {
      st.inView = e.isIntersecting;
    });
    io.observe(stageEl);

    // Scroll gives a gentle, capped nudge (from the shared scroll loop).
    const offScroll = reduced
      ? () => {}
      : onScrollFrame(({ dy, dt }) => {
          if (!st.inView || st.dragging) return;
          const v = (dy / dt) * 1000; // px/s
          if (Math.abs(v) < 250) return;
          if (Math.abs(st.omega) < 1.3) {
            st.omega += clamp(v * 0.00004, -0.04, 0.04);
            wake.current();
          }
        });

    return () => {
      cancelAnimationFrame(st.raf);
      st.running = false;
      ro.disconnect();
      io.disconnect();
      offScroll();
    };
  }, [stage, swing, shadow, cable, reduced]);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const st = s.current;
    const stageEl = stage.current;
    if (!stageEl) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = stageEl.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    st.pinX = r.left + r.width / 2;
    st.pinY = r.top + rem * 0.9;
    st.dragging = true;
    st.moved = false;
    st.startX = e.clientX;
    st.startY = e.clientY;
    st.samples = [];
    cancelAnimationFrame(st.raf);
    st.running = false;
    st.omega = 0;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const st = s.current;
    if (!st.dragging) return;
    if (!st.moved && Math.hypot(e.clientX - st.startX, e.clientY - st.startY) >= TAP_SLOP) {
      st.moved = true;
    }
    if (!st.moved || reduced) return;
    st.theta = clamp(Math.atan2(e.clientX - st.pinX, e.clientY - st.pinY), -MAX_THETA, MAX_THETA);
    const now = performance.now();
    st.samples.push({ t: now, theta: st.theta });
    while (st.samples.length > 2 && now - st.samples[0].t > 100) st.samples.shift();
    paint.current();
  };

  const endDrag = (tap: boolean) => {
    const st = s.current;
    if (!st.dragging) return;
    st.dragging = false;
    if (!st.moved) {
      if (tap) tapRef.current();
      return;
    }
    // Throw: angular velocity from the last ~100 ms of pointer motion.
    const a = st.samples[0];
    const b = st.samples[st.samples.length - 1];
    if (a && b && b.t > a.t) {
      st.omega = clamp(((b.theta - a.theta) / (b.t - a.t)) * 1000, -9, 9);
    }
    wake.current();
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: () => endDrag(true),
    onPointerCancel: () => endDrag(false),
    onPointerEnter: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse" || reduced) return;
      s.current.omega += clamp(e.movementX * 0.004, -0.7, 0.7);
      wake.current();
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (reduced || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      e.preventDefault();
      s.current.omega += e.key === "ArrowRight" ? 2.4 : -2.4;
      wake.current();
    },
  };
}
