# Data

This folder is populated by the scraper.

## Structure

```
data/
├── raw/
│   ├── 2026-03-05_remoteok_47jobs.json     ← one file per source per run
│   ├── 2026-03-05_arbeitnow_300jobs.json
├   ├── salary_h1b_cache.json
│   └── scrape_log.jsonl                    ← append-only audit trail.
└── aggregated/
    └── aggregated.json                     ← dashboard reads this
```

## Run the scraper

```bash
cd scraper
pip install -r requirements.txt
python scrape_jobs.py
python aggregate_free.py
python enrich_salary.py

```

Both `raw/` and `aggregated/` are gitignored by default to keep the repo clean. Add them to your own `.gitignore` or commit them — the GitHub Actions workflow commits `data/` automatically.
