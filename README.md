<div align="center">

# AI Engineer Roadmap 🛰

**Data-driven intelligence on the AI engineering job market.**  
Built from scraped job postings. Zero API costs. Fully open source.

[![Scrape sources](https://img.shields.io/badge/sources-4_free_APIs-b8ff3c?style=flat-square&labelColor=111111)](docs/scraping/)
[![Stack](https://img.shields.io/badge/stack-Next.js_15_·_Three.js_·_Recharts-3cf0ff?style=flat-square&labelColor=111111)](web/)
[![Automation](https://img.shields.io/badge/automation-GitHub_Actions-9d7cff?style=flat-square&labelColor=111111)](.github/workflows/)
[![License](https://img.shields.io/badge/license-MIT-3dffa0?style=flat-square&labelColor=111111)](LICENSE)

[**→ Live Dashboard**](https://ai-engineer-roadmap.vercel.app) · [Data Docs](docs/data-interpretation/) · [Add a Source](docs/scraping/) · [Automate](docs/automation/)

---

<img src="https://placehold.co/900x480/030303/b8ff3c?text=Dashboard+Screenshot" alt="Dashboard" width="900" style="border-radius:12px"/>

</div>

---

## What This Does

Answers three questions that matter when you're job-hunting or upskilling in AI:

1. **What skills are companies actually requiring right now?** Not what tutorials teach — what's in real job postings.
2. **What does the market pay?** By seniority level, role type, and location.
3. **What's the fastest path from your current background?** Phase-based roadmaps derived from the data, not opinion.

---

## Project Structure

```
ai-engineer-roadmap/
│
├── web/                          ← Next.js 15 dashboard (TypeScript + Tailwind + Three.js)
│   └── src/
│       ├── app/
│       │   ├── page.tsx          ← Main app shell + navigation
│       │   ├── layout.tsx        ← Root layout, fonts, metadata
│       │   ├── globals.css       ← Design system, grain, animations
│       │   └── api/data/         ← API route: reads aggregated.json
│       ├── components/
│       │   ├── Sidebar.tsx       ← Animated sidebar with nav + coffee button
│       │   └── pages/
│       │       ├── Overview.tsx  ← Main dashboard: stats, charts, distributions
│       │       ├── Skills.tsx    ← Interactive animated skill cloud + rankings
│       │       ├── Salary.tsx    ← Salary explorer with role/level filters
│       │       ├── Trends.tsx    ← Area + line charts: volume, salary, skills over time
│       │       ├── Jobs.tsx      ← Paginated job browser with multi-filter + search
│       │       ├── Graph.tsx     ← Three.js 3D skill constellation (drag/hover)
│       │       ├── Roadmap.tsx   ← 5 learning paths, phase-based, animated timeline
│       │       └── Sources.tsx   ← Data sources, automation guide, methodology
│       └── lib/
│           ├── data.ts           ← Types, helpers, color maps, demo data
│           └── ui.tsx            ← Shared UI: cards, bars, badges, tooltips
│
├── scraper/                      ← Python scraper (populate your own data here)
│   ├── scrape_jobs.py            ← Scrapes 4 free sources, no API keys
│   ├── aggregate_free.py         ← Rule-based extraction → aggregated.json
│   └── requirements.txt
│
├── data/
│   ├── raw/                      ← Timestamped JSON per scrape run
│   │   └── scrape_log.jsonl      ← Append-only audit trail
│   └── aggregated/
│       └── aggregated.json       ← Dashboard data source of truth
│
├── docs/
│   ├── data-interpretation/      ← How to read the charts and data
│   ├── scraping/                 ← Adding new free job sources
│   ├── automation/               ← GitHub Actions weekly scrape setup
│   └── contributing/             ← Contribution guide
│
└── .github/
    └── workflows/
        └── scrape.yml            ← Weekly auto-scrape + commit
```

---

## Quick Start

### 1 — Run the web dashboard (demo data included)

```bash
cd web
npm install
npm run dev
# → http://localhost:3000
```

The dashboard opens with built-in demo data. No setup needed.

### 2 — Scrape real data

```bash
cd scraper
pip install -r requirements.txt

# All sources (~2 min, zero cost)
python scrape_jobs.py

# Build aggregated.json for the dashboard
python aggregate_free.py
```

Refresh the dashboard — it now shows your real scraped data.

### 3 — Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-engineer-roadmap)

Set **Root Directory** to `web/` in Vercel project settings. Done.

---

## Weekly Automation (Free)

Push `.github/workflows/scrape.yml` to GitHub. The action runs every Monday, commits new data, and Vercel auto-redeploys. The trend charts auto-populate as you accumulate scrape history.

```
Monday 09:00 UTC → Scrape → Aggregate → Git commit → Vercel redeploy
```

See [`docs/automation/`](docs/automation/) for the full guide.

---

## Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | High-level stats: top skills, role types, remote split, seniority breakdown |
| **Skills Map** | Animated pill cloud + ranked bars, filterable by category |
| **Salary Explorer** | Bar charts by role type and seniority, location comparison |
| **Trends** | Area/line charts — job volume, salary, and skill demand over time |
| **Job Browser** | Paginated table, multi-filter, sortable columns, real-time search |
| **3D Skill Graph** | Three.js constellation — hover for count, drag to rotate, scroll to zoom |
| **Roadmaps** | Phase-based learning paths for 5 different starting backgrounds |
| **Sources & Docs** | Free API list, GitHub Actions setup, methodology, add-source guide |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS + custom design system |
| Charts | Recharts (area, bar, line, pie) |
| 3D | Three.js (dynamic import for SSR safety) |
| Animations | Framer Motion |
| Fonts | Syne + JetBrains Mono |

---

## Free Data Sources

| Source | API URL | Notes |
|--------|---------|-------|
| RemoteOK | `remoteok.com/api` | No auth · remote AI/ML jobs |
| Arbeitnow | `arbeitnow.com/api` | No auth · EU + remote |
| Jobicy | `jobicy.com/api/v0/jobs` | Free tier · filter by tag |
| HN Who's Hiring | `hn.algolia.com/api` | Best signal quality |

Want to add a source? See [`docs/scraping/`](docs/scraping/).

---

## Contributing

- New job sources → [`docs/scraping/adding-sources.md`](docs/scraping/adding-sources.md)
- Roadmap improvements → edit `web/src/components/pages/Roadmap.tsx`
- Bug reports → open an issue with Python version + error output

---

<div align="center">

**If this saved you hours of research:**

[![Buy Me A Coffee](https://img.shields.io/badge/☕_Buy_me_a_coffee-FFDD00?style=for-the-badge&labelColor=FFDD00&color=000000)](https://www.buymeacoffee.com/allanito)

*Data collected from public job boards. See `data/raw/scrape_log.jsonl` for last scrape timestamp.*

</div>
