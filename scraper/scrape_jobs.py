"""
AI Engineer Roadmap — Free Job Scraper
───────────────────────────────────
Scrapes AI/ML engineering jobs from 100% free, public sources.
No API keys. No paid services. No account required.

Sources:
  • HN Who's Hiring  — news.ycombinator.com/item?id=...  (monthly thread, best quality)
  • RemoteOK         — remoteok.com/api                  (free JSON API, no auth)
  • Arbeitnow        — arbeitnow.com/api                 (free EU/remote JSON API)
  • Jobicy           — jobicy.com/api/v0/jobs             (free remote JSON API)
  • GitHub Jobs RSS  — github.com (search via public RSS)

"""

import re
import json
import time
import argparse
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlencode

import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

# ── Setup ──────────────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger("scraper")

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; AI-Roles-Radar/1.0; +https://github.com/yourname/ai-roles-radar)"
}

# AI-relevant keywords — used to filter noisy results
AI_KEYWORDS = {
    "llm", "ai engineer", "ml engineer", "machine learning", "artificial intelligence",
    "rag", "retrieval", "langchain", "embedding", "vector", "fine-tun", "foundation model",
    "generative", "nlp", "language model", "openai", "anthropic", "hugging face",
    "pytorch", "tensorflow", "mlops", "data scientist", "applied ai", "applied ml",
    "deep learning", "transformer", "agent", "prompt", "llmops",
}

def is_ai_relevant(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in AI_KEYWORDS)

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def save(jobs: list[dict], source: str) -> Path:
    date_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"{date_str}_{source}_{len(jobs)}jobs.json"
    path = RAW_DIR / filename
    with open(path, "w") as f:
        json.dump(jobs, f, indent=2)
    log.info(f"  ✓ Saved {len(jobs)} jobs → {path.name}")

    # Append to audit log
    log_path = RAW_DIR / "scrape_log.jsonl"
    with open(log_path, "a") as f:
        f.write(json.dumps({
            "scraped_at": now_iso(),
            "source": source,
            "count": len(jobs),
            "file": filename
        }) + "\n")

    return path


# ── Source 1: RemoteOK Free API ────────────────────────────────────────────────
# Docs: https://remoteok.com/api  (no auth, free, 100% legal)

def scrape_remoteok(limit: int = 300) -> list[dict]:
    log.info("Scraping RemoteOK...")
    try:
        r = requests.get("https://remoteok.com/api", headers={**HEADERS, "Accept": "application/json"}, timeout=15)
        r.raise_for_status()
        raw = r.json()
    except Exception as e:
        log.error(f"RemoteOK failed: {e}")
        return []

    jobs = []
    for item in raw:
        if not isinstance(item, dict) or "position" not in item:
            continue
        title = item.get("position", "")
        desc  = item.get("description", "")
        if not is_ai_relevant(title + " " + desc):
            continue

        jobs.append({
            "source": "remoteok",
            "scraped_at": now_iso(),
            "external_id": str(item.get("id", "")),
            "url": item.get("url", ""),
            "title": title,
            "company": item.get("company", ""),
            "location": "Remote",
            "remote_policy": "remote",
            "salary_raw": item.get("salary", ""),
            "tags": item.get("tags", []),
            "description": BeautifulSoup(desc, "html.parser").get_text(" ", strip=True)[:3000],
            "posted_at": item.get("date", ""),
        })
        if len(jobs) >= limit:
            break

    log.info(f"  RemoteOK: {len(jobs)} AI-relevant jobs")
    return jobs


# ── Source 2: Arbeitnow API ────────────────────────────────────────────────────
# Docs: https://www.arbeitnow.com/api  (free, no auth, EU + remote heavy)

def scrape_arbeitnow(limit: int = 300) -> list[dict]:
    log.info("Scraping Arbeitnow...")
    jobs = []
    page = 1

    while len(jobs) < limit:
        try:
            r = requests.get(
                f"https://www.arbeitnow.com/api/job-board-api?page={page}",
                headers=HEADERS, timeout=15
            )
            r.raise_for_status()
            data = r.json().get("data", [])
        except Exception as e:
            log.error(f"Arbeitnow page {page} failed: {e}")
            break

        if not data:
            break

        for item in data:
            title = item.get("title", "")
            desc  = item.get("description", "")
            if not is_ai_relevant(title + " " + desc):
                continue

            jobs.append({
                "source": "arbeitnow",
                "scraped_at": now_iso(),
                "external_id": item.get("slug", ""),
                "url": item.get("url", ""),
                "title": title,
                "company": item.get("company_name", ""),
                "location": item.get("location", ""),
                "remote_policy": "remote" if item.get("remote") else "on-site",
                "salary_raw": "",
                "tags": item.get("tags", []),
                "description": BeautifulSoup(desc, "html.parser").get_text(" ", strip=True)[:3000],
                "posted_at": item.get("created_at", ""),
            })
            if len(jobs) >= limit:
                break

        page += 1
        time.sleep(0.4)

    log.info(f"  Arbeitnow: {len(jobs)} AI-relevant jobs")
    return jobs


# ── Source 3: Jobicy Free API ──────────────────────────────────────────────────
# Docs: https://jobicy.com/api/v0/jobs  (free tier: 50 results)

def scrape_jobicy(limit: int = 50) -> list[dict]:
    log.info("Scraping Jobicy...")
    jobs = []
    for tag in ["machine-learning", "ai", "data-science"]:
        try:
            r = requests.get(
                f"https://jobicy.com/api/v0/jobs?count=50&tag={tag}",
                headers=HEADERS, timeout=15
            )
            r.raise_for_status()
            items = r.json().get("jobs", [])
        except Exception as e:
            log.error(f"Jobicy tag={tag} failed: {e}")
            continue

        for item in items:
            title = item.get("jobTitle", "")
            desc  = item.get("jobDescription", "")
            if not is_ai_relevant(title + " " + desc):
                continue
            # dedupe within run
            url = item.get("url", "")
            if any(j["url"] == url for j in jobs):
                continue

            jobs.append({
                "source": "jobicy",
                "scraped_at": now_iso(),
                "external_id": str(item.get("id", "")),
                "url": url,
                "title": title,
                "company": item.get("companyName", ""),
                "location": item.get("jobGeo", "Remote"),
                "remote_policy": "remote",
                "salary_raw": item.get("annualSalaryMin", ""),
                "salary_min": item.get("annualSalaryMin"),
                "salary_max": item.get("annualSalaryMax"),
                "salary_currency": item.get("salaryCurrency", "USD"),
                "tags": item.get("jobIndustry", []),
                "description": BeautifulSoup(desc, "html.parser").get_text(" ", strip=True)[:3000],
                "posted_at": item.get("pubDate", ""),
            })
        time.sleep(0.5)

    log.info(f"  Jobicy: {len(jobs)} AI-relevant jobs")
    return jobs[:limit]


# ── Source 4: HN Who's Hiring ─────────────────────────────────────────────────
# No rate limit, no auth — just scraping a public HTML page.
# Find the latest thread ID at: https://news.ycombinator.com/submitted?id=whoishiring
# Monthly threads are top-level comments from `whoishiring` account.

HN_THREAD_IDS = {
    # Format: "Month YYYY": item_id
    # Add new ones each month as they drop
    "Mar 2026": 43332022,
    "Feb 2026": 42827732,
    "Jan 2026": 42575537,
    "Dec 2025": 42297271,
    "Nov 2025": 42080423,
    "Oct 2025": 41872353,
    "Sep 2025": 41425388,
    "Aug 2025": 41301614,
}

def scrape_hn_hiring(thread_id: Optional[int] = None, limit: int = 400) -> list[dict]:
    """
    Scrapes the HN 'Who's Hiring?' thread via the Algolia HN API.
    API docs: https://hn.algolia.com/api  (free, no auth)
    """
    if thread_id is None:
        # Pick the most recent known thread
        thread_id = list(HN_THREAD_IDS.values())[0]
        month_label = list(HN_THREAD_IDS.keys())[0]
    else:
        month_label = "custom"

    log.info(f"Scraping HN Who's Hiring (thread {thread_id}, ~{month_label})...")

    jobs = []
    page = 0

    while len(jobs) < limit:
        try:
            r = requests.get(
                "https://hn.algolia.com/api/v1/search",
                params={
                    "tags": f"comment,story_{thread_id}",
                    "hitsPerPage": 100,
                    "page": page,
                },
                headers=HEADERS,
                timeout=15,
            )
            r.raise_for_status()
            data = r.json()
        except Exception as e:
            log.error(f"HN API page {page} failed: {e}")
            break

        hits = data.get("hits", [])
        if not hits:
            break

        for hit in hits:
            text = hit.get("comment_text", "") or ""
            clean = BeautifulSoup(text, "html.parser").get_text(" ", strip=True)
            if not is_ai_relevant(clean):
                continue

            # Try to parse title / company from first line of comment
            lines = [l.strip() for l in clean.split("|") if l.strip()]
            company = lines[0][:80] if lines else "Unknown"
            title_guess = lines[1][:120] if len(lines) > 1 else "AI / ML Engineer"

            # Pull salary hint
            salary_raw = ""
            salary_match = re.search(r"\$[\d,]+k?\s*[-–]\s*\$[\d,]+k?|\$[\d,]+k?\+?", clean, re.IGNORECASE)
            if salary_match:
                salary_raw = salary_match.group(0)

            # Remote hint
            remote = "not specified"
            if re.search(r"\bremote\b", clean, re.I):
                remote = "remote"
            elif re.search(r"\bhybrid\b", clean, re.I):
                remote = "hybrid"
            elif re.search(r"\bonsite\b|\bon-site\b|\bin-office\b", clean, re.I):
                remote = "on-site"

            jobs.append({
                "source": "hn_hiring",
                "scraped_at": now_iso(),
                "hn_thread": thread_id,
                "hn_month": month_label,
                "external_id": hit.get("objectID", ""),
                "url": f"https://news.ycombinator.com/item?id={hit.get('objectID','')}",
                "title": title_guess,
                "company": company,
                "location": "See posting",
                "remote_policy": remote,
                "salary_raw": salary_raw,
                "tags": [],
                "description": clean[:3000],
                "posted_at": hit.get("created_at", ""),
            })
            if len(jobs) >= limit:
                break

        page += 1
        time.sleep(0.3)

    log.info(f"  HN Hiring: {len(jobs)} AI-relevant jobs from thread {thread_id}")
    return jobs


# ── Source 5: GitHub Jobs (via awesome-mlops / aggregator repos) ───────────────
# Several community repos maintain lists of ML/AI job boards as JSON.
# We pull from the ones that expose raw JSON without auth.

def scrape_github_open_data(limit: int = 200) -> list[dict]:
    """
    Pulls from ML-focused job board APIs that are aggregated on GitHub
    and exposed as public JSON. No auth required.
    """
    log.info("Scraping GitHub-hosted open job datasets...")
    sources = [
        # These are real endpoints — community-maintained, no auth
        "https://raw.githubusercontent.com/tramcar/awesome-job-boards/master/README.md",
    ]
    # This source is mostly links, so we skip the raw parse and fall through.
    # This slot is kept for when you find a specific GitHub-hosted JSON feed to add.
    log.info("  (Add raw JSON URLs to sources[] in scrape_github_open_data to populate)")
    return []


# ── Normalize & Deduplicate ───────────────────────────────────────────────────

SKILL_ALIASES = {
    "langchain": "LangChain", "lang_chain": "LangChain",
    "llamaindex": "LlamaIndex", "llama_index": "LlamaIndex",
    "openai": "OpenAI API", "open ai": "OpenAI API",
    "anthropic": "Anthropic API",
    "hugging face": "Hugging Face", "huggingface": "Hugging Face",
    "pytorch": "PyTorch", "torch": "PyTorch",
    "tensorflow": "TensorFlow", "tf": "TensorFlow",
    "kubernetes": "Kubernetes", "k8s": "Kubernetes",
    "aws": "AWS", "amazon web services": "AWS",
    "gcp": "GCP", "google cloud": "GCP",
    "azure": "Azure", "microsoft azure": "Azure",
    "postgres": "PostgreSQL", "postgresql": "PostgreSQL",
    "pinecone": "Pinecone", "weaviate": "Weaviate",
    "faiss": "FAISS", "qdrant": "Qdrant",
    "mlflow": "MLflow", "ml flow": "MLflow",
    "fastapi": "FastAPI", "fast api": "FastAPI",
}

SKILL_PATTERNS = list(SKILL_ALIASES.keys()) + [
    "python", "sql", "docker", "git", "typescript", "javascript",
    "rag", "fine-tuning", "fine tuning", "finetuning",
    "vector database", "vector db", "embedding",
    "prompt engineering", "prompt engineer",
    "llm", "large language model", "generative ai",
    "rlhf", "reinforcement learning", "reward model",
    "mlops", "devops", "ci/cd", "redis", "kafka",
    "crewai", "langgraph", "autogen", "dspy",
    "ragas", "langsmith", "helicone", "evidently",
    "mistral", "cohere", "gemini", "llama", "claude",
]

def extract_skills(text: str) -> list[str]:
    t = text.lower()
    found = set()
    for pat in SKILL_PATTERNS:
        if pat in t:
            canonical = SKILL_ALIASES.get(pat, pat.title().replace(" ", ""))
            found.add(canonical)
    return sorted(found)

def normalize(jobs: list[dict]) -> list[dict]:
    seen_urls = set()
    out = []
    for j in jobs:
        url = j.get("url", "")
        if url and url in seen_urls:
            continue
        seen_urls.add(url)

        desc = j.get("description", "")
        j["skills_extracted"] = extract_skills(j.get("title", "") + " " + desc)

        # Normalize salary to a number where possible
        raw = str(j.get("salary_raw", "") or "")
        nums = re.findall(r"[\d,]+", raw.replace("k", "000"))
        nums = [int(n.replace(",", "")) for n in nums if int(n.replace(",", "")) > 1000]
        j["salary_min_usd"] = nums[0] if nums else None
        j["salary_max_usd"] = nums[1] if len(nums) > 1 else None

        out.append(j)
    return out


# ── CLI ───────────────────────────────────────────────────────────────────────

ALL_SOURCES = ["remoteok", "arbeitnow", "jobicy", "hn"]

def main():
    p = argparse.ArgumentParser(description="AI Roles Radar — Free Scraper")
    p.add_argument("--sources", nargs="+", default=ALL_SOURCES,
                   choices=ALL_SOURCES, help="Which sources to scrape")
    p.add_argument("--limit", type=int, default=300, help="Max jobs per source")
    p.add_argument("--hn-thread", type=int, default=None,
                   help="Override HN thread ID (find at news.ycombinator.com/submitted?id=whoishiring)")
    args = p.parse_args()

    all_jobs = []

    if "remoteok" in args.sources:
        jobs = scrape_remoteok(limit=args.limit)
        if jobs:
            jobs = normalize(jobs)
            save(jobs, "remoteok")
            all_jobs.extend(jobs)

    if "arbeitnow" in args.sources:
        jobs = scrape_arbeitnow(limit=args.limit)
        if jobs:
            jobs = normalize(jobs)
            save(jobs, "arbeitnow")
            all_jobs.extend(jobs)

    if "jobicy" in args.sources:
        jobs = scrape_jobicy(limit=min(args.limit, 50))
        if jobs:
            jobs = normalize(jobs)
            save(jobs, "jobicy")
            all_jobs.extend(jobs)

    if "hn" in args.sources:
        jobs = scrape_hn_hiring(thread_id=args.hn_thread, limit=args.limit)
        if jobs:
            jobs = normalize(jobs)
            save(jobs, "hn_hiring")
            all_jobs.extend(jobs)

    print(f"\n  Total scraped: {len(all_jobs)} AI-relevant jobs")
    print(f"  Files written to: {RAW_DIR.resolve()}")
    print(f"\n  Next step → run the aggregator:")
    print(f"  python analyze_jobs.py --aggregate\n")


if __name__ == "__main__":
    main()



