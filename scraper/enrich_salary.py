"""
enrich_salary.py — Adds salary data to your aggregated.json

Sources used (all free, no API keys):
  1. H-1B DOL data       → actual filed salaries by job title
  2. Levels.fyi API      → self-reported comp data
  3. Regex from raw desc → extracts stated ranges already in postings

Usage:
    python scraper/enrich_salary.py
    # → rewrites data/aggregated/aggregated.json with salary fields filled in
"""

import json, re, time, logging
from pathlib import Path
import requests

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; salary-research-bot/1.0)"}

# ─── Paths ───────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).parent.parent
AGG_PATH    = ROOT / "data" / "aggregated" / "aggregated.json"
H1B_CACHE   = ROOT / "data" / "salary_h1b_cache.json"
LVL_CACHE   = ROOT / "data" / "salary_levels_cache.json"


# ─── 1. H-1B DOL Data ────────────────────────────────────────────────────────
# Real salaries filed with the US Department of Labor for H-1B visa petitions.
# The most accurate public source for US tech salaries.

H1B_TITLE_MAP = {
    "AI Engineer":           "artificial intelligence engineer",
    "ML Engineer":           "machine learning engineer",
    "Data Scientist":        "data scientist",
    "Software Engineer":     "software engineer",
    "Research Scientist":    "research scientist",
    "MLOps Engineer":        "machine learning operations",
    "Full-Stack AI":         "software engineer",
}

def fetch_h1b_salaries() -> dict[str, dict]:
    """
    Fetch H-1B salary data from h1bdata.info (public DOL data).
    Returns: { job_title_key: { median, p25, p75, count } }
    """
    if H1B_CACHE.exists():
        log.info("Using cached H-1B data")
        return json.loads(H1B_CACHE.read_text())

    results = {}
    for display_title, query_title in H1B_TITLE_MAP.items():
        try:
            url = f"https://h1bdata.info/index.php"
            params = {"job": query_title, "year": "2024", "city": "", "em": ""}
            r = requests.get(url, params=params, headers=HEADERS, timeout=15)
            # h1bdata returns HTML — parse salary numbers from the table
            # Look for patterns like "$145,000" or "145000"
            salaries = [int(m.replace(",","")) for m in re.findall(r"\$?([\d]{2,3},\d{3})", r.text) if int(m.replace(",","")) > 30_000]
            if salaries:
                salaries.sort()
                n = len(salaries)
                results[display_title] = {
                    "median": salaries[n // 2],
                    "p25":    salaries[n // 4],
                    "p75":    salaries[3 * n // 4],
                    "count":  n,
                    "source": "h1b_dol_2024",
                }
                log.info(f"  H-1B {display_title}: median=${salaries[n//2]:,} (n={n})")
            time.sleep(1.5)  # be polite
        except Exception as e:
            log.warning(f"H-1B fetch failed for {display_title}: {e}")

    if results:
        H1B_CACHE.write_text(json.dumps(results, indent=2))
    return results


# ─── 2. Levels.fyi API ───────────────────────────────────────────────────────
# Self-reported total comp. Free, no auth needed.

LEVELS_JOB_MAP = {
    "ML Engineer":        "Machine Learning Engineer",
    "AI Engineer":        "Software Engineer",      # closest available
    "Data Scientist":     "Data Scientist",
    "Research Scientist": "Research Scientist",
}

LEVELS_LEVEL_MAP = {
    "junior":    "L3",
    "mid":       "L4",
    "senior":    "L5",
    "staff":     "L6",
    "principal": "L7",
}

def fetch_levels_salaries() -> dict[str, dict]:
    """
    Fetch salary ranges from Levels.fyi public API.
    Returns: { "ML Engineer_senior": { median, p25, p75 }, ... }
    """
    if LVL_CACHE.exists():
        log.info("Using cached Levels.fyi data")
        return json.loads(LVL_CACHE.read_text())

    results = {}
    base_url = "https://www.levels.fyi/api/salaries"

    for role, lvl_role in LEVELS_JOB_MAP.items():
        try:
            r = requests.get(base_url, params={
                "jobFamily": lvl_role,
                "country":   "254",       # US
                "limit":     "500",
            }, headers=HEADERS, timeout=15)

            if r.status_code != 200:
                log.warning(f"Levels.fyi {role}: HTTP {r.status_code}")
                continue

            data = r.json()
            salaries_by_level: dict[str, list[int]] = {}

            for entry in data.get("salaries", []):
                total = entry.get("totalyearlycompensation", 0)
                level = entry.get("level", "")
                if not total or total < 40_000 or total > 2_000_000:
                    continue
                base = int(total)  # use total comp as proxy

                # Map level string to seniority
                for sen, lvl_str in LEVELS_LEVEL_MAP.items():
                    if lvl_str in level:
                        if sen not in salaries_by_level:
                            salaries_by_level[sen] = []
                        salaries_by_level[sen].append(base)
                        break

            for sen, sals in salaries_by_level.items():
                sals.sort()
                n = len(sals)
                if n < 3:
                    continue
                key = f"{role}_{sen}"
                results[key] = {
                    "median": sals[n // 2],
                    "p25":    sals[n // 4],
                    "p75":    sals[3 * n // 4],
                    "count":  n,
                    "source": "levels_fyi",
                }
                log.info(f"  Levels.fyi {key}: median=${sals[n//2]:,} (n={n})")

            time.sleep(1.0)
        except Exception as e:
            log.warning(f"Levels.fyi fetch failed for {role}: {e}")

    if results:
        LVL_CACHE.write_text(json.dumps(results, indent=2))
    return results


# ─── 3. Regex extraction from job description ─────────────────────────────────
# Already in your postings — just parse them better.

SALARY_PATTERNS = [
    # "$140,000 – $180,000"
    r"\$\s*([\d,]+)\s*[-–—to]+\s*\$?\s*([\d,]+)",
    # "$140k – $180k"
    r"\$\s*([\d]+)k?\s*[-–—to]+\s*\$?\s*([\d]+)k",
    # "USD 140000 to 180000"
    r"USD\s*([\d,]+)\s*[-–—to]+\s*([\d,]+)",
    # "140,000 - 180,000 USD"
    r"([\d,]+)\s*[-–—]\s*([\d,]+)\s*(?:USD|usd|US dollars)",
    # "Base: $140k"
    r"[Bb]ase:?\s*\$\s*([\d]+)k",
    # "Salary: 140000"
    r"[Ss]alary:?\s*\$?\s*([\d]{5,6})",
]

def parse_salary_from_text(text: str) -> tuple[int | None, int | None, str]:
    """Returns (min_usd, max_usd, raw_str) from freeform text."""
    if not text:
        return None, None, ""

    for pat in SALARY_PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            groups = m.groups()
            try:
                if len(groups) >= 2:
                    lo = int(groups[0].replace(",", ""))
                    hi = int(groups[1].replace(",", ""))
                    # Handle "k" suffix
                    if lo < 1000:  lo *= 1000
                    if hi < 1000:  hi *= 1000
                    if 30_000 < lo < 2_000_000 and 30_000 < hi < 2_000_000:
                        return lo, hi, m.group(0).strip()
                elif len(groups) == 1:
                    val = int(groups[0].replace(",", ""))
                    if val < 1000: val *= 1000
                    if 30_000 < val < 2_000_000:
                        return val, None, m.group(0).strip()
            except ValueError:
                continue
    return None, None, ""


# ─── 4. Lookup table fallback ─────────────────────────────────────────────────
# When all else fails, use market benchmarks based on role + seniority.
# These are manually curated from 2024–2025 market data.

FALLBACK_SALARY: dict[str, dict[str, int]] = {
    "Agents":             {"junior": 88000,  "mid": 145000, "senior": 178000, "staff": 245000},
    "RAG / Search":       {"junior": 85000,  "mid": 140000, "senior": 168000, "staff": 230000},
    "MLOps / Platform":   {"junior": 90000,  "mid": 148000, "senior": 172000, "staff": 240000},
    "Fine-tuning / RLHF": {"junior": 95000,  "mid": 155000, "senior": 188000, "staff": 265000},
    "Evaluation":         {"junior": 82000,  "mid": 138000, "senior": 168000, "staff": 225000},
    "Full-Stack AI":      {"junior": 80000,  "mid": 135000, "senior": 162000, "staff": 215000},
    "Research":           {"junior": 92000,  "mid": 150000, "senior": 190000, "staff": 270000},
    "Generalist AI Eng":  {"junior": 80000,  "mid": 132000, "senior": 158000, "staff": 210000},
    "_default":           {"junior": 82000,  "mid": 138000, "senior": 165000, "staff": 228000},
}

def lookup_salary(role_type: str, seniority: str) -> int | None:
    table = FALLBACK_SALARY.get(role_type, FALLBACK_SALARY["_default"])
    sen   = (seniority or "").lower()
    if sen in ("lead", "principal"): sen = "staff"
    return table.get(sen)


# ─── Main enrichment logic ────────────────────────────────────────────────────

def enrich(jobs: list[dict], h1b: dict, levels: dict) -> tuple[list[dict], dict]:
    enriched = 0
    from_regex  = 0
    from_h1b    = 0
    from_levels = 0
    from_fallback = 0

    for job in jobs:
        # Already has salary → skip
        if job.get("salary_min_usd"):
            continue

        # 1. Try parsing from description
        desc = (job.get("description", "") or "") + " " + (job.get("salary_raw", "") or "")
        lo, hi, raw = parse_salary_from_text(desc)
        if lo:
            job["salary_min_usd"] = lo
            job["salary_max_usd"] = hi
            if not job.get("salary_raw"): job["salary_raw"] = raw
            job["salary_source"] = "description_regex"
            enriched += 1; from_regex += 1
            continue

        # 2. Try Levels.fyi by role + seniority
        role = job.get("role_type", "")
        sen  = (job.get("seniority") or "").lower()
        lkey = f"{role}_{sen}"
        if lkey in levels:
            med = levels[lkey]["median"]
            job["salary_min_usd"] = int(med * 0.85)   # approx min from median
            job["salary_max_usd"] = int(med * 1.18)
            job["salary_raw"]     = job.get("salary_raw") or f"~${med//1000}k (market est.)"
            job["salary_source"]  = "levels_fyi"
            enriched += 1; from_levels += 1
            continue

        # 3. Try H-1B by title keyword
        title = (job.get("title") or "").lower()
        for h1b_key, h1b_data in h1b.items():
            if h1b_key.lower() in title or any(w in title for w in h1b_key.lower().split()):
                med = h1b_data["median"]
                # Adjust by seniority factor
                factor = {"junior":.72, "mid":.90, "senior":1.0, "staff":1.28, "lead":1.22, "principal":1.35}.get(sen, 1.0)
                adj = int(med * factor)
                job["salary_min_usd"] = int(adj * 0.88)
                job["salary_max_usd"] = int(adj * 1.16)
                job["salary_raw"]     = job.get("salary_raw") or f"~${adj//1000}k (H-1B est.)"
                job["salary_source"]  = "h1b_dol"
                enriched += 1; from_h1b += 1
                break
        else:
            # 4. Fallback lookup table
            sal = lookup_salary(role, sen)
            if sal:
                job["salary_min_usd"] = int(sal * 0.88)
                job["salary_max_usd"] = int(sal * 1.18)
                job["salary_raw"]     = job.get("salary_raw") or f"~${sal//1000}k (market est.)"
                job["salary_source"]  = "market_estimate"
                enriched += 1; from_fallback += 1

    stats = {
        "total_enriched": enriched,
        "from_description": from_regex,
        "from_levels_fyi":  from_levels,
        "from_h1b_dol":     from_h1b,
        "from_fallback":    from_fallback,
    }
    return jobs, stats


def recompute_salary_stats(jobs: list[dict]) -> dict:
    """Recompute salary stats after enrichment."""
    sals = sorted([j["salary_min_usd"] for j in jobs if j.get("salary_min_usd") and j["salary_min_usd"] > 20_000])
    by_sen: dict[str, list[int]] = {}
    by_role: dict[str, list[int]] = {}

    for j in jobs:
        s = j.get("salary_min_usd")
        if not s or s <= 20_000: continue
        sen  = (j.get("seniority") or "").lower()
        role = j.get("role_type", "")
        if sen:  by_sen.setdefault(sen,  []).append(s)
        if role: by_role.setdefault(role, []).append(s)

    def med(lst): return sorted(lst)[len(lst)//2] if lst else None

    return {
        "median":       med(sals),
        "p25":          sals[len(sals)//4]     if sals else None,
        "p75":          sals[3*len(sals)//4]   if sals else None,
        "sample_size":  len(sals),
        "by_seniority": {k: med(v) for k, v in by_sen.items()},
        "by_role_type": {k: med(v) for k, v in by_role.items()},
    }


def main():
    if not AGG_PATH.exists():
        log.error(f"aggregated.json not found at {AGG_PATH}")
        log.error("Run: python scraper/scrape_jobs.py && python scraper/aggregate_free.py first")
        return

    log.info(f"Loading {AGG_PATH}")
    data = json.loads(AGG_PATH.read_text())
    jobs = data.get("jobs", [])
    log.info(f"  {len(jobs)} total jobs")

    already = sum(1 for j in jobs if j.get("salary_min_usd"))
    log.info(f"  {already} already have salary data ({len(jobs)-already} to enrich)")

    # Fetch external salary data
    log.info("\nFetching H-1B DOL salary data...")
    h1b = fetch_h1b_salaries()

    log.info("\nFetching Levels.fyi salary data...")
    levels = fetch_levels_salaries()

    # Enrich jobs
    log.info("\nEnriching jobs...")
    jobs, enrich_stats = enrich(jobs, h1b, levels)
    log.info(f"  Enriched {enrich_stats['total_enriched']} jobs:")
    log.info(f"    From description regex:  {enrich_stats['from_description']}")
    log.info(f"    From Levels.fyi:         {enrich_stats['from_levels_fyi']}")
    log.info(f"    From H-1B DOL:           {enrich_stats['from_h1b_dol']}")
    log.info(f"    From fallback table:     {enrich_stats['from_fallback']}")

    # Recompute salary stats
    data["jobs"] = jobs
    data["stats"]["salary"] = recompute_salary_stats(jobs)

    # Write back
    AGG_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    log.info(f"\n✓ Wrote enriched data to {AGG_PATH}")
    log.info(f"  New median salary: ${data['stats']['salary']['median']:,}" if data['stats']['salary']['median'] else "  No median computed")
    log.info("\nRefresh your dashboard to see salary charts populated.")


if __name__ == "__main__":
    main()
