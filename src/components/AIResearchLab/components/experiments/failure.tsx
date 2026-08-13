import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  CircuitBoard,
  RotateCcw,
  Server,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { emitLabEvent } from "../../lib/lab-events";

/**
 * System Failure — Experiment 04.
 *
 * Simulates a production-style incident over a synthetic mesh: click a service
 * to fail it, then watch the AI watchdog detect the anomaly, the circuit
 * breaker open, and traffic reroute to a standby service. Everything is mock —
 * no infrastructure is actually touched.
 */

type Service = {
  id: string;
  name: string;
  endpoint: string;
  role: string;
  base: number;
  peak: number;
  rate: number;
};

const SERVICES: Service[] = [
  {
    id: "billing",
    name: "Billing API",
    endpoint: "api/billing",
    role: "Invoicing & charges",
    base: 42,
    peak: 412,
    rate: 9.4,
  },
  {
    id: "inventory",
    name: "Inventory Service",
    endpoint: "svc/inventory",
    role: "Stock & reorder levels",
    base: 38,
    peak: 298,
    rate: 7.1,
  },
  {
    id: "auth",
    name: "Auth Service",
    endpoint: "svc/auth",
    role: "Session & identity",
    base: 34,
    peak: 356,
    rate: 11.2,
  },
];

type Phase = "idle" | "fail" | "detected" | "circuit" | "fallback" | "mitigated";

type LogEntry = { id: number; text: string; tone: "ok" | "err" | "warn" | "info" };

const fallbackName = (service: Service) => `Standby ${service.name.replace(" Service", "")}`;

const PHASE_LABEL: Record<Phase, string> = {
  idle: "All systems nominal",
  fail: "Service down",
  detected: "Anomaly detected",
  circuit: "Circuit open",
  fallback: "Fallback engaged",
  mitigated: "Incident mitigated",
};

export function FailureExperiment() {
  const reducedRef = useRef(false);
  const runIdRef = useRef(1);
  const logIdRef = useRef(1);
  const timersRef = useRef<number[]>([]);

  const [victim, setVictim] = useState<Service | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [runId, setRunId] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);

  const degraded = phase !== "idle" && phase !== "mitigated";
  const p99 = victim ? (degraded ? victim.peak : victim.base) : 40;
  const errRate = degraded ? victim.rate : 0.2;

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  useEffect(() => {
    if (runId === 0 || !victim) return;
    const rs = reducedRef.current ? 0.35 : 1;
    const stepMs = Math.round(560 * rs);
    const timers: number[] = [];
    timersRef.current = timers;
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };
    const push = (text: string, tone: LogEntry["tone"]) => {
      setLog((prev) => [{ id: logIdRef.current++, text, tone }, ...prev].slice(0, 9));
    };

    at(0, () => {
      setPhase("fail");
      push(`GET /${victim.endpoint} (${victim.name}) → 500 · DOWN`, "err");
    });
    at(stepMs * 1.1, () => {
      setPhase("detected");
      push(`Watchdog: anomaly — p99 ${victim.peak}ms · ${victim.rate}% errors`, "warn");
      emitLabEvent({
        type: "experiment:warning",
        id: "failure",
        name: "System Failure",
        tone: "warn",
        detail: `Anomaly detected — ${victim.name} is failing`,
      });
    });
    at(stepMs * 2.2, () => {
      setPhase("circuit");
      push(`Circuit breaker for ${victim.name} → OPEN`, "warn");
      emitLabEvent({
        type: "experiment:warning",
        id: "failure",
        name: "System Failure",
        tone: "warn",
        detail: `Circuit open — traffic isolated from ${victim.name}`,
      });
    });
    at(stepMs * 3.3, () => {
      setPhase("fallback");
      push(`Traffic rerouted → ${fallbackName(victim)} engaged`, "info");
      emitLabEvent({
        type: "experiment:warning",
        id: "failure",
        name: "System Failure",
        tone: "warn",
        detail: `Fallback engaged for ${victim.name}`,
      });
    });
    at(stepMs * 4.5, () => {
      setPhase("mitigated");
      push(`${fallbackName(victim)} serving 100% · 200 OK`, "ok");
      emitLabEvent({
        type: "experiment:success",
        id: "failure",
        name: "System Failure",
        tone: "ok",
      });
    });
    at(stepMs * 5.6, () => {
      push("Incident mitigated · traffic stabilized", "ok");
    });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [runId, victim]);

  const causeFailure = (service: Service) => {
    if (phase !== "idle" && phase !== "mitigated") return;
    setVictim(service);
    setPhase("fail");
    setLog([
      { id: logIdRef.current++, text: "Simulating failure…", tone: "info" },
    ]);
    setRunId(runIdRef.current++);
    emitLabEvent({ type: "experiment:started", id: "failure", name: "System Failure" });
  };

  const failRandom = () => {
    if (phase !== "idle" && phase !== "mitigated") return;
    const pool = SERVICES.filter((s) => s.id !== victim?.id);
    const pick = pool[runId % pool.length] ?? SERVICES[0];
    causeFailure(pick);
  };

  const reset = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    setVictim(null);
    setPhase("idle");
    setLog([]);
  };

  const busy = phase !== "idle" && phase !== "mitigated" && victim !== null;

  return (
    <div className="ai-lab-expt-exp" aria-label="System Failure experiment">
      <div className="ai-lab-expt-fail-grid">
        <div className="ai-lab-expt-fail-map">
          <header className="ai-lab-expt-fail-map__head">
            <div className="ai-lab-expt-fail-gateway">
              <span className="ai-lab-expt-fail-gateway__dot" aria-hidden />
              <span className="ai-lab-expt-fail-gateway__name">API Gateway</span>
              <span className="ai-lab-expt-fail-gateway__meta">
                {phase === "idle" ? "routing to 3 services" : `routing around ${victim?.name ?? "service"}`}
              </span>
            </div>
            <div className="ai-lab-expt-fail-map__stats">
              <span>
                <b>p99</b> {p99}ms
              </span>
              <span>
                <b>Errors</b> {errRate.toFixed(1)}%
              </span>
              <span
                className={`ai-lab-expt-fail-map__state${
                  degraded ? " is-alert" : " is-ok"
                }`}
              >
                <span
                  className={`ai-lab-dot ${
                    degraded ? "ai-lab-dot--amber" : "ai-lab-dot--green"
                  }`}
                />
                {PHASE_LABEL[phase]}
              </span>
            </div>
          </header>

          <div className="ai-lab-expt-fail-columns">
            {SERVICES.map((service) => {
              const isVictim = victim?.id === service.id;
              const serviceDown = isVictim && (busy || phase === "mitigated");
              const fallbackActive =
                isVictim && phase !== "idle" && phase !== "fail" && phase !== "detected";
              return (
                <div key={service.id} className="ai-lab-expt-fail-col">
                  <span
                    className={`ai-lab-expt-fail-flow${serviceDown ? " is-paused is-alert" : " is-flowing"}`}
                    aria-hidden
                  >
                    <i />
                  </span>

                  <button
                    type="button"
                    onClick={() => causeFailure(service)}
                    disabled={busy}
                    aria-label={`${service.name} — ${
                      serviceDown ? "down" : "healthy. Click to simulate a failure."
                    }`}
                    className={`ai-lab-fail-service${
                      serviceDown ? " is-down" : ""
                    }`}
                  >
                    <span className="ai-lab-fail-service__icon">
                      <Server strokeWidth={1.75} />
                    </span>
                    <span className="ai-lab-fail-service__main">
                      <b>{service.name}</b>
                      <em>/{service.endpoint}</em>
                      <small>{service.role}</small>
                    </span>
                    <span className="ai-lab-fail-service__status">
                      <span
                        className={`ai-lab-dot ${
                          serviceDown ? "ai-lab-dot--amber" : "ai-lab-dot--green"
                        }`}
                      />
                      {serviceDown ? "DOWN" : "HEALTHY"}
                    </span>
                  </button>

                  <span
                    className={`ai-lab-expt-fail-flow ai-lab-expt-fail-flow--fallback${
                      fallbackActive ? " is-flowing is-engaged" : ""
                    }`}
                    aria-hidden
                  >
                    <i />
                  </span>

                  <div
                    className={`ai-lab-fail-fallback${
                      fallbackActive ? " is-active" : ""
                    }`}
                  >
                    <span className="ai-lab-fail-fallback__icon">
                      <ShieldCheck strokeWidth={1.75} />
                    </span>
                    <span className="ai-lab-fail-fallback__main">
                      <b>{fallbackName(service)}</b>
                      <em>{fallbackActive ? "Serving traffic" : "Standby"}</em>
                    </span>
                    <span
                      className={`ai-lab-dot ${
                        fallbackActive ? "ai-lab-dot--green" : "ai-lab-dot--amber"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="ai-lab-expt-col ai-lab-expt-rag-side">
          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <Activity className="h-3.5 w-3.5" strokeWidth={1.75} />
                AI Watchdog
              </span>
              <span className="ai-lab-tools-console__id">MONITOR</span>
            </header>
            <dl className="ai-lab-tools-console__rows">
              <div className="ai-lab-tools-console__row">
                <dt>Watching</dt>
                <dd>{victim ? victim.name : "All services"}</dd>
              </div>
              <div className="ai-lab-tools-console__row">
                <dt>p99 latency</dt>
                <dd>{p99}ms</dd>
              </div>
              <div className="ai-lab-tools-console__row">
                <dt>Error rate</dt>
                <dd>{errRate.toFixed(1)}%</dd>
              </div>
              <div className="ai-lab-tools-console__row ai-lab-tools-console__row--result">
                <dt>Status</dt>
                <dd>{PHASE_LABEL[phase]}</dd>
              </div>
            </dl>
            {phase !== "idle" && (
              <div className="ai-lab-expt-watch">
                <TriangleAlert strokeWidth={2} aria-hidden />
                <span>
                  {phase === "detected"
                    ? "Anomaly flagged — preparing fallback"
                    : phase === "circuit"
                      ? "Circuit open — isolating the service"
                      : phase === "fallback"
                        ? "Fallback live — rerouting traffic"
                        : phase === "mitigated"
                          ? "Services restored to nominal"
                          : "Service is failing"}
                </span>
              </div>
            )}
          </div>

          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <CircuitBoard className="h-3.5 w-3.5" strokeWidth={1.75} />
                Circuit breaker
              </span>
              <span className="ai-lab-tools-console__id">
                {victim ? victim.id.toUpperCase() : "--"}
              </span>
            </header>
            {victim ? (
              <ul className="ai-lab-expt-fail-circuit">
                <li
                  className={`ai-lab-expt-fail-circuit__row ${
                    phase === "circuit" || phase === "fallback" || phase === "mitigated"
                      ? " is-open"
                      : ""
                  }`}
                >
                  <span
                    className={`ai-lab-dot ${
                      phase === "circuit" || phase === "fallback" || phase === "mitigated"
                        ? "ai-lab-dot--amber"
                        : "ai-lab-dot--green"
                    }`}
                  />
                  {victim.name}
                  <em>
                    {phase === "circuit"
                      ? "OPEN"
                      : phase === "fallback" || phase === "mitigated"
                        ? "OPEN → BYPASSED"
                        : "CLOSED"}
                  </em>
                </li>
              </ul>
            ) : (
              <p className="ai-lab-tools-empty">
                Fail a service to open the breaker and engage a fallback.
              </p>
            )}
          </div>

          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                Incident log
              </span>
              <span className="ai-lab-tools-console__id">T+0s</span>
            </header>
            {log.length === 0 ? (
              <p className="ai-lab-tools-empty">
                Click a service card to simulate failure, or press Random failure.
              </p>
            ) : (
              <ul className="ai-lab-expt-log">
                {log.map((entry) => (
                  <li
                    key={entry.id}
                    className={`ai-lab-expt-log__item ai-lab-expt-log__item--${entry.tone}`}
                  >
                    {entry.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ai-lab-expt-fail-actions">
            <button
              type="button"
              onClick={failRandom}
              disabled={busy}
              className="ai-lab-expt-btn"
            >
              <TriangleAlert className="h-4 w-4" aria-hidden />
              Random failure
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={phase === "idle"}
              className="ai-lab-expt-btn ai-lab-expt-btn--ghost"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset to normal
            </button>
          </div>

          <p className="ai-lab-tools-note">
            Simulated incident — no real services are affected, and no real
            traffic is routed.
          </p>
        </aside>
      </div>
    </div>
  );
}