let ctx: AudioContext | null | undefined;

type ToneOpts = {
  freq: number;
  at: number;
  dur: number;
  gain: number;
  type?: OscillatorType;
};

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  if (ctx === undefined) {
    try {
      ctx = new AudioContext();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
  return ctx;
}

function tone(context: AudioContext, { freq, at, dur, gain, type = "sine" }: ToneOpts) {
  const osc = context.createOscillator();
  const g = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, context.currentTime + at);
  g.gain.setValueAtTime(0.0001, context.currentTime + at);
  g.gain.exponentialRampToValueAtTime(gain, context.currentTime + at + 0.024);
  g.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + at + dur);
  osc.connect(g);
  g.connect(context.destination);
  osc.start(context.currentTime + at);
  osc.stop(context.currentTime + at + dur + 0.05);
}

export function playWakeSound() {
  const context = getContext();
  if (!context) return;
  tone(context, { freq: 196, at: 0, dur: 0.9, gain: 0.035 });
  tone(context, { freq: 392, at: 0, dur: 0.9, gain: 0.02 });
  tone(context, { freq: 784, at: 0.7, dur: 0.35, gain: 0.016, type: "triangle" });
  tone(context, { freq: 1175, at: 1.5, dur: 0.5, gain: 0.014, type: "triangle" });
}

export function playOnlineSound() {
  const context = getContext();
  if (!context) return;
  tone(context, { freq: 523.25, at: 0, dur: 0.4, gain: 0.03, type: "sine" });
  tone(context, { freq: 783.99, at: 0.18, dur: 0.6, gain: 0.028, type: "sine" });
  tone(context, { freq: 1046.5, at: 0.36, dur: 0.9, gain: 0.02, type: "triangle" });
}

export function playEnterSound() {
  const context = getContext();
  if (!context) return;
  const osc = context.createOscillator();
  const g = context.createGain();
  const t0 = context.currentTime;
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, t0);
  osc.frequency.exponentialRampToValueAtTime(680, t0 + 0.9);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.045, t0 + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1);
  osc.connect(g);
  g.connect(context.destination);
  osc.start(t0);
  osc.stop(t0 + 1.05);
  tone(context, { freq: 1318.5, at: 0.28, dur: 0.7, gain: 0.012, type: "triangle" });
  tone(context, { freq: 1975.5, at: 0.42, dur: 0.6, gain: 0.009, type: "triangle" });
}