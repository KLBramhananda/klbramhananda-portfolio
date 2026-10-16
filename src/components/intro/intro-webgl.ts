import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { IntroScene, IntroSceneOptions } from "./IntroGate";
import type { CoreCircle } from "./intro-bridge";

const WORD = "BRAMHA";
const FONT_FAMILY = '"Inter", "Geist", "SF Pro Display", ui-sans-serif, system-ui, sans-serif';
const FOV = 45;
const CAM_Z = 10;
const VIS_H = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360);
const LAYERS = 6;
const LAYER_GAP = 0.11;
const WORD_Y = 0.5;
const TILT_MAX = (10 * Math.PI) / 180;
const LINE_NODES = 240;
// Site navy base (dark theme `--background`), the exit's colour hand-off target.
const NAVY = [11 / 255, 20 / 255, 33 / 255] as const;
const CARBON = [11 / 255, 12 / 255, 12 / 255] as const;

const COMMON = /* glsl */ `
uniform float uProgress;
uniform float uExplode;
uniform float uTime;
uniform float uSweep;
uniform float uPixelRatio;
uniform float uScale;
uniform float uAlpha;
uniform float uPower;
uniform float uHandoff;
uniform vec3 uCenter;
uniform float uRadius;
uniform vec2 uPointer;
uniform vec2 uTilt;
attribute vec3 aStart;
attribute vec3 aTarget;
attribute vec4 aSeed;
varying float vBand;
varying float vBright;
varying float vAlpha;
varying float vEdge;

float easeOutBack(float t) {
  float x = t - 1.0;
  return 1.0 + 2.15 * x * x * x + 1.15 * x * x;
}

vec3 place(out float local) {
  local = clamp((uProgress - aSeed.y * 0.4) / 0.6, 0.0, 1.0);
  float e = easeOutBack(local);
  float s = aSeed.x * 40.0;
  vec3 drift = vec3(sin(uTime * 0.35 + s), cos(uTime * 0.42 + s * 1.7), sin(uTime * 0.28 + s * 2.3));
  vec3 p = mix(aStart + drift * 0.7, aTarget + drift * 0.035, e);

  vec2 dir = normalize(p.xy + vec2(0.0001, 0.0));
  p.xy += dir * uExplode * (1.5 + aSeed.x * 3.0);
  p.z += uExplode * uExplode * (8.0 + aSeed.x * 18.0);

  float cy = cos(uTilt.y), sy = sin(uTilt.y), cx = cos(uTilt.x), sx = sin(uTilt.x);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);

  vec2 d = p.xy - uPointer;
  float l = length(d);
  float push = smoothstep(1.3, 0.0, l);
  p.xy += (d / (l + 0.0001)) * push * push * 0.9 * local * uPower;

  // Hand-off: compress onto the Core's on-screen sphere.
  vec3 sph = uCenter + normalize(aStart + vec3(0.0001)) * uRadius * (0.8 + 0.2 * aSeed.x);
  p = mix(p, sph, uHandoff);
  return p;
}

float band(vec3 p) {
  float d = (dot(p.xy, vec2(0.906, 0.423)) - uSweep) / 0.8;
  return exp(-d * d);
}
`;

const POINTS_VERT = /* glsl */ `
${COMMON}
void main() {
  float local;
  vec3 p = place(local);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float b = band(p) * local;
  float edge = step(1.0, aSeed.w);
  vBand = b;
  vEdge = edge;
  // Edge points glow; interior points are dimmer; points further back dim too.
  vBright = aSeed.w * (0.5 + 0.5 * aSeed.z);
  vAlpha = uAlpha * (0.3 + 0.7 * local) * (1.0 - uExplode * 0.6);
  float size = (0.017 + aSeed.x * 0.02 + b * 0.022) * mix(0.62, 1.0, edge);
  size *= (1.0 + uExplode * 1.5) * (1.0 - 0.25 * uHandoff);
  gl_PointSize = min(size * uScale * uPixelRatio / max(-mv.z, 0.1), 48.0 * uPixelRatio);
}
`;

const POINTS_FRAG = /* glsl */ `
uniform vec3 uAccent;
uniform vec3 uWhite;
varying float vBand;
varying float vBright;
varying float vAlpha;
varying float vEdge;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 2.0);
  vec3 col = mix(uWhite, uAccent, clamp(vEdge * 0.7 + vBand * 0.9, 0.0, 1.0)) * vBright * (1.0 + vBand * 1.4);
  gl_FragColor = vec4(col, a * vAlpha);
}
`;

const LINES_VERT = /* glsl */ `
${COMMON}
void main() {
  float local;
  vec3 p = place(local);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  float flick = 0.5 + 0.5 * sin(uTime * (3.0 + aSeed.x * 5.0) + aSeed.x * 30.0);
  vBand = 0.0;
  vBright = 1.0;
  vEdge = 0.0;
  vAlpha = uAlpha * (1.0 - smoothstep(0.0, 0.3, uProgress)) * (0.25 + 0.75 * flick) * 0.35 * (1.0 - uExplode);
}
`;

const LINES_FRAG = /* glsl */ `
uniform vec3 uAccent;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(uAccent, vAlpha);
}
`;

function hexToVec3(hex: string): Vector3 {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = parseInt(h, 16);
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function randomInSphere(): [number, number, number] {
  for (;;) {
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    const z = Math.random() * 2 - 1;
    if (x * x + y * y + z * z <= 1) return [x, y, z];
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const rgbHex = (r: number, g: number, b: number) =>
  (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);

async function loadFont(): Promise<void> {
  try {
    await Promise.race([
      document.fonts.load(`800 120px ${FONT_FAMILY}`),
      new Promise<void>((resolve) => window.setTimeout(resolve, 800)),
    ]);
  } catch {
    // Fall back to whatever system font the canvas resolves.
  }
}

/** Samples the word into `count` points: x in word-widths, y in word-widths, z in layer steps. */
function sampleWord(count: number): { norm: Float32Array; seed: Float32Array } {
  const W = 1000;
  const probe = document.createElement("canvas");
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");

  const spacing = (size: number) => `${(size * 0.03).toFixed(2)}px`;
  ctx.font = `800 200px ${FONT_FAMILY}`;
  ctx.letterSpacing = spacing(200);
  const size = (200 * W * 0.96) / ctx.measureText(WORD).width;
  const H = Math.ceil(size * 1.2);
  probe.width = W;
  probe.height = H;
  ctx.font = `800 ${size}px ${FONT_FAMILY}`;
  ctx.letterSpacing = spacing(size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText(WORD, W / 2, H / 2);
  const { data } = ctx.getImageData(0, 0, W, H);

  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < W && y < H && data[(y * W + x) * 4 + 3] > 128;
  const edges: number[] = [];
  const fills: number[] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (!solid(x, y)) continue;
      const edge = !solid(x - 4, y) || !solid(x + 4, y) || !solid(x, y - 4) || !solid(x, y + 4);
      (edge ? edges : fills).push(y * W + x);
    }
  }
  if (edges.length + fills.length === 0) throw new Error("empty word sample");

  const norm = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const pickEdge = fills.length === 0 || (edges.length > 0 && Math.random() < 0.62);
    const list = pickEdge ? edges : fills;
    const idx = list[Math.floor(Math.random() * list.length)];
    const x = (idx % W) + (Math.random() - 0.5) * 2;
    const y = Math.floor(idx / W) + (Math.random() - 0.5) * 2;
    const layer =
      pickEdge && Math.random() < 0.65
        ? Math.random() < 0.5
          ? 0
          : LAYERS - 1
        : Math.floor(Math.random() * LAYERS);
    norm[i * 3] = x / W - 0.5;
    norm[i * 3 + 1] = -(y - H / 2) / W;
    norm[i * 3 + 2] = layer - (LAYERS - 1) / 2;
    seed[i * 4] = Math.random();
    seed[i * 4 + 1] = clamp01((x / W) * 0.78 + Math.random() * 0.22);
    seed[i * 4 + 2] = layer / (LAYERS - 1);
    seed[i * 4 + 3] = pickEdge ? 1.3 : 0.55;
  }
  return { norm, seed };
}

export async function startWebGL(opts: IntroSceneOptions): Promise<IntroScene> {
  const { host, high, accent, white, onDegrade } = opts;
  const count = high ? 12000 : 5000;
  const dprCap = high ? 1.75 : 1.5;

  await loadFont();
  const { norm, seed } = sampleWord(count);

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "absolute inset-0 h-full w-full";
  host.appendChild(canvas);

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch (error) {
    canvas.remove();
    throw error;
  }
  renderer.setClearColor(0x0b0b0c, 1);

  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.z = CAM_Z;
  const scene = new Scene();

  const start = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [x, y, z] = randomInSphere();
    start[i * 3] = x * 7;
    start[i * 3 + 1] = y * 4.5;
    start[i * 3 + 2] = z * 4;
  }
  const target = new Float32Array(count * 3);

  const startAttr = new BufferAttribute(start, 3);
  const targetAttr = new BufferAttribute(target, 3);
  const pointsGeo = new BufferGeometry();
  pointsGeo.setAttribute("position", startAttr);
  pointsGeo.setAttribute("aStart", startAttr);
  pointsGeo.setAttribute("aTarget", targetAttr);
  pointsGeo.setAttribute("aSeed", new BufferAttribute(seed, 4));

  const uniforms = {
    uProgress: { value: 0 },
    uExplode: { value: 0 },
    uTime: { value: 0 },
    uSweep: { value: -100 },
    uPixelRatio: { value: 1 },
    uScale: { value: 1 },
    uAlpha: { value: 0 },
    uPower: { value: 0 },
    uHandoff: { value: 0 },
    uCenter: { value: new Vector3(0, 0, 0) },
    uRadius: { value: 1 },
    uPointer: { value: new Vector2(99, 99) },
    uTilt: { value: new Vector2(0, 0) },
    uAccent: { value: hexToVec3(accent) },
    uWhite: { value: hexToVec3(white) },
  };

  const pointsMat = new ShaderMaterial({
    uniforms,
    vertexShader: POINTS_VERT,
    fragmentShader: POINTS_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const points = new Points(pointsGeo, pointsMat);
  points.frustumCulled = false;
  scene.add(points);

  // Faint accent lines between nearby start positions (high tier only).
  let lineGeo: BufferGeometry | null = null;
  let lineMat: ShaderMaterial | null = null;
  let lineTarget: BufferAttribute | null = null;
  let lineIdx: Uint16Array | null = null;
  if (high) {
    const nodes = Array.from({ length: LINE_NODES }, () => Math.floor(Math.random() * count));
    const pairs: number[] = [];
    for (const a of nodes) {
      const near: { d: number; b: number }[] = [];
      for (const b of nodes) {
        if (a === b) continue;
        const dx = start[a * 3] - start[b * 3];
        const dy = start[a * 3 + 1] - start[b * 3 + 1];
        const dz = start[a * 3 + 2] - start[b * 3 + 2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < 3.2) near.push({ d, b });
      }
      near.sort((p, q) => p.d - q.d);
      for (const { b } of near.slice(0, 2)) pairs.push(a, b);
    }
    lineIdx = Uint16Array.from(pairs);
    const lStart = new Float32Array(lineIdx.length * 3);
    const lSeed = new Float32Array(lineIdx.length * 4);
    lineIdx.forEach((p, i) => {
      lStart.set(start.subarray(p * 3, p * 3 + 3), i * 3);
      lSeed.set(seed.subarray(p * 4, p * 4 + 4), i * 4);
    });
    const lStartAttr = new BufferAttribute(lStart, 3);
    lineTarget = new BufferAttribute(new Float32Array(lineIdx.length * 3), 3);
    lineGeo = new BufferGeometry();
    lineGeo.setAttribute("position", lStartAttr);
    lineGeo.setAttribute("aStart", lStartAttr);
    lineGeo.setAttribute("aTarget", lineTarget);
    lineGeo.setAttribute("aSeed", new BufferAttribute(lSeed, 4));
    lineMat = new ShaderMaterial({
      uniforms,
      vertexShader: LINES_VERT,
      fragmentShader: LINES_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });
    const lines = new LineSegments(lineGeo, lineMat);
    lines.frustumCulled = false;
    scene.add(lines);
  }

  let visW = VIS_H;
  let builtAspect = 0;
  const writeTargets = (worldW: number) => {
    const zScale = LAYER_GAP * (worldW / 10);
    for (let i = 0; i < count; i++) {
      target[i * 3] = norm[i * 3] * worldW;
      target[i * 3 + 1] = norm[i * 3 + 1] * worldW + WORD_Y;
      target[i * 3 + 2] = norm[i * 3 + 2] * zScale;
    }
    targetAttr.needsUpdate = true;
    if (lineIdx && lineTarget) {
      const arr = lineTarget.array as Float32Array;
      lineIdx.forEach((p, i) => arr.set(target.subarray(p * 3, p * 3 + 3), i * 3));
      lineTarget.needsUpdate = true;
    }
  };

  let resizeDirty = true;
  const applySize = () => {
    resizeDirty = false;
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uPixelRatio.value = dpr;
    uniforms.uScale.value = h / (2 * Math.tan((FOV * Math.PI) / 360));
    visW = VIS_H * camera.aspect;
    if (builtAspect === 0 || Math.abs(camera.aspect - builtAspect) / builtAspect > 0.12) {
      builtAspect = camera.aspect;
      writeTargets(visW * 0.7);
    }
  };
  applySize();

  const resizeObserver = new ResizeObserver(() => {
    resizeDirty = true;
  });
  resizeObserver.observe(host);

  // Pointer parallax / repulsion. Touch devices only fire moves while dragging.
  const pointerTarget = new Vector2(99, 99);
  const tiltTarget = new Vector2(0, 0);
  let powerTarget = 0;
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    pointerTarget.set((nx * visW) / 2, (ny * VIS_H) / 2);
    tiltTarget.set(-ny * TILT_MAX, nx * TILT_MAX);
    powerTarget = 1;
  };
  const onLeave = () => {
    powerTarget = 0;
    tiltTarget.set(0, 0);
  };
  const onPointerEnd = (e: PointerEvent) => {
    if (e.pointerType === "touch") onLeave();
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onPointerEnd, { passive: true });
  window.addEventListener("pointercancel", onPointerEnd, { passive: true });
  window.addEventListener("blur", onLeave);
  document.documentElement.addEventListener("pointerleave", onLeave);

  let disposed = false;
  let raf = 0;
  let last = 0;
  let time = opts.startAt;
  let enterAt = -1;
  let exitDur = 0.7;
  let handoff = false;
  let resolveEnter: (() => void) | null = null;
  let winStart = 0;
  let winFrames = 0;

  const degrade = () => {
    if (!disposed) onDegrade();
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (disposed) return;
    try {
      const real = now - last;
      last = now;
      const dt = Math.min(real / 1000, 0.25);
      time += dt;
      if (resizeDirty) applySize();

      winFrames++;
      if (winStart === 0) winStart = now;
      if (now - winStart >= 1000) {
        const fps = (winFrames * 1000) / (now - winStart);
        if (time - opts.startAt > 1.5 && fps < 30) {
          degrade();
          return;
        }
        winStart = now;
        winFrames = 0;
      }

      const kp = 1 - Math.exp(-14 * dt);
      const kt = 1 - Math.exp(-5 * dt);
      uniforms.uPointer.value.lerp(pointerTarget, kp);
      uniforms.uTilt.value.lerp(tiltTarget, kt);
      uniforms.uPower.value += (powerTarget - uniforms.uPower.value) * kp;

      const range = visW * 0.5 * 0.906 + 1.2;
      let sweep = -100;
      if (time >= 2.2) {
        const phase = (time - 2.2) % 6;
        if (phase < 1.4) {
          const t = phase / 1.4;
          sweep = -range + 2 * range * (t * t * (3 - 2 * t));
        }
      }
      uniforms.uTime.value = time;
      uniforms.uAlpha.value = clamp01(time / 0.6);
      uniforms.uProgress.value = clamp01((time - 0.6) / 1.6);
      uniforms.uSweep.value = sweep;
      if (enterAt >= 0) {
        const p = clamp01((time - enterAt) / exitDur);
        if (handoff) {
          uniforms.uHandoff.value = p * p * (3 - 2 * p);
        } else {
          uniforms.uExplode.value = p * p;
        }
        // Last 500 ms: carbon -> site navy, so the colour carries into Home.
        const k = clamp01((p * exitDur - (exitDur - 0.5)) / 0.5);
        renderer.setClearColor(
          rgbHex(
            CARBON[0] + (NAVY[0] - CARBON[0]) * k,
            CARBON[1] + (NAVY[1] - CARBON[1]) * k,
            CARBON[2] + (NAVY[2] - CARBON[2]) * k,
          ),
          1,
        );
        if (p >= 1 && resolveEnter) {
          resolveEnter();
          resolveEnter = null;
        }
      }
      renderer.render(scene, camera);
    } catch {
      degrade();
    }
  };

  const startLoop = () => {
    if (raf || disposed) return;
    last = performance.now();
    winStart = 0;
    winFrames = 0;
    raf = requestAnimationFrame(frame);
  };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      startLoop();
    }
  };
  const onLost = (e: Event) => {
    e.preventDefault();
    degrade();
  };
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);
  startLoop();

  return {
    enter(target?: CoreCircle) {
      if (enterAt < 0) {
        enterAt = time;
        if (target) {
          const r = host.getBoundingClientRect();
          const nx = ((target.x - r.left) / r.width) * 2 - 1;
          const ny = -(((target.y - r.top) / r.height) * 2 - 1);
          uniforms.uCenter.value.set((nx * visW) / 2, (ny * VIS_H) / 2, 0);
          uniforms.uRadius.value = target.r * (VIS_H / r.height);
          handoff = true;
          exitDur = 0.8;
          powerTarget = 0;
          tiltTarget.set(0, 0);
        }
      }
      return new Promise<void>((resolve) => {
        resolveEnter = resolve;
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
      window.removeEventListener("blur", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      pointsGeo.dispose();
      pointsMat.dispose();
      lineGeo?.dispose();
      lineMat?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      resolveEnter?.();
      resolveEnter = null;
    },
  };
}
