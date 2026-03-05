"""
AI Roles Radar — Free Aggregator
──────────────────────────────────
Turns raw scraped JSON files into aggregated.json for the dashboard.
100% free — no LLM, no API keys. Pure rule-based extraction.

Run after scrape_jobs.py:

  python aggregate_free.py
  python aggregate_free.py --input ../data/raw --output ../data/aggregated/aggregated.json
"""

import re
import json
import argparse
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter, defaultdict


# ── Skill extraction patterns ─────────────────────────────────────────────────

SKILLS_MAP = {

    # Languages
    "Python": [r"\bpython\b"],
    "TypeScript": [r"\btypescript\b", r"\bts\b"],
    "JavaScript": [r"\bjavascript\b", r"\bjs\b"],
    "SQL": [r"\bsql\b", r"\bpostgresql\b", r"\bmysql\b"],
    "Go": [r"\bgolang\b", r"\bgo\b"],
    "Rust": [r"\brust\b"],

    # AI / LLM
    "LLMs": [r"\bllm\b", r"\blarge language model", r"\bgpt\b", r"\bclaude\b", r"\bgemini\b"],
    "RAG": [r"\brag\b", r"\bretrieval.augmented", r"\bretrieval augmented"],
    "Prompt Engineering": [r"\bprompt engineer", r"\bprompting\b"],
    "Fine-tuning": [r"\bfine.tun", r"\bfinetuning\b", r"\blora\b", r"\bpeft\b", r"\brlhf\b"],
    "Embeddings": [r"\bembedding\b", r"\bvector embed"],
    "Agents": [r"\bagent\b", r"\bagentic\b", r"\bmulti.agent"],
    "Evaluation": [r"\beval\b", r"\bevaluation\b", r"\bragas\b", r"\bbleu\b"],

    # Frameworks
    "LangChain": [r"\blangchain\b"],
    "LlamaIndex": [r"\bllamaindex\b", r"\bllama.index\b"],
    "LangGraph": [r"\blanggraph\b"],
    "CrewAI": [r"\bcrewai\b"],
    "AutoGen": [r"\bautogen\b"],
    "DSPy": [r"\bdspy\b"],
    "Hugging Face": [r"\bhugging.face\b", r"\bhuggingface\b", r"\btransformers\b"],
    "PyTorch": [r"\bpytorch\b", r"\btorch\b"],
    "TensorFlow": [r"\btensorflow\b"],
    "FastAPI": [r"\bfastapi\b"],

    # Vector DBs
    "Pinecone": [r"\bpinecone\b"],
    "Weaviate": [r"\bweaviate\b"],
    "FAISS": [r"\bfaiss\b"],
    "Qdrant": [r"\bqdrant\b"],
    "pgvector": [r"\bpgvector\b"],
    "Chroma": [r"\bchromadb\b", r"\bchroma\b"],

    # Cloud
    "AWS": [r"\baws\b", r"\bamazon web services\b"],
    "GCP": [r"\bgcp\b", r"\bgoogle cloud\b"],
    "Azure": [r"\bazure\b"],
    "Vercel": [r"\bvercel\b"],

    # LLM Providers
    "OpenAI API": [r"\bopenai\b"],
    "Anthropic API": [r"\banthropic\b"],
    "Cohere": [r"\bcohere\b"],
    "Mistral": [r"\bmistral\b"],
    "Google Gemini": [r"\bgemini\b"],
    "Llama (Meta)": [r"\bllama\b", r"\bmeta ai\b"],

    # Ops
    "Docker": [r"\bdocker\b"],
    "Kubernetes": [r"\bkubernetes\b", r"\bk8s\b"],
    "MLflow": [r"\bmlflow\b"],
    "LangSmith": [r"\blangsmith\b"],
    "Terraform": [r"\bterraform\b"],
}


ROLE_TYPE_RULES = [
    ("Fine-tuning / RLHF",  [r"\bfine.tun", r"\brlhf\b", r"\bpeft\b", r"\blora\b"]),
    ("Agents",              [r"\bagent\b", r"\bagentic\b", r"\borchestrat"]),
    ("RAG / Search",        [r"\brag\b", r"\bretrieval", r"\bsemantic search"]),
    ("MLOps / Platform",    [r"\bmlops\b", r"\bplatform engineer", r"\binfrastructure"]),
    ("Research",            [r"\bresearch\b", r"\bpublication\b", r"\bphd\b"]),
    ("Evaluation",          [r"\beval\b", r"\bevaluation\b", r"\bbenchmark"]),
    ("Full-Stack AI",       [r"\bfull.stack\b", r"\bfrontend\b.*\bai\b", r"\bai.*frontend"]),
    ("Generalist AI Eng",   [r"\bai engineer\b", r"\bapplied ai\b", r"\bml engineer"]),
]


SENIORITY_RULES = [
    ("staff",    [r"\bstaff\b", r"\bprincipal\b", r"\bdistinguished\b"]),
    ("lead",     [r"\blead\b", r"\btech lead\b"]),
    ("senior",   [r"\bsenior\b", r"\bsr\b\.?\s", r"\b5\+\s*years?\b", r"\b7\+\s*years?\b"]),
    ("mid",      [r"\bmid\b", r"\bii\b", r"\b2\+\s*years?\b", r"\b3\+\s*years?\b"]),
    ("junior",   [r"\bjunior\b", r"\bjr\b\.?\s", r"\bentry.level\b", r"\b0.2\s*years?\b"]),
]


# ── Detection helpers ─────────────────────────────────────────────────────────

def detect_skills(text: str) -> list[str]:
    t = text.lower()
    return [
        skill
        for skill, patterns in SKILLS_MAP.items()
        if any(re.search(p, t) for p in patterns)
    ]


def detect_role_type(text: str) -> str:
    t = text.lower()
    for role, patterns in ROLE_TYPE_RULES:
        if any(re.search(p, t) for p in patterns):
            return role
    return "Generalist AI Eng"


def detect_seniority(title: str, desc: str) -> str:
    text = (title + " " + desc).lower()
    for level, patterns in SENIORITY_RULES:
        if any(re.search(p, text) for p in patterns):
            return level
    return "mid"


def detect_salary(text: str):

    text = text.replace(",", "")

    matches = re.findall(
        r"[\$£€]?\s*(\d{2,3})\s*k\b|[\$£€]?\s*(\d{5,6})\b",
        text,
        re.IGNORECASE
    )

    nums = []

    for m in matches:

        val = int(m[0]) * 1000 if m[0] else int(m[1])

        if 20000 <= val <= 800000:
            nums.append(val)

    nums = sorted(set(nums))

    return (
        nums[0] if nums else None,
        nums[-1] if len(nums) > 1 else None
    )


def detect_location(text: str):

    cities = [
        "San Francisco",
        "New York",
        "London",
        "Berlin",
        "Amsterdam",
        "Toronto",
        "Austin",
        "Seattle",
        "Boston",
        "Paris",
        "Remote"
    ]

    t = text.lower()

    for city in cities:
        if city.lower() in t:
            return city

    return "Not specified"


# ── Load raw files ───────────────────────────────────────────────────────────

def load_raw_files(raw_dir):

    raw_path = Path(raw_dir)

    all_jobs = []

    for f in sorted(raw_path.glob("*.json")):

        if f.name == "scrape_log.jsonl":
            continue

        try:

            data = json.loads(f.read_text())

            if isinstance(data, list):
                all_jobs.extend(data)

            elif isinstance(data, dict):
                all_jobs.append(data)

        except Exception as e:
            print(f"Skipping {f.name}: {e}")

    return all_jobs


# ── Enrich job records ───────────────────────────────────────────────────────

def enrich(job):

    title = job.get("title", "")

    desc = job.get("description", "")

    full = title + " " + desc

    skills = job.get("skills_extracted") or detect_skills(full)

    sal_min = job.get("salary_min_usd") or detect_salary(full)[0]

    sal_max = job.get("salary_max_usd") or detect_salary(full)[1]

    return {

        **job,

        "title": title,

        "company": job.get("company", "Unknown"),

        "location": job.get("location") or detect_location(full),

        "remote_policy": job.get("remote_policy", "not specified"),

        "seniority": detect_seniority(title, desc),

        "role_type": detect_role_type(full),

        "skills": skills,

        "salary_min_usd": sal_min,

        "salary_max_usd": sal_max,

        "scraped_at": job.get("scraped_at", ""),

        "source": job.get("source", "unknown"),

    }


# ── Trend chart data ─────────────────────────────────────────────────────────

def build_trend_data(jobs):

    by_month = defaultdict(list)

    for j in jobs:

        raw_date = j.get("scraped_at") or j.get("posted_at") or ""

        try:
            dt = datetime.fromisoformat(raw_date.replace("Z",""))
            key = dt.strftime("%Y-%m")
        except Exception:
            key = "unknown"

        by_month[key].append(j)

    trend = []

    for month in sorted(by_month):

        batch = by_month[month]

        skill_counts = Counter(
            s for j in batch for s in j.get("skills", [])
        )

        role_counts = Counter(
            j.get("role_type","") for j in batch
        )

        sals = [
            j["salary_min_usd"]
            for j in batch
            if j.get("salary_min_usd")
        ]

        trend.append({

            "month": month,

            "count": len(batch),

            "median_salary":
                sorted(sals)[len(sals)//2] if sals else None,

            "top_skills":
                [
                    {"name":k,"count":v}
                    for k,v in skill_counts.most_common(10)
                ],

            "role_types":
                [
                    {"name":k,"count":v}
                    for k,v in role_counts.most_common()
                ]

        })

    return trend


# ── Aggregation ──────────────────────────────────────────────────────────────

def aggregate(raw_dir, output_file):

    print(f"\nLoading raw files from {raw_dir}...")

    jobs = load_raw_files(raw_dir)

    if not jobs:
        print("No jobs found. Run scrape_jobs.py first.")
        return

    print(f"Enriching {len(jobs)} jobs...")

    jobs = [enrich(j) for j in jobs]

    seen = set()

    deduped = []

    for j in jobs:

        key = j.get("url") or (j.get("company","") + j.get("title",""))

        if key not in seen:

            seen.add(key)

            deduped.append(j)

    print(f"After dedup: {len(deduped)} jobs")

    def freq(key):

        vals = []

        for j in deduped:

            v = j.get(key)

            if isinstance(v,list):
                vals.extend(v)

            elif v and v not in ("not specified","unknown",""):
                vals.append(v)

        return [
            {"name":k,"count":v}
            for k,v in Counter(vals).most_common(40)
        ]

    sals = [
        j["salary_min_usd"]
        for j in deduped
        if j.get("salary_min_usd")
    ]

    sals.sort()

    aggregated = {

        "meta": {

            "total_jobs": len(deduped),

            "generated_at": datetime.now(timezone.utc).isoformat(),

            "raw_dir": str(Path(raw_dir).resolve()),

        },

        "stats": {

            "top_skills": freq("skills"),

            "role_types": freq("role_type"),

            "seniority": freq("seniority"),

            "locations": freq("location"),

        },

        "jobs": deduped,

    }

    out = Path(output_file)

    out.parent.mkdir(parents=True, exist_ok=True)

    out.write_text(json.dumps(aggregated, indent=2))

    print(f"aggregated.json written → {out}")
    

if __name__ == "__main__":

    p = argparse.ArgumentParser()

    p.add_argument("--input", default="../data/raw")

    p.add_argument("--output", default="../data/aggregated/aggregated.json")

    args = p.parse_args()

    aggregate(args.input, args.output)