"use client";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { PageId } from "@/app/page";

const NAV = [
  { section: "Overview", items: [
    { id: "overview" as PageId, icon: IconGrid,   label: "Dashboard" },
  ]},
  { section: "Market Data", items: [
    { id: "skills"  as PageId, icon: IconCircles, label: "Skills Map" },
    { id: "salary"  as PageId, icon: IconDollar,  label: "Salaries" },
    { id: "trends"  as PageId, icon: IconTrend,   label: "Trends" },
    { id: "jobs"    as PageId, icon: IconList,    label: "Job Browser" },
    { id: "graph"   as PageId, icon: IconGraph,   label: "3D Skill Graph" },
  ]},
  { section: "Learn", items: [
    { id: "roadmap" as PageId, icon: IconRoad,    label: "Roadmaps" },
    { id: "sources" as PageId, icon: IconSource,  label: "Sources & Docs" },
  ]},
];

interface Props {
  active: PageId;
  onNav: (p: PageId) => void;
  totalJobs: number;
  isDemo: boolean;
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({ active, onNav, totalJobs, isDemo, open, onToggle }: Props) {
  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div key="bd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/75 z-10 lg:hidden backdrop-blur-sm"
            onClick={onToggle} />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : -240 }}
        transition={{ type:"spring", stiffness:280, damping:28 }}
        className="fixed left-0 top-0 bottom-0 z-20 flex flex-col"
        style={{ width: "var(--sidebar, 232px)", background:"#070707", borderRight:"1px solid #1a1a1a" }}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-line flex-shrink-0">
          {/* Hexagon logo */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-lg bg-acid flex items-center justify-center shadow-acid">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L14.5 5.25V12.75L8 16.5L1.5 12.75V5.25L8 1.5Z" fill="#030303"/>
                <circle cx="8" cy="9" r="2" fill="#030303" opacity=".5"/>
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-acid animate-pulse-acid" />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-hi leading-snug tracking-tight">AI Engineer</div>
            <div className="text-[14px] font-bold text-hi leading-snug tracking-tight">Roadmap</div>
            <div className="font-mono text-[9px] text-faint mt-0.5 tracking-widest uppercase">
              {isDemo ? "demo data" : `${totalJobs.toLocaleString()} jobs`}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map(({ section, items }) => (
            <div key={section}>
              <div className="font-mono text-[9px] font-semibold tracking-[.14em] uppercase text-faint px-5 pt-5 pb-1.5 select-none">
                {section}
              </div>
              {items.map(({ id, icon: Icon, label }) => {
                const isActive = active === id;
                return (
                  <button
                    key={id}
                    onClick={() => onNav(id)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium transition-all duration-100 border-l-2 text-left relative group",
                      isActive
                        ? "text-hi bg-bg2 border-l-acid"
                        : "text-muted border-l-transparent hover:text-tx hover:bg-bg1/60"
                    )}
                  >
                    <span className={clsx("transition-all", isActive ? "text-acid" : "text-faint group-hover:text-muted")}>
                      <Icon />
                    </span>
                    {label}
                    {isActive && (
                      <motion.span layoutId="nav-dot"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-acid shadow-glow-sm flex-shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-line flex-shrink-0 space-y-3">
          {/* Buy Me a Coffee */}
          <a
            href="https://www.buymeacoffee.com/allanito"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-[12px] transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: "#FFDD00", color: "#030303" }}
          >
            <span className="text-[15px]">☕</span>
            Buy me a coffee
          </a>

          {/* Status pill */}
          <div className="flex items-center justify-center gap-2">
            <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", isDemo ? "bg-gold" : "bg-emerald")} />
            <span className="font-mono text-[10px] text-faint">
              {isDemo
                ? "demo · run scraper for real data"
                : <><strong className="text-muted">{totalJobs.toLocaleString()}</strong> jobs analyzed</>
              }
            </span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

// ─── Nav Icons ────────────────────────────────────────────────────────────────
function IconGrid()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="1" width="5.5" height="5.5" rx="1.5"/><rect x="7.5" y="1" width="5.5" height="5.5" rx="1.5"/><rect x="1" y="7.5" width="5.5" height="5.5" rx="1.5"/><rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1.5"/></svg>; }
function IconCircles() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="5" cy="5" r="3.5"/><circle cx="9" cy="9" r="3.5"/></svg>; }
function IconDollar()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><line x1="7" y1="1" x2="7" y2="13"/><path d="M10 3.5c-1.5-1.5-5.5-1-5.5 2s4 2.5 5.5 4 1.5 5.5-5.5 5.5"/></svg>; }
function IconTrend()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,11 4.5,7 7.5,9 11,4"/><polyline points="9,4 11,4 11,6"/></svg>; }
function IconList()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="2.5" width="12" height="1.5" rx=".75"/><rect x="1" y="6" width="12" height="1.5" rx=".75"/><rect x="1" y="9.5" width="8" height="1.5" rx=".75"/></svg>; }
function IconGraph()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="7" cy="7" r="1.5"/><circle cx="2" cy="3" r="1.5"/><circle cx="12" cy="3" r="1.5"/><circle cx="2" cy="11" r="1.5"/><circle cx="12" cy="11" r="1.5"/><line x1="3.5" y1="3" x2="5.5" y2="6" stroke="currentColor" strokeWidth=".8"/><line x1="10.5" y1="3" x2="8.5" y2="6" stroke="currentColor" strokeWidth=".8"/><line x1="3.5" y1="11" x2="5.5" y2="8" stroke="currentColor" strokeWidth=".8"/></svg>; }
function IconRoad()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 4l3 3-3 3"/></svg>; }
function IconSource()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M7 1l6 3.5v5L7 13 1 9.5v-5L7 1z"/><path d="M7 7l6-2.5M7 7L1 4.5M7 7v6"/></svg>; }
