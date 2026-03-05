import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
// import { DEMO_JOBS, DEMO_TREND, computeStats } from "@/lib/data";
// import type { AggregatedData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const candidates = [
      path.join(process.cwd(), "..", "data", "aggregated", "aggregated.json"),
      path.join(process.cwd(), "data", "aggregated", "aggregated.json"),
      path.join(process.cwd(), "public", "aggregated.json"),
    ];

    for (const p of candidates) {
      if (!fs.existsSync(p)) continue;
      const raw = fs.readFileSync(p, "utf-8");
      const parsed = JSON.parse(raw) as Partial<AggregatedData>;

      if (parsed.stats && parsed.jobs) {
        // Read scrape_log.jsonl for sources if meta is sparse
        const logPath = path.join(
          path.dirname(p),
          "..",
          "raw",
          "scrape_log.jsonl",
        );
        let sources = parsed.meta?.sources_scraped ?? [];
        if (!sources.length && fs.existsSync(logPath)) {
          sources = fs
            .readFileSync(logPath, "utf-8")
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => {
              try {
                return JSON.parse(line);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        }
        return NextResponse.json({
          ...parsed,
          meta: { ...parsed.meta, sources_scraped: sources },
          _demo: false,
        });
      }

      // Flat array fallback
      const jobs = Array.isArray(parsed)
        ? (parsed as AggregatedData["jobs"])
        : (parsed.jobs ?? []);
      const stats = computeStats(jobs);
      return NextResponse.json({
        meta: {
          total_jobs: jobs.length,
          generated_at: new Date().toISOString(),
          sources_scraped: [],
        },
        stats,
        jobs,
        _demo: false,
      });
    }

    // ── Demo fallback ──────────────────────────────────────────────────────
    const stats = computeStats(DEMO_JOBS);
    stats.trend = DEMO_TREND; // inject rich historical trend
    return NextResponse.json({
      meta: {
        total_jobs: DEMO_JOBS.length,
        generated_at: new Date().toISOString(),
        sources_scraped: [],
      },
      stats,
      jobs: DEMO_JOBS,
      _demo: true,
    });
  } catch (err) {
    console.error("[/api/data]", err);
    const stats = computeStats(DEMO_JOBS);
    stats.trend = DEMO_TREND;
    return NextResponse.json({
      meta: {
        total_jobs: DEMO_JOBS.length,
        generated_at: new Date().toISOString(),
        sources_scraped: [],
      },
      stats,
      jobs: DEMO_JOBS,
      _demo: true,
    });
  }
}
