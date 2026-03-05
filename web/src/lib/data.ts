// ─────────────────────────────────────────────────────────────────────────────
// data.ts — central types, color maps, helpers, and rich demo fallback data
// ─────────────────────────────────────────────────────────────────────────────

export interface Job {
  title: string;
  company: string;
  location: string;
  remote_policy: string;
  seniority: string;
  role_type: string;
  skills: string[];
  salary_min_usd: number | null;
  salary_max_usd: number | null;
  salary_raw: string;
  source: string;
  scraped_at: string;
  url: string;
  description: string;
  external_id?: string;
  tags?: string[];
}

export interface FreqItem {
  name: string;
  count: number;
}

export interface SalaryStats {
  median: number | null;
  p25: number | null;
  p75: number | null;
  sample_size: number;
  by_seniority: Record<string, number | null>;
  by_role_type: Record<string, number | null>;
}

export interface TrendPoint {
  month: string;
  count: number;
  median_salary: number | null;
  top_skills: FreqItem[];
  role_types: FreqItem[];
}

export interface AggregatedData {
  meta: {
    total_jobs: number;
    generated_at: string;
    sources_scraped: {
      scraped_at: string;
      source: string;
      count: number;
      file: string;
    }[];
  };
  stats: {
    top_skills: FreqItem[];
    role_types: FreqItem[];
    seniority: FreqItem[];
    remote_policy: FreqItem[];
    locations: FreqItem[];
    sources: FreqItem[];
    salary: SalaryStats;
    trend: TrendPoint[];
  };
  jobs: Job[];
  _demo?: boolean;
}

// ─── Color palettes ───────────────────────────────────────────────────────────
export const ROLE_COLORS: Record<string, string> = {
  Agents: "#b8ff3c",
  "RAG / Search": "#3cf0ff",
  "MLOps / Platform": "#9d7cff",
  "Fine-tuning / RLHF": "#ff6b4a",
  Evaluation: "#3dffa0",
  "Full-Stack AI": "#ffc93c",
  Research: "#ff4a7a",
  "Generalist AI Eng": "#c8c8c8",
};

export const REMOTE_COLORS: Record<string, string> = {
  remote: "#3dffa0",
  hybrid: "#3cf0ff",
  "on-site": "#ff4a7a",
  "not specified": "#383838",
};

export const CAT_COLORS: Record<string, string> = {
  lang: "#b8ff3c",
  framework: "#3cf0ff",
  cloud: "#ff6b4a",
  llm: "#9d7cff",
  vector: "#3dffa0",
  other: "#707070",
};

export const CAT_HEX: Record<string, number> = {
  lang: 0xb8ff3c,
  framework: 0x3cf0ff,
  cloud: 0xff6b4a,
  llm: 0x9d7cff,
  vector: 0x3dffa0,
  other: 0x707070,
};

export const SENIORITY_COLORS: Record<string, string> = {
  junior: "#3cf0ff",
  mid: "#c8c8c8",
  senior: "#b8ff3c",
  staff: "#ffc93c",
  lead: "#ff6b4a",
  principal: "#9d7cff",
};

export const TREND_PALETTE = [
  "#b8ff3c",
  "#3cf0ff",
  "#9d7cff",
  "#ff6b4a",
  "#3dffa0",
  "#ffc93c",
  "#ff4a7a",
];

export function getColor(
  map: Record<string, string>,
  key: string,
  fallback = "#707070",
): string {
  return map[key] ?? fallback;
}

export function inferCat(name: string): string {
  const n = name.toLowerCase();
  if (
    [
      "python",
      "typescript",
      "javascript",
      "sql",
      "go",
      "rust",
      "java",
      "c++",
      "scala",
    ].some((k) => n.includes(k))
  )
    return "lang";
  if (
    [
      "aws",
      "gcp",
      "azure",
      "kubernetes",
      "k8s",
      "terraform",
      "docker",
      "vercel",
      "railway",
    ].some((k) => n.includes(k))
  )
    return "cloud";
  if (
    [
      "openai",
      "anthropic",
      "cohere",
      "mistral",
      "gemini",
      "llama",
      "gpt",
      "claude",
    ].some((k) => n.includes(k))
  )
    return "llm";
  if (
    [
      "pinecone",
      "weaviate",
      "qdrant",
      "chroma",
      "faiss",
      "pgvector",
      "milvus",
      "vespa",
    ].some((k) => n.includes(k))
  )
    return "vector";
  return "framework";
}

// ─── Compute stats from raw flat job array ────────────────────────────────────
export function computeStats(jobs: Job[]): AggregatedData["stats"] {
  const freq = (fn: (j: Job) => string | string[]): FreqItem[] => {
    const c: Record<string, number> = {};
    jobs.forEach((j) => {
      const vals = fn(j);
      const arr = Array.isArray(vals) ? vals : [vals];
      arr.forEach((v) => {
        if (v && v !== "not specified" && v !== "unknown" && v !== "")
          c[v] = (c[v] ?? 0) + 1;
      });
    });
    return Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  };

  const sals = jobs
    .map((j) => j.salary_min_usd)
    .filter((v): v is number => !!v && v > 20_000)
    .sort((a, b) => a - b);
  const med = sals.length ? sals[Math.floor(sals.length / 2)] : null;

  const byS: Record<string, number | null> = {};
  ["junior", "mid", "senior", "staff", "lead", "principal"].forEach((lv) => {
    const a = jobs
      .filter(
        (j) =>
          j.seniority === lv && j.salary_min_usd && j.salary_min_usd > 20_000,
      )
      .map((j) => j.salary_min_usd as number)
      .sort((a, b) => a - b);
    byS[lv] = a.length ? a[Math.floor(a.length / 2)] : null;
  });

  const byMonth: Record<string, Job[]> = {};
  jobs.forEach((j) => {
    const d = j.scraped_at ? new Date(j.scraped_at) : null;
    const key =
      d && !isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : "unknown";
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(j);
  });

  const trend: TrendPoint[] = Object.entries(byMonth)
    .filter(([k]) => k !== "unknown")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, batch]) => {
      const bs = batch
        .map((j) => j.salary_min_usd)
        .filter((v): v is number => !!v && v > 20_000)
        .sort((a, b) => a - b);
      const sk: Record<string, number> = {};
      const rl: Record<string, number> = {};
      batch.forEach((j) => {
        (j.skills ?? []).forEach((s) => {
          sk[s] = (sk[s] ?? 0) + 1;
        });
        if (j.role_type) rl[j.role_type] = (rl[j.role_type] ?? 0) + 1;
      });
      return {
        month,
        count: batch.length,
        median_salary: bs.length ? bs[Math.floor(bs.length / 2)] : null,
        top_skills: Object.entries(sk)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([name, count]) => ({ name, count })),
        role_types: Object.entries(rl)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count })),
      };
    });

  return {
    top_skills: freq((j) => j.skills ?? []),
    role_types: freq((j) => j.role_type ?? ""),
    seniority: freq((j) => j.seniority ?? ""),
    remote_policy: freq((j) => j.remote_policy ?? ""),
    locations: freq((j) => j.location?.split(",")[0]?.trim() ?? ""),
    sources: freq((j) => j.source ?? ""),
    salary: {
      median: med,
      p25: sals[Math.floor(sals.length * 0.25)] ?? null,
      p75: sals[Math.floor(sals.length * 0.75)] ?? null,
      sample_size: sals.length,
      by_seniority: byS,
      by_role_type: {},
    },
    trend,
  };
}

// ─── Demo trend data (2022 → 2026) ───────────────────────────────────────────
export const DEMO_TREND: TrendPoint[] = [
  {
    month: "2022-01",
    count: 38,
    median_salary: 110000,
    top_skills: [
      { name: "Python", count: 34 },
      { name: "TensorFlow", count: 18 },
      { name: "AWS", count: 12 },
    ],
    role_types: [
      { name: "Research", count: 16 },
      { name: "MLOps / Platform", count: 12 },
    ],
  },
  {
    month: "2022-06",
    count: 72,
    median_salary: 118000,
    top_skills: [
      { name: "Python", count: 65 },
      { name: "PyTorch", count: 30 },
      { name: "AWS", count: 22 },
    ],
    role_types: [
      { name: "Research", count: 28 },
      { name: "MLOps / Platform", count: 22 },
      { name: "Generalist AI Eng", count: 16 },
    ],
  },
  {
    month: "2023-01",
    count: 155,
    median_salary: 128000,
    top_skills: [
      { name: "Python", count: 138 },
      { name: "LLMs", count: 75 },
      { name: "LangChain", count: 32 },
      { name: "AWS", count: 55 },
    ],
    role_types: [
      { name: "RAG / Search", count: 52 },
      { name: "Agents", count: 38 },
      { name: "MLOps / Platform", count: 42 },
    ],
  },
  {
    month: "2023-06",
    count: 310,
    median_salary: 139000,
    top_skills: [
      { name: "Python", count: 282 },
      { name: "LLMs", count: 168 },
      { name: "LangChain", count: 105 },
      { name: "RAG", count: 88 },
      { name: "OpenAI API", count: 95 },
    ],
    role_types: [
      { name: "RAG / Search", count: 110 },
      { name: "Agents", count: 82 },
      { name: "MLOps / Platform", count: 78 },
    ],
  },
  {
    month: "2024-01",
    count: 570,
    median_salary: 150000,
    top_skills: [
      { name: "Python", count: 510 },
      { name: "LLMs", count: 345 },
      { name: "RAG", count: 235 },
      { name: "LangChain", count: 210 },
      { name: "OpenAI API", count: 188 },
    ],
    role_types: [
      { name: "RAG / Search", count: 195 },
      { name: "Agents", count: 162 },
      { name: "MLOps / Platform", count: 130 },
    ],
  },
  {
    month: "2024-06",
    count: 870,
    median_salary: 161000,
    top_skills: [
      { name: "Python", count: 792 },
      { name: "LLMs", count: 590 },
      { name: "RAG", count: 440 },
      { name: "LangChain", count: 355 },
      { name: "LangGraph", count: 185 },
    ],
    role_types: [
      { name: "Agents", count: 260 },
      { name: "RAG / Search", count: 242 },
      { name: "MLOps / Platform", count: 188 },
    ],
  },
  {
    month: "2025-01",
    count: 1180,
    median_salary: 171000,
    top_skills: [
      { name: "Python", count: 1062 },
      { name: "LLMs", count: 895 },
      { name: "RAG", count: 680 },
      { name: "LangGraph", count: 420 },
      { name: "OpenAI API", count: 510 },
    ],
    role_types: [
      { name: "Agents", count: 390 },
      { name: "RAG / Search", count: 310 },
      { name: "Full-Stack AI", count: 230 },
    ],
  },
  {
    month: "2025-06",
    count: 1490,
    median_salary: 178000,
    top_skills: [
      { name: "Python", count: 1360 },
      { name: "LLMs", count: 1180 },
      { name: "RAG", count: 950 },
      { name: "LangGraph", count: 620 },
      { name: "CrewAI", count: 310 },
    ],
    role_types: [
      { name: "Agents", count: 510 },
      { name: "RAG / Search", count: 395 },
      { name: "Full-Stack AI", count: 295 },
    ],
  },
  {
    month: "2026-03",
    count: 1765,
    median_salary: 185000,
    top_skills: [
      { name: "Python", count: 1620 },
      { name: "LLMs", count: 1450 },
      { name: "RAG", count: 1180 },
      { name: "LangGraph", count: 780 },
      { name: "OpenAI API", count: 875 },
    ],
    role_types: [
      { name: "Agents", count: 620 },
      { name: "RAG / Search", count: 470 },
      { name: "Full-Stack AI", count: 355 },
      { name: "MLOps / Platform", count: 310 },
    ],
  },
];

// ─── Rich demo jobs ───────────────────────────────────────────────────────────
export const DEMO_JOBS: Job[] = [
  {
    title: "Senior AI Engineer",
    company: "Stripe",
    location: "Remote",
    remote_policy: "remote",
    seniority: "senior",
    role_type: "Agents",
    skills: [
      "Python",
      "LangGraph",
      "OpenAI API",
      "FastAPI",
      "Docker",
      "PostgreSQL",
    ],
    salary_min_usd: 165000,
    salary_max_usd: 205000,
    salary_raw: "$165–205k",
    source: "remoteok",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Build AI agents for financial automation at scale.",
  },
  {
    title: "ML Engineer – LLMs",
    company: "Airbnb",
    location: "San Francisco, CA",
    remote_policy: "hybrid",
    seniority: "senior",
    role_type: "RAG / Search",
    skills: [
      "Python",
      "PyTorch",
      "Hugging Face",
      "AWS",
      "LlamaIndex",
      "pgvector",
    ],
    salary_min_usd: 158000,
    salary_max_usd: 195000,
    salary_raw: "$158–195k",
    source: "arbeitnow",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "LLM-powered search and recommendation systems.",
  },
  {
    title: "AI Platform Engineer",
    company: "Shopify",
    location: "Remote",
    remote_policy: "remote",
    seniority: "mid",
    role_type: "MLOps / Platform",
    skills: ["Python", "Kubernetes", "MLflow", "AWS", "Docker", "Terraform"],
    salary_min_usd: 142000,
    salary_max_usd: 175000,
    salary_raw: "$142–175k",
    source: "arbeitnow",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Scale AI infra for millions of merchants.",
  },
  {
    title: "LLM Fine-tuning Engineer",
    company: "HuggingFace",
    location: "Remote",
    remote_policy: "remote",
    seniority: "mid",
    role_type: "Fine-tuning / RLHF",
    skills: ["Python", "PyTorch", "LoRA", "PEFT", "Hugging Face", "RLHF"],
    salary_min_usd: 132000,
    salary_max_usd: 168000,
    salary_raw: "$132–168k",
    source: "remoteok",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Fine-tune foundation models on specialized domains.",
  },
  {
    title: "Applied AI Engineer",
    company: "OpenAI",
    location: "San Francisco, CA",
    remote_policy: "on-site",
    seniority: "senior",
    role_type: "Agents",
    skills: [
      "Python",
      "OpenAI API",
      "LangGraph",
      "FastAPI",
      "Kubernetes",
      "Evals",
    ],
    salary_min_usd: 215000,
    salary_max_usd: 290000,
    salary_raw: "$215–290k",
    source: "hn",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Build next-gen multi-agent systems.",
  },
  {
    title: "Junior AI Engineer",
    company: "StartupXYZ",
    location: "Remote",
    remote_policy: "remote",
    seniority: "junior",
    role_type: "RAG / Search",
    skills: ["Python", "LangChain", "Pinecone", "FastAPI", "SQL"],
    salary_min_usd: 82000,
    salary_max_usd: 105000,
    salary_raw: "$82–105k",
    source: "remoteok",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Build RAG pipelines for enterprise customers.",
  },
  {
    title: "AI Systems Engineer",
    company: "Anthropic",
    location: "San Francisco, CA",
    remote_policy: "on-site",
    seniority: "staff",
    role_type: "Research",
    skills: [
      "Python",
      "PyTorch",
      "RLHF",
      "Fine-tuning",
      "Evals",
      "Distributed Training",
    ],
    salary_min_usd: 235000,
    salary_max_usd: 315000,
    salary_raw: "$235–315k",
    source: "hn",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Train and evaluate frontier AI models safely.",
  },
  {
    title: "AI Product Engineer",
    company: "Linear",
    location: "Remote",
    remote_policy: "remote",
    seniority: "mid",
    role_type: "Full-Stack AI",
    skills: [
      "TypeScript",
      "Python",
      "OpenAI API",
      "LangChain",
      "FastAPI",
      "Next.js",
    ],
    salary_min_usd: 140000,
    salary_max_usd: 180000,
    salary_raw: "$140–180k",
    source: "remoteok",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Ship AI features across the full product surface.",
  },
  {
    title: "ML Infra Engineer",
    company: "Uber",
    location: "New York, NY",
    remote_policy: "hybrid",
    seniority: "senior",
    role_type: "MLOps / Platform",
    skills: ["Python", "Kubernetes", "Terraform", "AWS", "MLflow", "Spark"],
    salary_min_usd: 170000,
    salary_max_usd: 210000,
    salary_raw: "$170–210k",
    source: "arbeitnow",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "ML infrastructure serving billions of requests daily.",
  },
  {
    title: "Conversational AI Engineer",
    company: "Nubank",
    location: "Remote",
    remote_policy: "remote",
    seniority: "mid",
    role_type: "Agents",
    skills: [
      "Python",
      "LangChain",
      "LlamaIndex",
      "FastAPI",
      "Pinecone",
      "Weaviate",
    ],
    salary_min_usd: 115000,
    salary_max_usd: 148000,
    salary_raw: "$115–148k",
    source: "arbeitnow",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Build AI agents for 95M+ customers.",
  },
  {
    title: "AI Research Engineer",
    company: "DeepMind",
    location: "London, UK",
    remote_policy: "hybrid",
    seniority: "senior",
    role_type: "Research",
    skills: ["Python", "PyTorch", "RLHF", "Hugging Face", "TensorFlow", "JAX"],
    salary_min_usd: 128000,
    salary_max_usd: 168000,
    salary_raw: "£95–125k",
    source: "arbeitnow",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Fundamental AI safety and capability research.",
  },
  {
    title: "LLM Evaluation Engineer",
    company: "Scale AI",
    location: "San Francisco, CA",
    remote_policy: "hybrid",
    seniority: "senior",
    role_type: "Evaluation",
    skills: ["Python", "RAGAS", "LangSmith", "Evals", "SQL", "Statistics"],
    salary_min_usd: 178000,
    salary_max_usd: 218000,
    salary_raw: "$178–218k",
    source: "hn",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Design evaluation frameworks for frontier LLMs.",
  },
  {
    title: "Principal AI Engineer",
    company: "Figma",
    location: "San Francisco, CA",
    remote_policy: "hybrid",
    seniority: "staff",
    role_type: "Full-Stack AI",
    skills: ["TypeScript", "Python", "OpenAI API", "LangGraph", "AWS", "React"],
    salary_min_usd: 248000,
    salary_max_usd: 325000,
    salary_raw: "$248–325k",
    source: "hn",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Lead AI strategy across the design platform.",
  },
  {
    title: "Backend + AI Engineer",
    company: "Mistral",
    location: "Paris, France",
    remote_policy: "hybrid",
    seniority: "mid",
    role_type: "Full-Stack AI",
    skills: ["Python", "Rust", "FastAPI", "Docker", "LangChain", "TypeScript"],
    salary_min_usd: 108000,
    salary_max_usd: 138000,
    salary_raw: "€92–118k",
    source: "arbeitnow",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Build infra powering Mistral's frontier models.",
  },
  {
    title: "AI Infrastructure Engineer",
    company: "Cohere",
    location: "Remote",
    remote_policy: "remote",
    seniority: "senior",
    role_type: "MLOps / Platform",
    skills: ["Python", "Kubernetes", "AWS", "GCP", "Terraform", "MLflow"],
    salary_min_usd: 158000,
    salary_max_usd: 198000,
    salary_raw: "$158–198k",
    source: "remoteok",
    scraped_at: "2026-03-05T10:00:00Z",
    url: "",
    description: "Cloud infrastructure for enterprise AI deployments.",
  },
];
