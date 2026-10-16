import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  FlaskConical,
  FolderGit2,
  House,
  MoreHorizontal,
  User,
  type LucideIcon,
} from "lucide-react";
import { SECTIONS, pathForSection } from "@/lib/sections";

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "about", label: "About", icon: User },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "projects", label: "Projects", icon: FolderGit2 },
];
const TAB_IDS = new Set(TABS.map((t) => t.id));
const MORE_SECTIONS = SECTIONS.filter((s) => !TAB_IDS.has(s.id));

/**
 * Mobile (<768px) floating bottom tab bar: Home, About, Experience, Projects
 * plus "More", which opens a bottom sheet with the remaining sections and the
 * Lab link. Padded for the home indicator via `env(safe-area-inset-bottom)`.
 */
export function MobileTabBar({ active }: { active: string | null }) {
  const [open, setOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const moreActive = active !== null && !TAB_IDS.has(active);

  const close = () => {
    setOpen(false);
    moreRef.current?.focus({ preventScroll: true });
  };

  // Dialog behaviour: focus moves in, Esc closes, Tab stays inside.
  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    sheet?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        moreRef.current?.focus({ preventScroll: true });
      } else if (e.key === "Tab" && sheet) {
        const items = sheet.querySelectorAll<HTMLElement>("a, button");
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const tabClass = (on: boolean) =>
    `relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[0.625rem] font-medium transition-colors ${
      on ? "text-cyan-accent" : "text-muted-foreground"
    }`;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
        <nav
          aria-label="Primary mobile"
          className="glass-nav flex items-stretch rounded-2xl p-1 shadow-[var(--shadow-nav)]"
        >
          {TABS.map((t) => {
            const on = active === t.id;
            const section = SECTIONS.find((s) => s.id === t.id)!;
            return (
              <a
                key={t.id}
                href={pathForSection(section)}
                aria-current={on ? "location" : undefined}
                className={tabClass(on)}
              >
                {on && (
                  <motion.span
                    layoutId="tab-active"
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-cyan-accent/10"
                    transition={{ type: "spring", stiffness: 520, damping: 38 }}
                  />
                )}
                <t.icon className="relative h-[1.125rem] w-[1.125rem]" aria-hidden />
                <span className="relative">{t.label}</span>
              </a>
            );
          })}
          <button
            ref={moreRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={tabClass(moreActive || open)}
          >
            {(moreActive || open) && (
              <motion.span
                layoutId="tab-active"
                aria-hidden
                className="absolute inset-0 rounded-xl bg-cyan-accent/10"
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
              />
            )}
            <MoreHorizontal className="relative h-[1.125rem] w-[1.125rem]" aria-hidden />
            <span className="relative">More</span>
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="sheet"
            className="fixed inset-0 z-[85] flex items-end bg-black/45 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="More sections"
              className="glass-strong w-full rounded-t-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-900/15 dark:bg-white/20" aria-hidden />
              <ul className="grid grid-cols-2 gap-2">
                {MORE_SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={pathForSection(s)}
                      onClick={() => setOpen(false)}
                      aria-current={active === s.id ? "location" : undefined}
                      className={`block rounded-xl border border-slate-900/10 px-3 py-3 text-sm font-medium dark:border-white/10 ${
                        active === s.id ? "bg-cyan-accent/10 text-cyan-accent" : "text-foreground/90"
                      }`}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
                <li className="col-span-2">
                  <Link
                    to="/lab"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-xl border border-slate-900/10 px-3 py-3 text-sm font-medium text-foreground/90 dark:border-white/10"
                  >
                    <FlaskConical className="h-4 w-4 text-cyan-accent" aria-hidden />
                    BK Engineering Lab
                  </Link>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
