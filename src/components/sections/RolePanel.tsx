import { MapPin } from "lucide-react";
import type { ExperienceRole } from "./experience";

/**
 * A role's identity card: commit label, title, company, location, dates and
 * the HEAD tag on the current role. Used as the sticky panel on desktop (one
 * per role, stacked, the active one shown) and as each role's header on
 * tablet and mobile.
 */
export function RolePanel({ role, className = "" }: { role: ExperienceRole; className?: string }) {
  return (
    <div className={`glass-strong rounded-3xl p-6 ${className}`}>
      <div className="flex items-center gap-2 font-mono text-[0.6875rem] tracking-wide">
        <span aria-hidden className="h-2 w-2 rounded-full bg-cyan-accent shadow-[0_0_8px_var(--cyan-accent)]" />
        <span className="text-cyan-accent">{role.hash}</span>
        <span className="truncate text-muted-foreground">{role.slug}</span>
        {role.head && (
          <span className="ml-auto rounded-md border border-cyan-accent/40 bg-cyan-accent/10 px-1.5 py-0.5 text-[0.625rem] font-semibold text-cyan-accent">
            HEAD
          </span>
        )}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-foreground">{role.role}</h3>
      <div className="text-sm text-cyan-accent">{role.company}</div>
      {role.location && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {role.location}
          {role.workMode && (
            <>
              <span aria-hidden>·</span>
              {role.workMode}
            </>
          )}
        </div>
      )}
      <div className="mt-4 border-t border-slate-900/10 pt-3 font-mono text-xs text-muted-foreground dark:border-white/10">
        {role.period}
      </div>
    </div>
  );
}
