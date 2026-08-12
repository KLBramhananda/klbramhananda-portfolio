import { SectionEyebrow } from "./about";
import {
  Layers,
  Bot,
  Zap,
  Boxes,
  ShoppingCart,
  FileCheck,
  MoveRight,
  type LucideIcon,
} from "lucide-react";
import { usePauseAnimations } from "../effects/use-pause-animations";

const diagrams = [
  {
    icon: Layers,
    title: "ERP System Flow",
    subtitle: "ERPNext + Frappe",
    nodes: ["Customer", "Sales Order", "Inventory", "Fulfillment", "Invoice"],
  },
  {
    icon: Bot,
    title: "AI Chatbot Workflow",
    subtitle: "LLM · RAG · Tools",
    nodes: ["User", "Router", "Vector Store", "LLM", "Tool Call", "Response"],
  },
  {
    icon: Zap,
    title: "REST API Lifecycle",
    subtitle: "FastAPI · Middleware",
    nodes: ["Client", "Gateway", "Auth", "Handler", "Service", "DB"],
  },
  {
    icon: Boxes,
    title: "Microservices Architecture",
    subtitle: "Spring Boot · Kafka",
    nodes: ["API Gateway", "Auth Svc", "Order Svc", "Inventory Svc", "Kafka Bus"],
  },
  {
    icon: ShoppingCart,
    title: "Order Processing Flow",
    subtitle: "Event driven",
    nodes: ["Cart", "Order Created", "Payment", "Warehouse", "Shipped"],
  },
  {
    icon: FileCheck,
    title: "Procurement Lifecycle",
    subtitle: "S2P Matrix",
    nodes: ["Requisition", "RFQ", "Supplier Match", "PO", "Receipt", "Payment"],
  },
];

export function Architecture() {
  const diagramsRef = usePauseAnimations<HTMLDivElement>();
  return (
    <section id="architecture" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionEyebrow>Architecture Showcase</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          System diagrams from the platforms I've built.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          A quick engineering-blog view into the flows that power enterprise
          procurement, ERP, and event-driven systems.
        </p>

        <div ref={diagramsRef} className="mt-14 grid md:grid-cols-2 gap-6">
          {diagrams.map((d, i) => (
            <Diagram key={d.title} {...d} phase={i * 0.45} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Diagram({
  icon: Icon,
  title,
  subtitle,
  nodes,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  nodes: string[];
  phase: number;
}) {
  const cycle = 7.2;
  const step = cycle / nodes.length;

  return (
    <article className="architecture-card glass-strong rounded-3xl p-6 lg:p-7 transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-900/10 bg-slate-900/[0.03] p-5 overflow-hidden dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-center gap-y-4">
          {nodes.map((n, i) => (
            <div key={n} className="flex items-center">
              <div
                className="flow-node rounded-lg glass px-3 py-2 text-xs font-medium text-foreground/90 border border-slate-900/10 dark:border-white/10"
                style={{ animationDelay: `${phase + i * step - cycle}s` }}
              >
                {n}
              </div>
              {i < nodes.length - 1 && (
                <span
                  aria-hidden
                  className="flow-segment mx-2 inline-flex h-4 w-4 shrink-0 items-center justify-center"
                >
                  <MoveRight className="flow-arrow h-4 w-4 text-cyan-accent/60" />
                  <span
                    className="flow-particle"
                    style={{ animationDelay: `${phase + i * step - cycle}s` }}
                  />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
