"use client";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { AggregatedData } from "@/lib/data";
import { computeStats, DEMO_JOBS, DEMO_TREND } from "@/lib/data";
import { LoadScreen, DemoBanner } from "@/lib/ui";
import Sidebar from "./components/Sidebar";
import Overview from "./components/pages/Overview";
import Skills from "./components/pages/Skills";
import Salary from "./components/pages/Salary";
import Trends from "./components/pages/Trends";
import Jobs from "./components/pages/Jobs";
import Graph from "./components/pages/Graph";
import Roadmap from "./components/pages/Roadmap";
import Sources from "./components/pages/Sources";

export type PageId =
  | "overview"
  | "skills"
  | "salary"
  | "trends"
  | "jobs"
  | "graph"
  | "roadmap"
  | "sources";

export default function App() {
  const [page, setPage] = useState<PageId>("overview");
  const [data, setData] = useState<AggregatedData | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024)
      setSidebarOpen(false);
  }, []);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d: AggregatedData & { _demo?: boolean }) => {
        setData(d);
        setIsDemo(!!d._demo);
      })
      .catch(() => {
        const stats = computeStats(DEMO_JOBS);
        stats.trend = DEMO_TREND;
        setData({
          meta: {
            total_jobs: DEMO_JOBS.length,
            generated_at: new Date().toISOString(),
            sources_scraped: [],
          },
          stats,
          jobs: DEMO_JOBS,
        });
        setIsDemo(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const nav = (p: PageId) => {
    setPage(p);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };
  const ml = sidebarOpen ? "var(--sidebar, 232px)" : "0";

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar
        active={page}
        onNav={nav}
        totalJobs={data?.meta.total_jobs ?? 0}
        isDemo={isDemo}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      <main
        className="flex-1 overflow-y-auto overflow-x-hidden transition-[margin] duration-300"
        style={{ marginLeft: ml }}
      >
        {/* Mobile topbar */}
        <div
          className="lg:hidden sticky top-0 z-10 flex items-center gap-3 px-5 py-3.5 border-b border-line"
          style={{ background: "#030303cc", backdropFilter: "blur(16px)" }}
        >
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-muted hover:text-tx transition-colors"
            aria-label="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <rect y="3" width="18" height="1.8" rx=".9" />
              <rect y="8.1" width="18" height="1.8" rx=".9" />
              <rect y="13.2" width="12" height="1.8" rx=".9" />
            </svg>
          </button>
          <span className="font-mono text-[11px] text-muted tracking-wide">
            AI Engineer Roadmap
          </span>
        </div>

        {/* Sidebar collapse button (desktop) */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="hidden lg:flex fixed bottom-6 left-4 z-30 items-center justify-center w-6 h-6 rounded-md bg-bg2 border border-line text-faint hover:text-tx hover:border-line2 transition-all font-mono text-[10px]"
          title={sidebarOpen ? "Collapse" : "Expand"}
        >
          {sidebarOpen ? "←" : "→"}
        </button>

        {isDemo && !loading && <DemoBanner />}

        {loading ? (
          <LoadScreen />
        ) : (
          <AnimatePresence mode="wait">
            {data && (
              <>
                {page === "overview" && <Overview key="ov" data={data} />}
                {page === "skills" && <Skills key="sk" data={data} />}
                {page === "salary" && <Salary key="sl" data={data} />}
                {page === "trends" && <Trends key="tr" data={data} />}
                {page === "jobs" && <Jobs key="jb" data={data} />}
                {page === "graph" && <Graph key="gr" data={data} />}
                {page === "roadmap" && <Roadmap key="rm" />}
                {page === "sources" && (
                  <Sources key="so" data={data} isDemo={isDemo} />
                )}
              </>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
