"use client";
import { motion } from "framer-motion";
import type { AggregatedData } from "@/lib/data";
import {
  PageWrap,
  PageHeader,
  Section,
  G2,
  Card,
  CardLabel,
  Chip,
} from "@/lib/ui";

const FREE_SOURCES = [
  {
    name: "RemoteOK",
    url: "https://remoteok.com/api",
    status: "live",
    note: "Free JSON · no auth · hundreds of AI/ML jobs",
  },
  {
    name: "Arbeitnow",
    url: "https://www.arbeitnow.com/api",
    status: "live",
    note: "Free JSON · EU + remote · paginated · no auth",
  },
  {
    name: "Jobicy",
    url: "https://jobicy.com/api/v0/jobs",
    status: "live",
    note: "Free tier · 50 results/call · filter by tag=ai",
  },
  {
    name: "HN Algolia",
    url: "https://hn.algolia.com/api",
    status: "live",
    note: "Who's Hiring monthly thread · completely free · highest quality",
  },
  {
    name: "The Muse",
    url: "https://www.themuse.com/api",
    status: "key",
    note: "Free tier with API key · 500 calls/hr · good company metadata",
  },
  {
    name: "Adzuna",
    url: "https://developer.adzuna.com",
    status: "key",
    note: "Free tier · 250 calls/day · global coverage",
  },
  {
    name: "USAJobs",
    url: "https://developer.usajobs.gov",
    status: "key",
    note: "US federal jobs · great for gov AI roles · free API key",
  },
  {
    name: "Remotive",
    url: "https://remotive.com/api/remote-jobs",
    status: "avail",
    note: "Free JSON · no auth · remote-only",
  },
];

const STATUS_MAP: Record<
  string,
  { label: string; col: "emerald" | "gold" | "cyan" }
> = {
  live: { label: "active", col: "emerald" },
  key: { label: "needs key", col: "gold" },
  avail: { label: "available", col: "cyan" },
};

const CODE_CRON = `# .github/workflows/scrape.yml
name: Weekly Job Scrape
on:
  schedule:
    - cron: '0 9 * * 1'   # Every Monday 09:00 UTC
  workflow_dispatch:        # Manual trigger in GitHub UI

jobs:
  scrape:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
          cache-dependency-path: scraper/requirements.txt
      - run: pip install -r scraper/requirements.txt
      - run: python scraper/scrape_jobs.py
      - run: python scraper/aggregate_free.py
      - name: Commit updated data
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || \\
            git commit -m "data: scrape $(date +%Y-%m-%d)" && git push
      # Vercel auto-redeploys when data is pushed — no extra steps needed`;

const CODE_ADD_SOURCE = `# scraper/scrape_jobs.py — add a new free source

def scrape_my_source(limit: int = 200) -> list[dict]:
    """New source: docs at https://example.com/api"""
    r = requests.get("https://example.com/api/jobs",
        params={"remote": "true"},
        headers=HEADERS, timeout=15)
    r.raise_for_status()
    jobs = []
    for item in r.json().get("data", []):
        title = item.get("title", "")
        desc  = item.get("description", "")
        if not is_ai_relevant(title + " " + desc):
            continue  # filter to AI/ML only
        jobs.append({
            "source":        "my_source",
            "scraped_at":    now_iso(),     # ALWAYS timestamp
            "external_id":   str(item.get("id", "")),
            "url":           item.get("url", ""),
            "title":         title,
            "company":       item.get("company", ""),
            "location":      item.get("location", "Remote"),
            "remote_policy": "remote" if item.get("remote") else "not specified",
            "salary_raw":    item.get("salary", ""),
            "description":   clean(desc)[:3000],
        })
        if len(jobs) >= limit:
            break
    return normalize(jobs)

# Then add "my_source" to ALL_SOURCES list and the main() scraping block`;

export default function Sources({
  data,
  isDemo,
}: {
  data: AggregatedData;
  isDemo: boolean;
}) {
  const history = data.meta?.sources_scraped ?? [];

  return (
    <PageWrap>
      <PageHeader
        title="Sources & Automation"
        sub="Every data point traces to a real posting — methodology open, automation free"
        badge={
          isDemo ? (
            <Chip color="gold">demo mode</Chip>
          ) : (
            <Chip color="emerald">real data</Chip>
          )
        }
      />
      <Section>
        {/* Scrape history */}
        {history.length > 0 && (
          <Card className="mb-5" p="p-5">
            <CardLabel right={`${history.length} runs`}>
              Scrape History
            </CardLabel>
            <div className="space-y-0">
              {history
                .slice()
                .reverse()
                .map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 py-2.5 border-b border-line last:border-0"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[11px] text-tx">
                        {s.source}
                      </span>
                      <span className="font-mono text-[11px] text-faint ml-3">
                        {s.count} jobs · {s.file}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-faint flex-shrink-0">
                      {new Date(s.scraped_at).toLocaleString()}
                    </span>
                  </motion.div>
                ))}
            </div>
          </Card>
        )}

        {/* Free sources grid */}
        <Card className="mb-5" p="p-5">
          <CardLabel>Free Job APIs</CardLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FREE_SOURCES.map((s) => {
              const st = STATUS_MAP[s.status];
              return (
                <div
                  key={s.name}
                  className="p-3.5 rounded-xl bg-bg2 border border-line flex flex-col gap-1.5 hover:border-line2 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13px] font-semibold text-hi">
                      {s.name}
                    </div>
                    <Chip color={st.col}>{st.label}</Chip>
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] text-acid hover:underline break-all"
                  >
                    {s.url}
                  </a>
                  <div className="font-mono text-[10px] text-faint leading-relaxed">
                    {s.note}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <G2 className="mb-5">
          <Card p="p-5">
            <CardLabel>GitHub Actions — Weekly Auto-Scrape</CardLabel>
            <p className="text-[12px] text-muted mb-3 leading-relaxed">
              Push this file, connect to Vercel, never touch it again. Every
              Monday it scrapes all sources, commits new data, and Vercel
              auto-redeploys.{" "}
              <strong className="text-tx">Zero cost. Zero servers.</strong>
            </p>
            <pre className="bg-bg2 border border-line rounded-xl p-4 font-mono text-[10px] text-muted leading-relaxed overflow-x-auto">
              <code>{CODE_CRON}</code>
            </pre>
          </Card>

          <Card p="p-5">
            <CardLabel>Adding a New Scraper Source</CardLabel>
            <pre className="bg-bg2 border border-line rounded-xl p-4 font-mono text-[10px] text-muted leading-relaxed overflow-x-auto">
              <code>{CODE_ADD_SOURCE}</code>
            </pre>
          </Card>
        </G2>

        {/* Methodology */}
        <Card p="p-5">
          <CardLabel>Methodology</CardLabel>
          <div className="space-y-3 text-[13px] text-muted leading-relaxed max-w-3xl">
            <p>
              Skills, role types, and seniority levels are extracted with{" "}
              <strong className="text-tx">regex pattern matching</strong> in{" "}
              <code className="font-mono text-acid bg-bg3 px-1.5 py-0.5 rounded text-[11px]">
                scraper/aggregate_free.py
              </code>
              . Zero LLM cost.
            </p>
            <p>
              Each scrape writes a timestamped JSON to{" "}
              <code className="font-mono text-acid bg-bg3 px-1.5 py-0.5 rounded text-[11px]">
                data/raw/
              </code>{" "}
              and appends one line to{" "}
              <code className="font-mono text-acid bg-bg3 px-1.5 py-0.5 rounded text-[11px]">
                data/raw/scrape_log.jsonl
              </code>
              . Trend data is computed from the{" "}
              <code className="font-mono text-faint bg-bg3 px-1 rounded text-[11px]">
                scraped_at
              </code>{" "}
              timestamps — run the scraper monthly and trend charts populate
              automatically with no code changes.
            </p>
            <p>
              Salaries are normalized to annualized USD. Skills use an alias
              map:{" "}
              <code className="font-mono text-faint bg-bg3 px-1 rounded text-[11px]">
                langchain → LangChain
              </code>
              ,{" "}
              <code className="font-mono text-faint bg-bg3 px-1 rounded text-[11px]">
                k8s → Kubernetes
              </code>
              , etc. Duplicate postings are detected by URL within each run.
            </p>
            <p>
              All four sources are public, free, and legal. No scraping of HTML
              — only documented JSON APIs or RSS feeds.
            </p>
          </div>

          {/* Coffee CTA */}
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <a
              href="https://www.buymeacoffee.com/allanito"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] transition-all hover:scale-[1.03] active:scale-[.97]"
              style={{ background: "#FFDD00", color: "#030303" }}
            >
              <span className="text-[16px]">☕</span>
              Buy me a coffee
            </a>
            <span className="text-[12px] text-faint">
              If this saved you hours of research ↑
            </span>
          </div>
        </Card>
      </Section>
    </PageWrap>
  );
}
