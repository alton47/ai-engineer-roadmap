"""
AI Roles Radar — Batch Job Analyzer
────────────────────────────────────
Processes hundreds of job postings in ~60 seconds using
Anthropic's Batch API. Extracts structured data from raw
text and dumps clean JSON ready for the web dashboard.

Usage:
    python analyze_jobs.py --input ../data/raw --output ../data/analyzed
    python analyze_jobs.py --input ../data/raw --output ../data/analyzed --limit 50
    python analyze_jobs.py --aggregate  # merge all analyzed → aggregated.json
"""

import os
import json
import time
import argparse
import asyncio
from pathlib import Path
from datetime import datetime

import anthropic

# ─── Config ──────────────────────────────────────────────────────────────────

MODEL = "claude-sonnet-4-20250514"
BATCH_SIZE = 100          # Anthropic batch API max per request
MAX_TOKENS = 600
DELAY_BETWEEN_POLLS = 5   # seconds

EXTRACTION_PROMPT = """
You are a precise data extractor. Given a raw job posting, return ONLY a valid JSON object — no markdown, no explanation.

Extract exactly these fields:

{
  "title": "exact job title",
  "company": "company name",
  "location": "city, country (or Remote)",
  "seniority": "junior | mid | senior | staff | principal | lead | not specified",
  "salary_min": null or number in USD/year,
  "salary_max": null or number in USD/year,
  "salary_currency": "USD | EUR | GBP | INR | null",
  "employment_type": "full-time | part-time | contract | not specified",
  "remote_policy": "remote | hybrid | on-site | not specified",
  "primary_role_type": "RAG | Agents | MLOps | Fine-tuning | Evaluation | Platform | Research | Full-Stack AI | Generalist AI | Other",
  "skills": ["list", "of", "technical", "skills"],
  "frameworks": ["LangChain", "LlamaIndex", "etc"],
  "cloud_platforms": ["AWS", "GCP", "Azure", "etc"],
  "llm_providers": ["OpenAI", "Anthropic", "Cohere", "etc"],
  "years_experience_required": null or number,
  "education_required": "BS | MS | PhD | not specified",
  "top_responsibilities": ["max 5 bullet points summarizing key duties"],
  "key_requirements": ["max 5 most important requirements"],
  "industry": "healthcare | fintech | ecommerce | infra | enterprise | startup | other",
  "posting_source": "builtin | linkedin | greenhouse | lever | unknown",
  "scraped_date": null
}

If a field cannot be determined, use null. For skills/frameworks/cloud_platforms/llm_providers, return empty list [] if none found.

JOB POSTING:
"""

# ─── File Loaders ─────────────────────────────────────────────────────────────

def load_job_files(input_dir: str, limit: int = None) -> list[dict]:
    """Load job postings from .txt, .yaml, .yml, or .json files."""
    input_path = Path(input_dir)
    supported = [".txt", ".yaml", ".yml", ".json", ".md"]
    files = [f for f in input_path.rglob("*") if f.suffix.lower() in supported]

    if limit:
        files = files[:limit]

    jobs = []
    for f in files:
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
            jobs.append({"file": str(f.name), "raw_text": text})
        except Exception as e:
            print(f"  ⚠  Skipped {f.name}: {e}")

    print(f"  Loaded {len(jobs)} job files from {input_dir}")
    return jobs


# ─── Batch API ────────────────────────────────────────────────────────────────

def build_batch_requests(jobs: list[dict]) -> list[dict]:
    """Convert job dicts into Anthropic batch request format."""
    requests = []
    for i, job in enumerate(jobs):
        requests.append({
            "custom_id": f"job_{i:05d}_{job['file'][:40]}",
            "params": {
                "model": MODEL,
                "max_tokens": MAX_TOKENS,
                "messages": [
                    {
                        "role": "user",
                        "content": EXTRACTION_PROMPT + "\n\n" + job["raw_text"][:3000]
                    }
                ]
            }
        })
    return requests


def submit_batch(client: anthropic.Anthropic, requests: list[dict]) -> str:
    """Submit a batch and return the batch ID."""
    print(f"  Submitting batch of {len(requests)} requests...")
    batch = client.messages.batches.create(requests=requests)
    print(f"  Batch ID: {batch.id}  |  Status: {batch.processing_status}")
    return batch.id


def poll_until_done(client: anthropic.Anthropic, batch_id: str) -> None:
    """Poll batch status until ended."""
    while True:
        batch = client.messages.batches.retrieve(batch_id)
        counts = batch.request_counts
        print(
            f"  [{datetime.now().strftime('%H:%M:%S')}] "
            f"processing={counts.processing}  "
            f"succeeded={counts.succeeded}  "
            f"errored={counts.errored}  "
            f"status={batch.processing_status}"
        )
        if batch.processing_status == "ended":
            break
        time.sleep(DELAY_BETWEEN_POLLS)


def collect_results(client: anthropic.Anthropic, batch_id: str) -> list[dict]:
    """Collect and parse all results from a finished batch."""
    results = []
    for result in client.messages.batches.results(batch_id):
        if result.result.type == "succeeded":
            raw_text = result.result.message.content[0].text.strip()
            # Strip any accidental markdown fences
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            try:
                parsed = json.loads(raw_text)
                parsed["_batch_id"] = batch_id
                parsed["_custom_id"] = result.custom_id
                results.append(parsed)
            except json.JSONDecodeError as e:
                print(f"  ⚠  JSON parse failed for {result.custom_id}: {e}")
        else:
            print(f"  ✗  {result.custom_id} → {result.result.type}")
    return results


# ─── Single-File Fallback (no batch) ─────────────────────────────────────────

def analyze_single(client: anthropic.Anthropic, job_text: str) -> dict:
    """Synchronous single-job analysis for testing or small sets."""
    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": EXTRACTION_PROMPT + "\n\n" + job_text[:3000]}]
    )
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


# ─── Aggregator ───────────────────────────────────────────────────────────────

def aggregate(analyzed_dir: str, output_file: str) -> None:
    """
    Merge all analyzed JSON files into one aggregated.json
    with precomputed stats for the dashboard.
    """
    analyzed_path = Path(analyzed_dir)
    all_jobs = []

    for f in analyzed_path.glob("*.json"):
        try:
            with open(f) as fp:
                data = json.load(fp)
                if isinstance(data, list):
                    all_jobs.extend(data)
                elif isinstance(data, dict):
                    all_jobs.append(data)
        except Exception as e:
            print(f"  ⚠  Skipped {f.name}: {e}")

    print(f"  Aggregating {len(all_jobs)} jobs...")

    # ── Frequency counters ──
    def freq(key):
        from collections import Counter
        vals = []
        for j in all_jobs:
            v = j.get(key)
            if isinstance(v, list):
                vals.extend(v)
            elif v and v != "not specified" and v is not None:
                vals.append(v)
        return [{"name": k, "count": v} for k, v in Counter(vals).most_common(50)]

    # ── Salary stats ──
    salaries = [
        j["salary_min"] for j in all_jobs
        if isinstance(j.get("salary_min"), (int, float)) and j["salary_min"] > 20000
    ]
    salary_stats = {
        "median": sorted(salaries)[len(salaries) // 2] if salaries else None,
        "p25": sorted(salaries)[len(salaries) // 4] if salaries else None,
        "p75": sorted(salaries)[3 * len(salaries) // 4] if salaries else None,
        "min": min(salaries) if salaries else None,
        "max": max(salaries) if salaries else None,
        "sample_size": len(salaries)
    }

    # ── Remote distribution ──
    from collections import Counter
    remote_dist = Counter(
        j.get("remote_policy", "not specified") for j in all_jobs
    )

    aggregated = {
        "meta": {
            "total_jobs": len(all_jobs),
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "sources": ["builtin.com", "linkedin.com", "greenhouse.io", "lever.co"]
        },
        "stats": {
            "top_skills": freq("skills"),
            "top_frameworks": freq("frameworks"),
            "top_cloud_platforms": freq("cloud_platforms"),
            "top_llm_providers": freq("llm_providers"),
            "role_types": freq("primary_role_type"),
            "seniority_distribution": freq("seniority"),
            "locations": freq("location"),
            "industries": freq("industry"),
            "remote_policy": [{"name": k, "count": v} for k, v in remote_dist.items()],
            "salary": salary_stats
        },
        "jobs": all_jobs
    }

    out_path = Path(output_file)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(aggregated, f, indent=2)

    print(f"  ✓ Aggregated → {output_file}  ({len(all_jobs)} jobs)")


# ─── CLI ──────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="AI Roles Radar — Job Analyzer")
    p.add_argument("--input", default="../data/raw", help="Folder with raw job files")
    p.add_argument("--output", default="../data/analyzed", help="Where to save per-batch JSON")
    p.add_argument("--limit", type=int, default=None, help="Max jobs to process (for testing)")
    p.add_argument("--aggregate", action="store_true", help="Run aggregator only")
    p.add_argument("--aggregated-output", default="../data/aggregated/aggregated.json")
    p.add_argument("--use-batch-api", action="store_true", default=True,
                   help="Use Anthropic Batch API (default: True)")
    p.add_argument("--test-single", type=str, default=None,
                   help="Path to a single job file to test extraction")
    return p.parse_args()


def main():
    args = parse_args()
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise EnvironmentError("Set ANTHROPIC_API_KEY in your environment")

    client = anthropic.Anthropic(api_key=api_key)

    # ── Aggregate only ──
    if args.aggregate:
        aggregate(args.output, args.aggregated_output)
        return

    # ── Single file test ──
    if args.test_single:
        text = Path(args.test_single).read_text(encoding="utf-8", errors="ignore")
        result = analyze_single(client, text)
        print(json.dumps(result, indent=2))
        return

    # ── Full batch run ──
    t0 = time.time()
    jobs = load_job_files(args.input, limit=args.limit)
    if not jobs:
        print("No job files found. Check --input path.")
        return

    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)

    # Chunk into batches of BATCH_SIZE
    chunks = [jobs[i:i+BATCH_SIZE] for i in range(0, len(jobs), BATCH_SIZE)]
    print(f"\n  {len(jobs)} jobs → {len(chunks)} batch(es) of up to {BATCH_SIZE}")

    all_results = []
    for idx, chunk in enumerate(chunks):
        print(f"\n── Batch {idx+1}/{len(chunks)} ──────────────────────")
        requests = build_batch_requests(chunk)
        batch_id = submit_batch(client, requests)
        poll_until_done(client, batch_id)
        results = collect_results(client, batch_id)
        all_results.extend(results)

        # Save incrementally so progress is never lost
        batch_file = output_path / f"batch_{idx+1:03d}_{batch_id}.json"
        with open(batch_file, "w") as f:
            json.dump(results, f, indent=2)
        print(f"  ✓ Saved {len(results)} results → {batch_file.name}")

    elapsed = time.time() - t0
    print(f"\n  Done — {len(all_results)} jobs analyzed in {elapsed:.1f}s")
    print(f"  Now run with --aggregate to build aggregated.json for the dashboard.\n")


if __name__ == "__main__":
    main()