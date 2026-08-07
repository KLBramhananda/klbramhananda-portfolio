import {
  Server,
  Boxes,
  Layout,
  Database,
  Network,
  Cloud,
  GitBranch,
} from "lucide-react";
import { SectionEyebrow } from "./about";

const groups = [
  {
    icon: Server,
    title: "Backend",
    items: ["Python", "Java", "Spring Boot", "FastAPI"],
  },
  { icon: Boxes, title: "ERP", items: ["ERPNext", "Frappe"] },
  {
    icon: Layout,
    title: "Frontend",
    items: ["React", "JavaScript", "HTML", "CSS"],
  },
  { icon: Database, title: "Database", items: ["MySQL", "MongoDB"] },
  {
    icon: Network,
    title: "Architecture",
    items: ["Microservices", "REST APIs", "Kafka"],
  },
  { icon: Cloud, title: "Cloud", items: ["AWS", "SAP BTP"] },
  { icon: GitBranch, title: "DevOps", items: ["Git", "CI/CD"] },
];

const stack = [
  { name: "Python", color: "#3776AB" },
  { name: "Java", color: "#f89820" },
  { name: "React", color: "#61DAFB" },
  { name: "FastAPI", color: "#009688" },
  { name: "Spring Boot", color: "#6DB33F" },
  { name: "ERPNext", color: "#0089FF" },
  { name: "Frappe", color: "#7B68EE" },
  { name: "MongoDB", color: "#47A248" },
  { name: "MySQL", color: "#00758F" },
  { name: "Kafka", color: "#231F20" },
  { name: "AWS", color: "#FF9900" },
  { name: "SAP", color: "#0FAAFF" },
  { name: "GitHub", color: "#8b949e" },
  { name: "Docker", color: "#2496ED" },
];

export function Skills() {
  return (
    <section id="skills" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionEyebrow>Technical Skills</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          The tools I reach for, grouped by what they do.
        </h2>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((g) => (
            <div
              key={g.title}
              className="group glass-strong rounded-2xl p-6 hover:bg-white/[0.07] hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--cyan-accent)]/20 to-[color:var(--blue-accent)]/20 text-[color:var(--cyan-accent)] group-hover:scale-110 transition-transform">
                  <g.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{g.title}</h3>
              </div>
              <ul className="mt-5 flex flex-wrap gap-2">
                {g.items.map((it) => (
                  <li
                    key={it}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-foreground/90 hover:border-[color:var(--cyan-accent)]/40 hover:text-[color:var(--cyan-accent)] transition-colors"
                  >
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack marquee */}
      <div id="tech" className="mx-auto max-w-7xl px-4 mt-28 lg:mt-36">
        <SectionEyebrow>Tech Stack</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          The stack, always in motion.
        </h2>

        <div className="mt-12 relative glass-strong rounded-3xl p-6 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

          <div className="flex gap-4 animate-marquee">
            {[...stack, ...stack].map((s, i) => (
              <TechChip key={`${s.name}-${i}`} name={s.name} color={s.color} />
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {stack.map((s) => (
            <TechChip key={s.name} name={s.name} color={s.color} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
          width: max-content;
        }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </section>
  );
}

function TechChip({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(/[\s.]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="glass rounded-2xl p-4 flex items-center gap-3 hover:-translate-y-1 hover:bg-white/[0.07] transition-all min-w-[160px]">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shrink-0"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
          boxShadow: `0 0 24px -6px ${color}88`,
        }}
      >
        {initials}
      </div>
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-[11px] text-muted-foreground">Production</div>
      </div>
    </div>
  );
}
