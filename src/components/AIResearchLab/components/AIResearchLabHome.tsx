import { Activity, Hammer } from "lucide-react";
import { AI_RESEARCH_MODULES, type AIResearchModule } from "../data/modules";
import { CorePanel } from "./CorePanel";
import { PerceptionPanel } from "./PerceptionPanel";
import { MemoryPanel } from "./MemoryPanel";
import { ToolCallingPanel } from "./ToolCallingPanel";
import { DigitalWorld } from "./DigitalWorld";
import { ExperimentChamber } from "./ExperimentChamber";
import { RobotAssistant } from "./RobotAssistant";
import { VoiceChat } from "./VoiceChat";

const STATS: {
  label: string;
  value: string;
  sub: string;
  tone: "green" | "cyan" | "blue";
}[] = [
  { label: "Core status", value: "", sub: "Idle · awaiting directives", tone: "green" },
  { label: "Registered modules", value: "9", sub: "interactive previews", tone: "cyan" },
  { label: "Environment", value: "SYNTHETIC", sub: "Simulated · no production data", tone: "blue" },
  { label: "Data plane", value: "ISOLATED", sub: "No external model egress", tone: "green" },
  { label: "Build", value: "v0.1", sub: "Foundation scaffolding", tone: "cyan" },
  { label: "Locale", value: "LOCAL", sub: "Private sandbox network", tone: "blue" },
];

function SectionHeading({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <h2 className="ai-lab-label">{label}</h2>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </div>
  );
}

export function AIResearchLabHome({ online = false }: { online?: boolean }) {
  const liveCount = AI_RESEARCH_MODULES.filter((module) => module.status === "live").length;
  const stats = STATS.map((stat) =>
    stat.label === "Core status"
      ? {
          ...stat,
          value: online ? "ACTIVE" : "STANDBY",
          sub: online ? "Core ready · watching for directives" : "Idle · awaiting directives",
        }
      : stat.label === "Registered modules"
        ? {
            ...stat,
            sub: `${liveCount} active · interactive previews`,
          }
        : stat,
  );

  return (
    <>
      <section
        className={`mx-auto max-w-7xl pb-24 pt-10 sm:pb-32 sm:pt-14${
          online ? " ai-lab-wake-reveal" : ""
        }`}
      >
      <div className="animate-fade-up max-w-3xl">
        <p className="ai-lab-eyebrow">
          <span className="ai-lab-dot ai-lab-dot--cyan" />
          AI Research Facility · Command Deck
        </p>
        <h1 className="ai-lab-title">BK AI Research Lab</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          An isolated research environment for the AI systems I build and study —
          reasoning cores, perception, memory, agents, tool calling, digital
          worlds, and robot assistants. A synthetic command center: safe to
          probe, poke, and learn from.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="ai-lab-chip ai-lab-chip--green">
            <span className="ai-lab-dot ai-lab-dot--green" />
            {online ? "System online" : "System standby"}
          </span>
          <span className="ai-lab-chip ai-lab-chip--cyan">Synthetic sandbox</span>
          <span className="ai-lab-chip ai-lab-chip--blue">Rev 0.1</span>
          <span className="ai-lab-chip">
            <span className="ai-lab-dot ai-lab-dot--green" />
            No external calls
          </span>
        </div>
      </div>

      {/* 1 · AI Digital World — the immersive 3D sandbox opens the Lab. */}
      <DigitalWorld online={online} />

      {/* 2 · Talk to AI — voice + text interaction with the Lab. */}
      <div className="mt-12">
        <VoiceChat online={online} />
      </div>

      {/* 3 · Central AI Core — the synthesis hub the modules hang off. */}
      <CorePanel online={online} />

      {/* 4 · AI Perception — synthetic pointer vision. */}
      <div className="mt-12 ai-lab-raise">
        <PerceptionPanel />
      </div>

      {/* 5 · AI Memory — short-term & long-term recall. */}
      <div className="mt-12 ai-lab-raise">
        <MemoryPanel />
      </div>

      {/* 6 · AI Tool Calling — structured tool invocation. */}
      <div className="mt-12 ai-lab-raise">
        <ToolCallingPanel />
      </div>

      {/* 7 · AI Experiment Chamber — controlled simulations. */}
      <div className="mt-12">
        <ExperimentChamber online={online} />
      </div>

      {/* 8 · Robot Assistant — the Lab's resident guide. */}
      <div className="mt-12">
        <RobotAssistant online={online} />
      </div>

      <div className="mt-12 ai-lab-raise">
        <SectionHeading
          label="System Modules"
          sub="Surrounding the AI core — foundation scaffolding"
        />
        <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {AI_RESEARCH_MODULES.map((module, i) => (
            <ModuleTile key={module.id} module={module} index={i} />
          ))}
        </div>
      </div>

      <div className="mt-12 ai-lab-raise">
        <SectionHeading label="Telemetry / Status" sub="Synthetic system readouts" />
        <div className="ai-lab-telemetry-grid mt-5">
          {stats.map((stat) => (
            <div key={stat.label} className={`ai-lab-stat ai-lab-stat--${stat.tone}`}>
              <div className="ai-lab-stat__head">
                <span className="ai-lab-stat__label">{stat.label}</span>
                <span className={`ai-lab-dot ai-lab-dot--${stat.tone}`} />
              </div>
              <div className="ai-lab-stat__value">{stat.value}</div>
              <div className="ai-lab-stat__sub">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="ai-lab-statusbar">
          <span className="ai-lab-statusbar__ok">
            <span className="ai-lab-dot ai-lab-dot--green" />
            All systems nominal
          </span>
          <span className="ai-lab-statusbar__cmd">
            <b>&gt;</b>
            {online ? "core ready · all modules foundational" : "core awaiting module directives"}
            <span className="animate-caret text-cyan-accent">▍</span>
          </span>
          <span className="hidden sm:inline">Local · Synthetic · v0.1</span>
        </div>
      </div>
      </section>
    </>
  );
}

function ModuleTile({ module, index }: { module: AIResearchModule; index: number }) {
  const Icon = module.icon;
  const blue = module.accent === "blue";
  const live = module.status === "live";

  return (
    <article
      aria-label={`${module.name} — ${live ? "interactive preview" : "under construction"}`}
      style={{ animationDelay: `${index * 90}ms` }}
      className={`ai-lab-raise ai-lab-module-card ai-lab-module-tile${
        blue ? " ai-lab-module-tile--blue" : ""
      }${
        live ? " ai-lab-module-tile--live" : ""
      } flex h-full flex-col`}
    >
      <div className="ai-lab-module-tile__head">
        <span className="ai-lab-code">
          MOD/{String(index + 1).padStart(2, "0")}
        </span>
        <span className="ai-lab-chip">
          <span className="ai-lab-dot ai-lab-dot--cyan" />
          {live ? "Interactive" : "Foundation"}
        </span>
      </div>

      <div className="ai-lab-module-tile__icon">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>

      <h3 className="ai-lab-module-tile__name">{module.name}</h3>
      <div className="ai-lab-module-tile__tagline">{module.tagline}</div>

      <p className="ai-lab-module-tile__desc">{module.description}</p>

      <ul className="ai-lab-module-tile__list mt-auto pt-5">
        {module.comingSoon.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="ai-lab-module-tile__foot">
        <span
          className={`flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-widest${
            live ? " text-cyan-accent" : " text-muted-foreground"
          }`}
        >
          {live ? (
            <Activity className="h-3.5 w-3.5" />
          ) : (
            <Hammer className="h-3.5 w-3.5" />
          )}
          {live ? "Interactive preview" : "Under construction"}
        </span>
        <span className="ai-lab-signal-bars" aria-hidden>
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
    </article>
  );
}