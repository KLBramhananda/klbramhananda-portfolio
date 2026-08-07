import { SectionEyebrow } from "./about";
import {
  Layers,
  Bot,
  Zap,
  Boxes,
  ShoppingCart,
  FileCheck,
} from "lucide-react";

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

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {diagrams.map((d) => (
            <Diagram key={d.title} {...d} />
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
}: {
  icon: typeof Layers;
  title: string;
  subtitle: string;
  nodes: string[];
}) {
  return (
    <article className="glass-strong rounded-3xl p-6 lg:p-7 group hover:bg-white/[0.06] transition-all">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--cyan-accent)]/20 to-[color:var(--blue-accent)]/20 text-[color:var(--cyan-accent)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>

      <div className="mt-6 relative rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.08),transparent_70%)] p-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
          {nodes.map((n, i) => (
            <div key={n} className="flex items-center">
              <div className="relative rounded-lg glass px-3 py-2 text-xs font-medium text-foreground/90 border border-white/10 group-hover:border-[color:var(--cyan-accent)]/40 transition">
                {n}
                <span className="absolute inset-0 rounded-lg blur-md bg-[color:var(--cyan-accent)]/10 -z-10" />
              </div>
              {i < nodes.length - 1 && (
                <div className="relative mx-2 h-px w-6 sm:w-10 bg-gradient-to-r from-[color:var(--cyan-accent)]/60 to-[color:var(--blue-accent)]/60">
                  <span className="absolute inset-0 blur-sm bg-[color:var(--cyan-accent)]/50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
