<div align="center">

```
  ╔═══════════════════════════════════╗
  ║   AI ENGINEER ROADMAP  🛰         ║
  ║   data-driven · open · free       ║
  ╚═══════════════════════════════════╝
```

**Real job market intelligence for AI engineers.**  
Built from scraped postings, zero API keys required, fully open source.

[![Jobs Scraped](https://img.shields.io/badge/jobs_scraped-1%2C765%2B-c8ff57?style=flat-square&labelColor=111)](data/aggregated/)
[![Sources](https://img.shields.io/badge/free_sources-4-60a5fa?style=flat-square&labelColor=111)](scraper/)
[![Deploy on Vercel](https://img.shields.io/badge/deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-engineer-roadmap)
[![License MIT](https://img.shields.io/badge/license-MIT-4ade80?style=flat-square&labelColor=111)](LICENSE)

[**→ Live Dashboard**](https://ai-engineer-roadmap.vercel.app) · [Scraper Docs](docs/scraping/) · [Add a Source](docs/contributing/) · [Automate It](docs/automation/)

</div>

---

## What This Is

A data pipeline + interactive dashboard that answers:

- What skills do AI engineering job postings actually require?
- How have salaries and demand changed over time?
- What's the fastest path to getting hired from your current background?

Everything here comes from real scraped data. No AI-generated estimates.

---

## Project Structure

```
ai-engineer-roadmap/
│
├── scraper/
│   ├── scrape_jobs.py         ← scrapes 4 free sources, no API keys
│   ├── aggregate_free.py      ← rule-based extraction → aggregated.json
│   └── requirements.txt
│
├── data/
│   ├── raw/
│   │   ├── YYYY-MM-DD_remoteok_Njobs.json    ← timestamped per run
│   │   ├── YYYY-MM-DD_arbeitnow_Njobs.json
│   │   └── scrape_log.jsonl                  ← append-only audit trail
│   └── aggregated/
│       └── aggregated.json                   ← dashboard source of truth
│
├── web/                       ← Next.js 15 + Tailwind + Recharts + Three.js
│   ├── src/
│   │   ├── app/               ← Next.js App Router
│   │   ├── components/        ← all UI pages and charts
│   │   └── lib/data.ts        ← types and data parsing
│   └── package.json
│
├── docs/
│   ├── scraping/              ← how to add new sources
│   ├── automation/            ← GitHub Actions setup
│   ├── contributing/          ← contribution guide
│   └── data-format/           ← schema reference
│
└── .github/
    └── workflows/
        └── scrape.yml         ← weekly auto-scrape + commit
```

---

## Quick Start

### 1 — Scrape data (free, no keys)

```bash
cd scraper
pip install -r requirements.txt

# Scrape all sources
python scrape_jobs.py

# Optional: specific sources or limits
python scrape_jobs.py --sources remoteok arbeitnow --limit 500
python scrape_jobs.py --source hn --hn-thread 43332022

# Build aggregated.json for the dashboard
python aggregate_free.py
```

**Cost:** $0. **Time:** ~2 minutes for all sources.

Each run writes a timestamped file to `data/raw/` and appends to `scrape_log.jsonl`. Run it weekly and trend charts auto-populate.

### 2 — Run the dashboard locally

```bash
cd web
npm install
npm run dev
# → http://localhost:3000
```

The app reads `../data/aggregated/aggregated.json` automatically. Falls back to demo data if the file doesn't exist.

### 3 — Deploy to Vercel (1 click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-engineer-roadmap)

Set the **Root Directory** to `web/` in Vercel settings. Done.

---

## Automate Weekly Scraping

Push `.github/workflows/scrape.yml` to your repo. GitHub Actions runs the scraper every Monday at 09:00 UTC, commits new data, and Vercel auto-redeploys. Zero cost, zero servers, zero maintenance.

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'   # every Monday
  workflow_dispatch:        # or trigger manually
```

See [`docs/automation/`](docs/automation/) for the full setup guide.

---

## Free Data Sources

| Source | URL | Notes |
|--------|-----|-------|
| **RemoteOK** | `remoteok.com/api` | Free JSON · no auth · remote AI/ML jobs |
| **Arbeitnow** | `arbeitnow.com/api` | Free JSON · EU + remote · paginated |
| **Jobicy** | `jobicy.com/api/v0/jobs` | Free tier · 50/call · filter by `tag=ai` |
| **HN Who's Hiring** | `hn.algolia.com/api` | Monthly thread · free · highest signal quality |

Want to add a source? See [`docs/scraping/adding-sources.md`](docs/scraping/).

---

## Dashboard Pages

| Page | What you get |
|------|-------------|
| **Dashboard** | Stats overview — skills, role types, remote split, key metrics |
| **Skills Map** | Interactive pill cloud + ranked bars, filterable by category |
| **Salaries** | Bar charts by role type + seniority, salary disclosure rates |
| **Trends** | Area/line charts — job volume, salary, and skill growth over time |
| **Job Browser** | Paginated table, multi-filter, sortable, real-time search |
| **Skill Graph 3D** | Three.js constellation — hover for detail, drag to rotate |
| **Roadmaps** | Phase-based learning paths for 5 different backgrounds |
| **Sources** | Scrape history, methodology, automation setup, add-source guide |

---

## Contributing

- **New job sources** → [`docs/contributing/`](docs/contributing/)
- **Roadmap improvements** → edit `web/src/components/pages/Roadmap.tsx`
- **Bug reports** → open an issue with the error + your Python version

---

<div align="center">

If this saved you time researching your job search:

[![Buy Me A Coffee](https://img.shields.io/badge/☕_Buy_me_a_coffee-FF813A?style=for-the-badge)](https://buymeacoffee.com)

*Data collected periodically from public job boards. Last scraped: see `data/raw/scrape_log.jsonl`*

</div>
