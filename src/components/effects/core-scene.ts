import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  NormalBlending,
  PlaneGeometry,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from "three";
import { coreBridge, type CoreCircle } from "../intro/intro-bridge";

export type CoreWorld = "neutral" | "eng" | "ai";

export interface CoreScene {
  setWorld(world: CoreWorld): void;
  /** Camera push-in (~500 ms); resolves when done. */
  zoom(): Promise<void>;
  dispose(): void;
}

export interface CoreOptions {
  host: HTMLElement;
  points: number;
  /** Label elements, spread over the orbit rings and moved each frame. */
  labels: HTMLElement[];
  /** The scene can no longer run (context lost, error). */
  onFail: () => void;
}

const FOV = 42;
const CAM_Z = 5;
const MIN_VIEW_W = 3.7;
const RINGS = [
  { radius: 1.45, tiltX: 1.22, tiltZ: 0.35, speed: 0.12 },
  { radius: 1.72, tiltX: -0.95, tiltZ: -0.5, speed: -0.09 },
  { radius: 1.98, tiltX: 0.45, tiltZ: 0.9, speed: 0.07 },
] as const;

const VERT = /* glsl */ `
uniform float uEng;
uniform float uAI;
uniform float uTime;
uniform float uPixelRatio;
uniform float uScale;
uniform float uTheme;
uniform float uCamZ;
uniform vec2 uPointer;
uniform vec3 uCyan;
uniform vec3 uViolet;
uniform vec3 uPink;
uniform vec3 uPulse[5];
attribute vec3 aWire;
attribute vec3 aNeural;
attribute vec4 aSeed;
varying vec3 vCol;
varying float vA;

void main() {
  float w0 = max(0.0, 1.0 - uEng - uAI);
  vec3 p = position * w0 + aWire * uEng + aNeural * uAI;
  p *= 1.0 + 0.012 * sin(uTime * 0.9 + aSeed.z * 6.2831);
  p *= 1.0 + uAI * 0.05 * sin(uTime * 1.1 + dot(aNeural, vec3(1.7, 2.3, 1.1)));

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  gl_Position = clip;

  vec3 dir = normalize(p + vec3(0.0001));
  // Rim light: points near the silhouette (normal ~ perpendicular to the view
  // direction) glow brighter, so the cloud reads as a 3D ball, not dust.
  vec3 vn = normalize(normalMatrix * dir);
  float rim = pow(1.0 - abs(dot(vn, normalize(-mv.xyz))), 2.2);

  // Data packets travelling along great-circle arcs (positions come from a
  // small uniform array; nothing per point on the CPU).
  float pulse = 0.0;
  for (int i = 0; i < 5; i++) pulse += smoothstep(0.24, 0.0, distance(dir, uPulse[i]));
  pulse = min(pulse, 1.5);

  float near = smoothstep(0.35, 0.0, distance(clip.xy / clip.w, uPointer));
  float depth = smoothstep(-(uCamZ + 1.3), -(uCamZ - 1.3), mv.z);
  float twinkle = 1.0 + 0.22 * sin(uTime * 2.1 + aSeed.z * 40.0);
  float size = (0.024 + aSeed.y * aSeed.y * 0.03) * (1.0 + near * 0.9 + rim * 0.35 + pulse * 0.7) * (1.0 - uEng * 0.22);
  gl_PointSize = min(size * uScale * uPixelRatio / max(-mv.z, 0.1), 28.0 * uPixelRatio);

  vec3 ai = mix(uViolet, uPink, smoothstep(-1.0, 1.0, p.y * 0.8 + aSeed.w * 0.8 - 0.4));
  vec3 base = mix(uCyan * (1.0 + uEng * 0.2), ai, uAI);
  // Packets lean toward white on dark, toward a deeper tone on light.
  vCol = mix(base, mix(vec3(1.0), base * 0.55, uTheme), clamp(pulse, 0.0, 1.0) * 0.5);
  float anim = 1.0 + uAI * 0.25 * sin(uTime * 1.3 + aSeed.z * 6.2831);
  vA = mix(0.3, 1.0, depth) * (0.55 + 0.4 * near + 0.7 * rim + 0.5 * pulse) * twinkle * anim * mix(1.0, 1.25, uTheme);
}
`;

const FRAG = /* glsl */ `
uniform float uEng;
varying vec3 vCol;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 1.4 + uEng * 1.6);
  gl_FragColor = vec4(vCol, a * vA);
}
`;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function cssColor(name: string, fallback: string): Vector3 {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  let h = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw) ? raw : fallback;
  h = h.replace("#", "");
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = parseInt(h, 16);
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const nextTick = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));

/** Fibonacci sphere with a little inner volume. */
function sphereShape(n: number, seed: Float32Array): Float32Array {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const radius = seed[i * 4] < 0.85 ? 0.96 + seed[i * 4 + 1] * 0.04 : Math.cbrt(Math.random()) * 0.9;
    out[i * 3] = Math.cos(theta) * r * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return out;
}

/** Points snapped along the edges of a geodesic icosahedron. */
function wireShape(n: number, segments: Float32Array): Float32Array {
  const out = new Float32Array(n * 3);
  const edgeCount = segments.length / 6;
  for (let i = 0; i < n; i++) {
    const e = Math.floor(Math.random() * edgeCount) * 6;
    const t = Math.random();
    for (let k = 0; k < 3; k++) {
      out[i * 3 + k] = segments[e + k] + (segments[e + 3 + k] - segments[e + k]) * t;
    }
  }
  return out;
}

/** Organic, clustered, noise-displaced blob. */
function neuralShape(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  const centers = Array.from({ length: 7 }, () => {
    const v = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    return v.normalize();
  });
  const noise = (x: number, y: number, z: number) =>
    Math.sin(x * 2.1 + z) * Math.cos(y * 2.7 - x) + Math.sin(z * 3.3 + y * 1.3) * 0.5;
  const v = new Vector3();
  for (let i = 0; i < n; i++) {
    v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    let best = centers[0];
    for (const c of centers) if (v.distanceToSquared(c) < v.distanceToSquared(best)) best = c;
    v.lerp(best, 0.35).normalize();
    const radius = 0.78 + 0.26 * noise(v.x, v.y, v.z) + (Math.random() - 0.5) * 0.18;
    out[i * 3] = v.x * radius;
    out[i * 3 + 1] = v.y * radius;
    out[i * 3 + 2] = v.z * radius;
  }
  return out;
}

export async function createCore(opts: CoreOptions): Promise<CoreScene> {
  const { host, points, labels, onFail } = opts;
  const n = points;

  const seed = new Float32Array(n * 4);
  for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
  const sphere = sphereShape(n, seed);
  await nextTick();
  const ico = new WireframeGeometry(new IcosahedronGeometry(1, 1));
  const segments = ico.getAttribute("position").array as Float32Array;
  const wire = wireShape(n, segments);
  await nextTick();
  const neural = neuralShape(n);

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "absolute inset-0 h-full w-full";
  host.prepend(canvas);

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    canvas.remove();
    ico.dispose();
    throw error;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 40);
  camera.position.z = CAM_Z;
  const group = new Group();
  scene.add(group);

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(sphere, 3));
  geometry.setAttribute("aWire", new BufferAttribute(wire, 3));
  geometry.setAttribute("aNeural", new BufferAttribute(neural, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seed, 4));

  const uniforms = {
    uEng: { value: 0 },
    uAI: { value: 0 },
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uScale: { value: 1 },
    uTheme: { value: 0 },
    uCamZ: { value: CAM_Z },
    uPointer: { value: new Vector2(9, 9) },
    uCyan: { value: new Vector3() },
    uViolet: { value: new Vector3() },
    uPink: { value: new Vector3() },
    uPulse: { value: Array.from({ length: 5 }, () => new Vector3(0, 1, 0)) },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const cloud = new Points(geometry, material);
  cloud.frustumCulled = false;
  group.add(cloud);

  const lineMaterial = new LineBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const lines = new LineSegments(ico, lineMaterial);
  group.add(lines);

  // Orbit rings (thin loops) that carry the HTML labels.
  const ringMaterial = new LineBasicMaterial({
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const ringGeometries: BufferGeometry[] = [];
  const ringObjects = RINGS.map((ring) => {
    const g = new Group();
    g.rotation.set(ring.tiltX, 0, ring.tiltZ);
    const pts = new Float32Array(96 * 3);
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts[i * 3] = Math.cos(a) * ring.radius;
      pts[i * 3 + 2] = Math.sin(a) * ring.radius;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(pts, 3));
    ringGeometries.push(geo);
    g.add(new LineLoop(geo, ringMaterial));
    group.add(g);
    return g;
  });
  // Spread labels over the rings (4 / 3 / 3 for ten labels).
  const labelRing = labels.map((_, i) => i % RINGS.length);
  const labelBase = labels.map((_, i) => {
    const ring = labelRing[i];
    const onRing = labels.filter((__, j) => labelRing[j] === ring).length;
    const slot = labels.slice(0, i).filter((__, j) => labelRing[j] === ring).length;
    return (slot / onRing) * Math.PI * 2 + ring * 0.7;
  });

  // Latitude / longitude lines that turn with the sphere (hidden in the AI state).
  const gridMaterial = new LineBasicMaterial({
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const gridGeometries: BufferGeometry[] = [];
  const addLoop = (build: (a: number, out: Float32Array, i: number) => void) => {
    const pts = new Float32Array(72 * 3);
    for (let i = 0; i < 72; i++) build((i / 72) * Math.PI * 2, pts, i);
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(pts, 3));
    gridGeometries.push(geo);
    return new LineLoop(geo, gridMaterial);
  };
  for (let k = 1; k <= 6; k++) {
    const lat = ((k / 7) * 2 - 1) * (Math.PI / 2) * 0.92;
    const r = Math.cos(lat) * 1.003;
    const y = Math.sin(lat) * 1.003;
    group.add(
      addLoop((a, out, i) => {
        out[i * 3] = Math.cos(a) * r;
        out[i * 3 + 1] = y;
        out[i * 3 + 2] = Math.sin(a) * r;
      }),
    );
  }
  for (let k = 0; k < 4; k++) {
    const loop = addLoop((a, out, i) => {
      out[i * 3] = Math.cos(a) * 1.003;
      out[i * 3 + 1] = Math.sin(a) * 1.003;
      out[i * 3 + 2] = 0;
    });
    loop.rotation.y = (k / 4) * Math.PI;
    group.add(loop);
  }

  // Soft pulsing glow at the centre (a camera-facing quad with a radial fade).
  const glowMaterial = new ShaderMaterial({
    uniforms: {
      uColor: { value: new Vector3() },
      uStrength: { value: 0.5 },
      uTime: uniforms.uTime,
    },
    vertexShader: "varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader:
      "uniform vec3 uColor;\nuniform float uStrength;\nuniform float uTime;\nvarying vec2 vUv;\nvoid main() {\n  float r = length(vUv - 0.5) * 2.0;\n  float a = pow(max(0.0, 1.0 - r), 2.2);\n  gl_FragColor = vec4(uColor, a * uStrength * (0.85 + 0.15 * sin(uTime * 0.9)));\n}",
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const glowGeometry = new PlaneGeometry(3.1, 3.1);
  const glow = new Mesh(glowGeometry, glowMaterial);
  glow.renderOrder = -1;
  scene.add(glow);

  // Five packets: each travels a great circle (axis + start vector + speed).
  const pulseAxes = Array.from({ length: 5 }, (_, i) => {
    const axis = new Vector3(Math.sin(i * 2.4), Math.cos(i * 1.7), Math.sin(i * 0.9 + 1)).normalize();
    const u = new Vector3(1, 0, 0);
    if (Math.abs(axis.x) > 0.8) u.set(0, 1, 0);
    u.cross(axis).normalize();
    return { axis, u, v: new Vector3().crossVectors(axis, u), speed: 0.45 + i * 0.11, phase: i * 1.3 };
  });

  const applyTheme = () => {
    const light = !document.documentElement.classList.contains("dark");
    uniforms.uTheme.value = light ? 1 : 0;
    uniforms.uCyan.value.copy(cssColor("--cyan-accent", "#06B6D4"));
    uniforms.uViolet.value.copy(cssColor("--ai-violet", "#A78BFA"));
    uniforms.uPink.value.copy(cssColor("--ai-pink", "#F472B6"));
    const blending = light ? NormalBlending : AdditiveBlending;
    material.blending = blending;
    lineMaterial.blending = blending;
    ringMaterial.blending = blending;
    gridMaterial.blending = blending;
    glowMaterial.blending = blending;
    gridMaterial.needsUpdate = true;
    glowMaterial.needsUpdate = true;
    material.needsUpdate = true;
    lineMaterial.needsUpdate = true;
    ringMaterial.needsUpdate = true;
    const c = uniforms.uCyan.value;
    lineMaterial.color.setRGB(c.x, c.y, c.z);
    ringMaterial.color.setRGB(c.x, c.y, c.z);
    gridMaterial.color.setRGB(c.x, c.y, c.z);
    ringMaterial.opacity = light ? 0.4 : 0.22;
  };
  applyTheme();
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  let labelW = labels.map(() => 64);
  let labelH = 20;
  const measureLabels = () => {
    labelW = labels.map((el) => el.offsetWidth || 64);
    labelH = labels[0]?.offsetHeight || 20;
  };

  let width = 1;
  let height = 1;
  let resizeDirty = true;
  let camZ = CAM_Z;
  const applySize = () => {
    resizeDirty = false;
    width = host.clientWidth || 1;
    height = host.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Keep the rings inside narrow hosts: pull the camera back if needed.
    const tan = Math.tan((FOV * Math.PI) / 360);
    camZ = Math.max(CAM_Z, MIN_VIEW_W / (2 * tan * camera.aspect));
    camera.position.z = camZ;
    camera.updateProjectionMatrix();
    uniforms.uPixelRatio.value = dpr;
    uniforms.uScale.value = height / (2 * tan);
    uniforms.uCamZ.value = camZ;
    measureLabels();
  };
  applySize();
  const resizeObserver = new ResizeObserver(() => {
    resizeDirty = true;
  });
  resizeObserver.observe(host);

  // Drag to spin (horizontal only), with inertia; slight pointer parallax.
  const AUTO = 0.16;
  let spin = AUTO;
  let dragging = false;
  let lastX = 0;
  let lastT = 0;
  let tiltX = 0;
  let tiltTargetX = 0;
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true;
    window.dispatchEvent(new Event("bk:core-drag"));
    lastX = e.clientX;
    lastT = performance.now();
    host.setPointerCapture?.(e.pointerId);
  };
  const onDragMove = (e: PointerEvent) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dt = Math.max(now - lastT, 1) / 1000;
    group.rotation.y += dx * 0.008;
    spin = Math.max(-6, Math.min(6, (dx * 0.008) / dt));
    lastX = e.clientX;
    lastT = now;
  };
  const onUp = () => {
    dragging = false;
  };
  const onPointer = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    uniforms.uPointer.value.set(nx, ny);
    tiltTargetX = -ny * 0.18;
  };
  const onPointerOut = () => {
    uniforms.uPointer.value.set(9, 9);
    tiltTargetX = 0;
  };
  host.addEventListener("pointerdown", onDown);
  host.addEventListener("pointermove", onDragMove);
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointercancel", onUp);
  host.addEventListener("pointermove", onPointer, { passive: true });
  host.addEventListener("pointerleave", onPointerOut);

  let disposed = false;
  let raf = 0;
  let last = 0;
  let time = 0;
  let targetEng = 0;
  let targetAI = 0;
  let zoomAt = -1;
  let resolveZoom: (() => void) | null = null;
  let zoomTimer = 0;
  let inView = true;
  let rendered = false;
  const v = new Vector3();
  const pv = new Vector3();
  const pulseTmp = new Vector3();
  const lx = new Float32Array(labels.length);
  const ly = new Float32Array(labels.length);
  const off = new Float32Array(labels.length);
  const tgt = new Float32Array(labels.length);
  const front = new Float32Array(labels.length);

  const circle = (): CoreCircle | null => {
    const r = host.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight || r.width === 0) return null;
    const unit = r.height / (2 * camZ * Math.tan((FOV * Math.PI) / 360));
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: unit };
  };

  const fail = () => {
    if (!disposed) onFail();
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (disposed) return;
    try {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      // Idle under the entry intro (after the first frame, so hand-off is ready).
      if (rendered && coreBridge.introActive) return;
      time += dt;
      if (resizeDirty) applySize();

      const k = 1 - Math.exp(-dt * 5.5);
      uniforms.uEng.value += (targetEng - uniforms.uEng.value) * k;
      uniforms.uAI.value += (targetAI - uniforms.uAI.value) * k;
      lineMaterial.opacity = uniforms.uEng.value * (uniforms.uTheme.value ? 0.55 : 0.4);
      gridMaterial.opacity = (uniforms.uTheme.value ? 0.34 : 0.24) * (1 - uniforms.uAI.value);
      glowMaterial.uniforms.uColor.value
        .copy(uniforms.uCyan.value)
        .lerp(uniforms.uViolet.value, uniforms.uAI.value);
      glowMaterial.uniforms.uStrength.value = uniforms.uTheme.value ? 0.22 : 0.8;
      pulseAxes.forEach((pa, i) => {
        const ang = pa.phase + time * pa.speed;
        pulseTmp
          .copy(pa.u)
          .multiplyScalar(Math.cos(ang))
          .addScaledVector(pa.v, Math.sin(ang));
        uniforms.uPulse.value[i].copy(pulseTmp);
      });

      if (!dragging) {
        spin += (AUTO - spin) * (1 - Math.exp(-dt * 1.6));
        group.rotation.y += spin * dt;
      }
      tiltX += (tiltTargetX - tiltX) * (1 - Math.exp(-dt * 4));
      group.rotation.x = tiltX;
      uniforms.uTime.value = time;

      if (zoomAt >= 0) {
        const p = clamp01((now - zoomAt) / 500);
        const e = 1 - (1 - p) ** 3;
        camera.position.z = camZ * (1 - 0.5 * e);
        if (p >= 1 && resolveZoom) {
          resolveZoom();
          resolveZoom = null;
        }
      }

      // Project the labels (transform + opacity only). Labels behind the ball
      // stay readable (>= 0.45 opacity); a light separation pass keeps chips
      // from overlapping on screen.
      scene.updateMatrixWorld(true);
      labels.forEach((_, i) => {
        const ring = RINGS[labelRing[i]];
        const a = labelBase[i] + time * ring.speed;
        v.set(Math.cos(a) * ring.radius, 0, Math.sin(a) * ring.radius);
        ringObjects[labelRing[i]].localToWorld(v);
        front[i] = clamp01((v.z + 0.7) / 1.4);
        const projected = pv.copy(v).project(camera);
        lx[i] = (projected.x * width) / 2;
        ly[i] = (-projected.y * height) / 2;
        tgt[i] = 0;
      });
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const dx = Math.abs(lx[i] - lx[j]);
          const dy = ly[i] - ly[j];
          const needX = (labelW[i] + labelW[j]) / 2 + 4;
          const needY = labelH + 3;
          if (dx < needX && Math.abs(dy) < needY) {
            const push = (needY - Math.abs(dy)) / 2;
            const dir = dy === 0 ? (i < j ? 1 : -1) : Math.sign(dy);
            tgt[i] += dir * push;
            tgt[j] -= dir * push;
          }
        }
      }
      labels.forEach((el, i) => {
        off[i] += (tgt[i] - off[i]) * 0.2;
        const f = front[i];
        el.style.transform = `translate3d(${lx[i]}px,${ly[i] + off[i]}px,0) translate(-50%,-50%) scale(${0.85 + 0.15 * f})`;
        el.style.opacity = String(0.55 + 0.45 * f);
      });

      renderer.render(scene, camera);
      if (!rendered) {
        rendered = true;
        coreBridge.circle = circle;
      }
    } catch {
      fail();
    }
  };

  const sync = () => {
    const run = inView && !document.hidden;
    if (run && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const viewObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  });
  viewObserver.observe(host);
  const onLost = (e: Event) => {
    e.preventDefault();
    fail();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  document.addEventListener("visibilitychange", sync);
  sync();

  return {
    setWorld(world) {
      targetEng = world === "eng" ? 1 : 0;
      targetAI = world === "ai" ? 1 : 0;
    },
    zoom() {
      return new Promise<void>((resolve) => {
        zoomAt = performance.now();
        resolveZoom = resolve;
        // The loop can be paused (hidden tab); never hold navigation longer.
        zoomTimer = window.setTimeout(() => {
          resolveZoom?.();
          resolveZoom = null;
          // Navigation may not have happened (cancelled): ease back after a beat.
          zoomTimer = window.setTimeout(() => {
            zoomAt = -1;
            camera.position.z = camZ;
          }, 1500);
        }, 560);
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(zoomTimer);
      if (coreBridge.circle === circle) coreBridge.circle = null;
      resizeObserver.disconnect();
      viewObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onDragMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      host.removeEventListener("pointermove", onPointer);
      host.removeEventListener("pointerleave", onPointerOut);
      canvas.removeEventListener("webglcontextlost", onLost);
      geometry.dispose();
      material.dispose();
      ico.dispose();
      lineMaterial.dispose();
      ringMaterial.dispose();
      ringGeometries.forEach((g) => g.dispose());
      gridGeometries.forEach((g) => g.dispose());
      gridMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      resolveZoom?.();
      resolveZoom = null;
    },
  };
}
