import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Activity,
  ArrowRight,
  Gauge,
  Inbox,
  Loader2,
  Server,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { emitLabEvent } from "../../lib/lab-events";

/**
 * High Traffic — Experiment 05.
 *
 * A simulated load test: drag the traffic level and watch the load balancer
 * spread requests across service instances, spill into the queue, drop excess
 * work and auto-scale instances to keep up. All synthetic — no real traffic.
 */

const SLOTS = ["api-1", "api-2", "api-3", "api-4", "api-5", "api-6", "api-7"];
const BASE_ACTIVE = 4;
const CAPACITY = 3000;
const QUEUE_LIMIT = 2500;
const TICK_MS = 260;

const PRESETS = [
  { id: "idle", label: "Idle", rps: 1000 },
  { id: "normal", label: "Normal", rps: 2500 },
  { id: "spike", label: "Spike", rps: 7000 },
  { id: "stress", label: "Stress", rps: 11000 },
];

type SlotStatus = "active" | "warming" | "cooling" | "off";

type InstanceState = {
  slot: number;
  id: string;
  status: SlotStatus;
  req: number;
  util: number;
  latency: number;
  ticks: number;
};

type ScaleEvent = { id: number; text: string; tone: "up" | "down" };

function initInstances(): InstanceState[] {
  return SLOTS.map((id, slot) => ({
    slot,
    id,
    status: slot < BASE_ACTIVE ? "active" : "off",
    req: 0,
    util: 0,
    latency: 34,
    ticks: 0,
  }));
}

function statusMeta(util: number): { label: string; tone: string } {
  if (util < 0.7) return { label: "Healthy", tone: "green" };
  if (util < 0.9) return { label: "Elevated", tone: "amber" };
  return { label: "Near capacity", tone: "red" };
}

export function TrafficExperiment() {
  const reducedRef = useRef(false);
  const eventIdRef = useRef(1);

  const [rps, setRps] = useState(2500);
  const [instances, setInstances] = useState<InstanceState[]>(initInstances);
  const [metrics, setMetrics] = useState({
    queued: 0,
    drops: 0,
    avgUtil: 0,
    active: BASE_ACTIVE,
    saturation: 0,
  });
  const [events, setEvents] = useState<ScaleEvent[]>([]);

  const rpsRef = useRef(rps);
  const instRef = useRef(instances);
  const queueRef = useRef({ queued: 0, drops: 0 });
  const dropWarnedRef = useRef(false);

  useEffect(() => {
    rpsRef.current = rps;
  }, [rps]);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const runScaleTick = (list: InstanceState[]) => {
      const active = list.filter((i) => i.status === "active");
      if (active.length === 0) return;
      const avgUtil = active.reduce((sum, i) => sum + i.util, 0) / active.length;

      const warming = list.filter((i) => i.status === "warming");
      const cooling = list.filter((i) => i.status === "cooling");

      if (avgUtil > 0.82 && warming.length === 0) {
        const off = list.find((i) => i.status === "off");
        if (off) {
          off.status = "warming";
          off.ticks = Math.round(2100 / TICK_MS);
          setEvents((prev) =>
            [
              {
                id: eventIdRef.current++,
                text: `Scale out → ${off.id} (2.1s)`,
                tone: "up",
              },
              ...prev,
            ].slice(0, 5),
          );
          emitLabEvent({ type: "experiment:success", id: "traffic", name: "High Traffic", tone: "ok" });
        }
      }

      if (avgUtil < 0.42 && cooling.length === 0) {
        const extraActive = list
          .filter((i) => i.status === "active" && i.slot >= BASE_ACTIVE)
          .sort((a, b) => b.slot - a.slot);
        if (extraActive.length > 0) {
          const target = extraActive[0];
          target.status = "cooling";
          target.ticks = Math.round(1600 / TICK_MS);
          setEvents((prev) =>
            [
              {
                id: eventIdRef.current++,
                text: `Scale in ← ${target.id} (1.6s)`,
                tone: "down",
              },
              ...prev,
            ].slice(0, 5),
          );
        }
      }

      for (const entry of list) {
        if (entry.status === "warming" || entry.status === "cooling") {
          entry.ticks -= 1;
          if (entry.ticks <= 0) {
            entry.status = entry.status === "warming" ? "active" : "off";
            entry.req = 0;
            entry.util = 0;
          }
        }
      }
    };

    const tick = () => {
      const rpsNow = rpsRef.current;
      const list = instRef.current;
      const active = list.filter((i) => i.status === "active");
      if (active.length === 0) return;

      const capacity = active.length * CAPACITY;
      const overflow = Math.max(0, rpsNow - capacity);
      const share = rpsNow / active.length;

      for (let s = 0; s < list.length; s += 1) {
        const entry = list[s];
        if (entry.status !== "active") continue;
        const variance = ((entry.slot * 13) % 7 - 3) / 100;
        const target = Math.max(0, share * (1 + variance));
        entry.req += (target - entry.req) * 0.5;
        entry.util = Math.min(1, entry.req / CAPACITY);
        entry.latency = Math.round(34 + Math.pow(entry.util, 4) * 520);
      }

      const q = queueRef.current;
      if (overflow > 0) q.queued = Math.min(QUEUE_LIMIT * 2, q.queued + overflow * 0.24);
      else q.queued = Math.max(0, q.queued - CAPACITY * 0.1);
      if (q.queued > QUEUE_LIMIT) {
        const overage = (q.queued - QUEUE_LIMIT) / QUEUE_LIMIT;
        q.drops += Math.max(0, rpsNow - capacity) * 0.4 * overage;
      }
      if (q.drops > 0 && !dropWarnedRef.current) {
        dropWarnedRef.current = true;
        emitLabEvent({
          type: "experiment:warning",
          id: "traffic",
          name: "High Traffic",
          tone: "warn",
          detail: "Requests are dropping — the queue is at capacity",
        });
      } else if (q.drops === 0 && dropWarnedRef.current) {
        dropWarnedRef.current = false;
      }

      runScaleTick(list);

      const stillActive = list.filter((i) => i.status === "active");
      const avgUtil =
        stillActive.length > 0
          ? stillActive.reduce((sum, i) => sum + i.util, 0) / stillActive.length
          : 0;

      instRef.current = list;
      setInstances([...list]);
      setMetrics({
        queued: Math.min(Math.round(q.queued), QUEUE_LIMIT * 2),
        drops: Math.round(q.drops),
        avgUtil,
        active: stillActive.length,
        saturation: Math.min(1, rpsNow / capacity),
      });
    };

    const iv = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(iv);
  }, []);

  const activeCount = metrics.active;
  const utilization = Math.round(metrics.avgUtil * 100);
  const dotCount = Math.min(10, Math.floor(rps / 1100));

  return (
    <div className="ai-lab-expt-exp" aria-label="High Traffic experiment">
      <div className="ai-lab-load-top">
        <div className="ai-lab-load-control">
          <div className="ai-lab-load-control__head">
            <span className="ai-lab-load-control__title">
              <Gauge className="h-4 w-4" strokeWidth={1.75} />
              Simulated traffic
            </span>
            <span className="ai-lab-load-control__value">
              {rps.toLocaleString()}
              <em> req/s</em>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={12000}
            step={250}
            value={rps}
            onChange={(e) => setRps(Number(e.target.value))}
            aria-label="Simulated requests per second"
            className="ai-lab-load-slider"
          />
          <div className="ai-lab-load-presets" aria-label="Traffic presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setRps(preset.rps)}
                aria-pressed={rps === preset.rps}
                className={`ai-lab-tools-preset${
                  rps === preset.rps ? " is-selected" : ""
                }`}
              >
                {preset.label} · {preset.rps.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="ai-lab-load-balancer">
          <header className="ai-lab-load-balancer__head">
            <span className="ai-lab-tools-composer__title">
              <Zap className="h-4 w-4" strokeWidth={1.75} />
              Load balancer
            </span>
            <span className="ai-lab-load-balancer__rate">
              <b>{rps.toLocaleString()}</b> in
            </span>
          </header>
          <div className="ai-lab-load-stream" aria-hidden>
            {Array.from({ length: dotCount }, (_, i) => (
              <i key={i} style={{ "--d": `${i * 0.08}s` } as CSSProperties} />
            ))}
          </div>
          <div className="ai-lab-load-balancer__foot">
            <span>
              Round-robin to <b>{activeCount}</b> instances
            </span>
            <span className="ai-lab-expt-load-bal-live">
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              distributing
            </span>
          </div>
        </div>
      </div>

      <div className="ai-lab-expt-load-grid">
        <div className="ai-lab-expt-col">
          <div className="ai-lab-load-instances">
            <header className="ai-lab-tools-composer__head ai-lab-load-instances__head">
              <span className="ai-lab-tools-composer__title">
                <Server className="h-4 w-4" strokeWidth={1.75} />
                Service instances
              </span>
              <span className="ai-lab-tools-tools__hint">
                capacity {CAPACITY.toLocaleString()} req/s each · simulated
              </span>
            </header>

            <div className="ai-lab-load-instance-list">
              {instances.map((instance) => {
                if (instance.status === "off") return null;
                const meta = statusMeta(instance.util);
                const warming = instance.status === "warming";
                const cooling = instance.status === "cooling";
                const pct = Math.max(2, Math.round(instance.util * 100));
                return (
                  <div
                    key={instance.id}
                    className={`ai-lab-load-instance ai-lab-load-instance--${meta.tone}${
                      warming ? " is-warming" : cooling ? " is-cooling" : ""
                    }`}
                  >
                    <header className="ai-lab-load-instance__head">
                      <span className="ai-lab-load-instance__name">{instance.id}</span>
                      <span
                        className={`ai-lab-load-instance__chip ai-lab-load-instance__chip--${meta.tone}`}
                      >
                        {warming ? (
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                        ) : cooling ? (
                          <Activity className="h-3 w-3" aria-hidden />
                        ) : (
                          <span className="ai-lab-dot ai-lab-dot--green" />
                        )}
                        {warming
                          ? "Provisioning"
                          : cooling
                            ? "Draining"
                            : instance.status === "active"
                              ? meta.label
                              : "—"}
                      </span>
                    </header>
                    <div className="ai-lab-load-instance__row">
                      <div className="ai-lab-load-instance__m">
                        <b>{Math.round(instance.req).toLocaleString()}</b>
                        <em>req/s</em>
                      </div>
                      <div className="ai-lab-load-instance__m">
                        <b>{instance.latency}ms</b>
                        <em>p95 latency</em>
                      </div>
                    </div>
                    <div className="ai-lab-load-instance__track" aria-hidden>
                      <i style={{ width: `${pct}%` }} />
                    </div>
                    <footer className="ai-lab-load-instance__foot">
                      <span>Utilization</span>
                      <b>{warming || cooling ? "--" : `${pct}%`}</b>
                    </footer>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="ai-lab-expt-col ai-lab-expt-rag-side">
          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <Activity className="h-3.5 w-3.5" strokeWidth={1.75} />
                Fleet metrics
              </span>
              <span className="ai-lab-tools-console__id">
                {Math.round(metrics.saturation * 100)}% SAT
              </span>
            </header>
            <dl className="ai-lab-tools-console__rows">
              <div className="ai-lab-tools-console__row">
                <dt>Incoming</dt>
                <dd>{rps.toLocaleString()} req/s</dd>
              </div>
              <div className="ai-lab-tools-console__row">
                <dt>Active instances</dt>
                <dd>{activeCount} / {SLOTS.length}</dd>
              </div>
              <div className="ai-lab-tools-console__row">
                <dt>Avg utilization</dt>
                <dd>{utilization}%</dd>
              </div>
              <div className="ai-lab-tools-console__row">
                <dt>Capacity</dt>
                <dd>
                  {(activeCount * CAPACITY).toLocaleString()} req/s
                </dd>
              </div>
              <div className="ai-lab-tools-console__row ai-lab-tools-console__row--result">
                <dt>Saturation</dt>
                <dd>{Math.round(metrics.saturation * 100)}%</dd>
              </div>
            </dl>
          </div>

          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <Inbox className="h-3.5 w-3.5" strokeWidth={1.75} />
                Spillover & drops
              </span>
              <span className="ai-lab-tools-console__id">
                {metrics.drops.toLocaleString()} dropped
              </span>
            </header>
            <div className="ai-lab-expt-load-spill">
              <div className="ai-lab-expt-load-spill__row">
                <span>Queued</span>
                <div className="ai-lab-expt-load-spill__track" aria-hidden>
                  <i
                    style={{
                      width: `${Math.min(
                        100,
                        (metrics.queued / QUEUE_LIMIT) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <b>{metrics.queued.toLocaleString()}</b>
              </div>
              <p className="ai-lab-expt-load-spill__hint">
                {metrics.queued > 0
                  ? "Queue active — requests wait for an instance to free up."
                  : "All requests served inline."}
                {metrics.drops > 0
                  ? ` Some requests dropped above the queue cap.`
                  : ""}
              </p>
            </div>
          </div>

          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.75} />
                Auto-scaling
              </span>
              <span className="ai-lab-tools-console__id">POLICY</span>
            </header>
            {events.length === 0 ? (
              <p className="ai-lab-tools-empty">
                Push traffic above 80% utilization to trigger a scale-out.
              </p>
            ) : (
              <ul className="ai-lab-expt-log">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className={`ai-lab-expt-log__item ai-lab-expt-log__item--${event.tone}`}
                  >
                    {event.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="ai-lab-tools-note">
            Synthetic load test — no requests are actually served and no real
            infrastructure exists behind this chart.
          </p>
        </aside>
      </div>
    </div>
  );
}