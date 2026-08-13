import { useEffect, useState, type ComponentType } from "react";
import {
  Bot,
  BrainCircuit,
  Gauge,
  Search,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { ReasoningExperiment } from "./experiments/reasoning";
import { RagExperiment } from "./experiments/rag";
import { AgentExperiment } from "./experiments/agent";
import { FailureExperiment } from "./experiments/failure";
import { TrafficExperiment } from "./experiments/traffic";
import { emitLabEvent } from "../lib/lab-events";

/**
 * AI Experiment Chamber — five controlled, fully-local simulations.
 *
 * Each tab is a self-contained experiment that animates a synthetic AI
 * workflow. Nothing here contacts real models, services or company systems:
 * every readout is deterministic, in-session mock data. Switching tabs
 * unmounts the previous experiment so its timers are always cleaned up.
 */

type ExperimentDef = {
  id: string;
  code: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  description: string;
  Component: ComponentType<{ online?: boolean }>;
};

const EXPERIMENTS: ExperimentDef[] = [
  {
    id: "reasoning",
    code: "01",
    name: "AI Reasoning",
    tagline: "Watch the AI work through a business problem",
    icon: BrainCircuit,
    description:
      "Pick a business problem and watch the core parse it, reason through constraints, score options and commit to a plan — a synthetic chain-of-thought, step by step.",
    Component: ReasoningExperiment,
  },
  {
    id: "rag",
    code: "02",
    name: "RAG / Retrieval",
    tagline: "Question → embedding → vector search → answer",
    icon: Search,
    description:
      "Ask a question and trace the retrieval pipeline: the query is embedded into a vector, the index is searched, the closest knowledge chunks are pulled and an answer is synthesized.",
    Component: RagExperiment,
  },
  {
    id: "agent",
    code: "03",
    name: "AI Agent",
    tagline: "A task lands, the agent picks a tool",
    icon: Bot,
    description:
      "Give the agent a task and watch it plan, evaluate its toolkit and invoke the best tool for the job — with an audit trail of every step.",
    Component: AgentExperiment,
  },
  {
    id: "failure",
    code: "04",
    name: "System Failure",
    tagline: "A service dies, the AI activates a fallback",
    icon: ShieldAlert,
    description:
      "Fail a synthetic service and watch the watchdog detect the anomaly, open the circuit breaker and reroute traffic to a standby service.",
    Component: FailureExperiment,
  },
  {
    id: "traffic",
    code: "05",
    name: "High Traffic",
    tagline: "Turn the dial, watch the fleet absorb load",
    icon: Gauge,
    description:
      "Increase simulated traffic and watch the load balancer spread requests across service instances, spill into the queue and auto-scale.",
    Component: TrafficExperiment,
  },
];

export function ExperimentChamber({ online = false }: { online?: boolean }) {
  const [active, setActive] = useState(0);
  const current = EXPERIMENTS[active];
  const ActiveComponent = current.Component;

  useEffect(() => {
    const exp = EXPERIMENTS[active];
    emitLabEvent({ type: "experiment:opened", id: exp.id, name: exp.name });
  }, [active]);

  return (
    <section
      id="ai-experiment-chamber"
      aria-label="AI Experiment Chamber — controlled simulations"
      className="ai-lab-raise ai-lab-panel ai-lab-panel--expt mt-10"
    >
      <div className="ai-lab-panel-head">
        <div className="flex min-w-0 items-center gap-3">
          <span className="ai-lab-label">AI Experiment Chamber</span>
          <span className="ai-lab-divider hidden sm:block" />
          <span className="ai-lab-value hidden text-muted-foreground sm:block">
            EXPT / 06 — Controlled experiments
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
          {online ? "Chamber ready" : "Chamber standby"}
        </span>
      </div>

      <div className="ai-lab-expt-tabs" role="tablist" aria-label="Chamber experiments">
        {EXPERIMENTS.map((exp, i) => {
          const Icon = exp.icon;
          const isActive = i === active;
          return (
            <button
              key={exp.id}
              type="button"
              role="tab"
              id={`ai-expt-tab-${exp.id}`}
              aria-selected={isActive}
              aria-controls={`ai-expt-panel-${exp.id}`}
              onClick={() => setActive(i)}
              className={`ai-lab-expt-tab${isActive ? " is-active" : ""}`}
            >
              <span className="ai-lab-expt-tab__code">EXPT/{exp.code}</span>
              <span className="ai-lab-expt-tab__icon">
                <Icon strokeWidth={1.75} />
              </span>
              <span className="ai-lab-expt-tab__name">{exp.name}</span>
              <span className="ai-lab-expt-tab__tag">{exp.tagline}</span>
            </button>
          );
        })}
      </div>

      <div
        key={current.id}
        id={`ai-expt-panel-${current.id}`}
        role="tabpanel"
        aria-labelledby={`ai-expt-tab-${current.id}`}
        className="ai-lab-expt-body"
      >
        <div className="ai-lab-expt-intro">
          <span className="ai-lab-expt-intro__icon">
            <current.icon strokeWidth={1.75} />
          </span>
          <p>{current.description}</p>
          <span className="ai-lab-chip ai-lab-chip--cyan">
            <span className="ai-lab-dot ai-lab-dot--cyan" />
            Controlled simulation · no external calls
          </span>
        </div>

        <ActiveComponent online={online} />
      </div>
    </section>
  );
}
