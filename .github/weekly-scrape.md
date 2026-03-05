# Automating Weekly Scrapes

Run the scraper on a schedule with GitHub Actions — completely free.

## Setup (5 minutes)

### 1. The workflow file is already included

`.github/workflows/scrape.yml` is in this repo. It runs every Monday at 09:00 UTC.

### 2. Push it to GitHub

```bash
git add .github/workflows/scrape.yml
git commit -m "feat(ci): add weekly job scrape workflow"
git push
```

### 3. Check it's active

Go to your repo → **Actions** tab → you should see "Weekly Job Scrape" listed.

To run it immediately: click **Run workflow**.

---

## How It Works

```
Every Monday 09:00 UTC
    ↓
GitHub Actions runner starts
    ↓
python scrape_jobs.py        ← hits all 4 free APIs
    ↓
python aggregate_free.py     ← builds aggregated.json
    ↓
git commit -m "data: weekly scrape 2026-03-10"
git push
    ↓
Vercel detects new commit → auto-redeploys
    ↓
Dashboard shows fresh data
```

---

## Trend Charts Auto-Populate

Each scrape adds a new timestamped entry to `data/raw/`. The `aggregate_free.py` groups all job records by `scraped_at` month and computes trend stats per period.

After running the scraper on:
- Week 1 → trend chart shows 1 data point
- Month 2 → 4–5 data points, slight trend visible
- Month 6 → meaningful trend data, skill rise/fall clear

**No code changes needed** — the charts grow automatically.

---

## Customize the Schedule

Edit `.github/workflows/scrape.yml`:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'    # Every Monday 09:00 UTC
    # - cron: '0 9 * * *'  # Daily
    # - cron: '0 9 1 * *'  # First of each month
```

Cron syntax: `minute hour day-of-month month day-of-week`

---

## Vercel Auto-Deploy

If your repo is connected to Vercel:
1. Push triggers build automatically
2. The Next.js API route reads the new `aggregated.json` at runtime
3. No rebuild needed for data-only updates if you put `aggregated.json` in `public/`

To skip rebuilds entirely, copy `aggregated.json` to `web/public/aggregated.json` after aggregation and update the API route to read from `/public/aggregated.json`.

---

## Self-Hosted Alternative

If you don't want to use GitHub Actions, a simple cron job works:

```bash
# crontab -e
0 9 * * 1 cd /path/to/ai-engineer-roadmap && python scraper/scrape_jobs.py && python scraper/aggregate_free.py
```
