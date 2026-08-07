import { ArrowRight, Download, Sparkles } from "lucide-react";
import profileImg from "@/assets/images/profile.jpg";

const roles = [
  "Software Engineer",
  "ERPNext Developer",
  "Backend Engineer",
  "AI-Powered Enterprise Apps",
];

const stats = [
  { value: "2+", label: "Years Experience" },
  { value: "3", label: "Enterprise Projects" },
  { value: "10+", label: "Technologies" },
  { value: "AI · ERP · Backend", label: "Focus Areas" },
];

const codeSnippets = [
  { top: "8%", left: "-6%", text: "def process_order(po):" },
  { top: "68%", left: "-10%", text: "@frappe.whitelist()" },
  { top: "22%", right: "-8%", text: "kafka.produce('orders', evt)" },
  { top: "78%", right: "-4%", text: "SELECT * FROM procurement;" },
];

export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28"
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-20 left-[10%] h-80 w-80 rounded-full bg-[color:var(--cyan-accent)]/20 blur-[110px] animate-float-slow" />
        <div className="absolute bottom-10 right-[8%] h-96 w-96 rounded-full bg-[color:var(--blue-accent)]/20 blur-[130px] animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[color:var(--cyan-accent)]/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
          {/* Left */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs text-muted-foreground mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Available for enterprise projects
            </div>

            <p className="text-muted-foreground text-lg mb-3">Hi, I'm</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-gradient">
              Bramhananda K L
            </h1>

            <div className="mt-6 flex flex-wrap gap-2">
              {roles.map((r) => (
                <span
                  key={r}
                  className="glass rounded-full px-3 py-1.5 text-xs sm:text-sm text-foreground/90"
                >
                  {r}
                </span>
              ))}
            </div>

            <p className="mt-8 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Building scalable enterprise software, ERP solutions,
              AI-powered procurement platforms, modern backend systems, and
              high-performance web applications.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--cyan-accent)] to-[color:var(--blue-accent)] px-5 py-3 text-sm font-semibold text-background shadow-[0_10px_40px_-10px_rgba(6,182,212,0.6)] hover:shadow-[0_14px_50px_-8px_rgba(6,182,212,0.75)] transition-shadow"
              >
                View Projects
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#resume"
                className="inline-flex items-center gap-2 rounded-xl glass-strong px-5 py-3 text-sm font-semibold text-foreground hover:bg-white/10 transition"
              >
                <Download className="h-4 w-4" />
                Download Resume
              </a>
            </div>

            {/* Quick stats */}
            <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="glass rounded-2xl p-4 hover:bg-white/[0.06] transition"
                >
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="mt-1 text-lg font-semibold text-foreground">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right: profile */}
          <div className="relative mx-auto w-full max-w-md animate-fade-up">
            {/* Glow rings */}
            <div className="absolute inset-0 -m-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[color:var(--cyan-accent)]/30 via-transparent to-[color:var(--blue-accent)]/30 blur-3xl animate-pulse-glow" />
            </div>

            {/* Floating code chips */}
            {codeSnippets.map((c, i) => (
              <div
                key={i}
                style={{ top: c.top, left: c.left, right: c.right }}
                className={`hidden sm:block absolute glass rounded-lg px-3 py-1.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap ${
                  i % 2 === 0 ? "animate-float-slow" : "animate-float-slower"
                }`}
              >
                {c.text}
              </div>
            ))}

            {/* Image container */}
            <div className="relative aspect-square rounded-[2rem] glass-strong p-3 glow-cyan">
              <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-800 to-slate-900">
                <img
                  src={profileImg}
                  alt="Bramhananda K L — Software Engineer"
                  width={912}
                  height={1104}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>

              {/* Corner badge */}
              <div className="absolute -bottom-4 -left-4 glass-strong rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--cyan-accent)] to-[color:var(--blue-accent)]">
                  <Sparkles className="h-5 w-5 text-background" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Currently building</div>
                  <div className="text-sm font-semibold text-foreground">
                    KeeMeds · ERPNext
                  </div>
                </div>
              </div>

              <div className="absolute -top-3 -right-3 glass rounded-full px-3 py-1.5 text-xs text-foreground/90">
                v2026 · Portfolio
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
