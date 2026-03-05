# Scraper

Place your `scrape_jobs.py`, `aggregate_free.py`, and `requirements.txt` here.

These files were not included in this distribution to keep the archive focused on the web dashboard. The scraper code is referenced throughout the documentation.

## Quick reference

```bash
# Install
pip install -r requirements.txt

# Scrape all sources
python scrape_jobs.py

# Specific sources
python scrape_jobs.py --sources remoteok arbeitnow
python scrape_jobs.py --source hn --hn-thread 43332022

# Aggregate to dashboard JSON
python aggregate_free.py

#Finalle
python enrich_salary.py
```

Output: `data/aggregated/aggregated.json` — the dashboard reads this automatically.
