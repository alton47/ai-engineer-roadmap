"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageWrap, PageHeader, Section, Filters, FL, FB } from "@/lib/ui";

type BG = "beginner"|"backend"|"ds"|"ml"|"frontend";
type Status = "done"|"active"|"next"|"locked";

interface Step {
  phase: string;
  title: string;
  body: string;
  tags: string[];
  status: Status;
  accent: string;
}

const PATHS: Record<BG, Step[]> = {
  beginner: [
    { phase:"Phase 1", title:"Python & API Fundamentals", status:"done", accent:"#b8ff3c",
      body:"Variables, loops, functions, classes, type hints. Then REST APIs with requests. Build something real immediately — a CLI that hits a free public API and formats the output. Avoid tutorial hell: build first, learn as you hit walls.",
      tags:["Python","requests","JSON","dotenv","argparse","Jupyter","Pydantic"] },
    { phase:"Phase 2", title:"Your First LLM Integration", status:"done", accent:"#b8ff3c",
      body:"Call OpenAI or Anthropic API. Build a chatbot with conversation memory. Deeply understand tokens, context windows, system prompts, streaming responses, and temperature. This is where it all clicks — LLMs are just very sophisticated text-in-text-out APIs.",
      tags:["OpenAI API","Anthropic API","Streaming","Prompt Engineering","Chat History"] },
    { phase:"Phase 3", title:"RAG from Scratch", status:"active", accent:"#3cf0ff",
      body:"The #1 pattern in every job posting. Manually chunk a document, embed it, store vectors, retrieve on query, pass to LLM. Build this without LangChain first — the framework is much more intuitive once you understand the pattern at the API level.",
      tags:["LangChain","FAISS","Pinecone","Embeddings","Chunking","pgvector","LlamaIndex"] },
    { phase:"Phase 4", title:"Agents & Tool Use", status:"next", accent:"#9d7cff",
      body:"Give the LLM tools: web search, code execution, file I/O, database queries. Build a multi-step research agent that chains tool calls. This is where mid-level and senior AI engineering jobs live. LangGraph for stateful flows, CrewAI for multi-agent.",
      tags:["Tool Use","LangGraph","CrewAI","Function Calling","ReAct","AutoGen"] },
    { phase:"Phase 5", title:"Deploy & Ship Something Real", status:"locked", accent:"#ff6b4a",
      body:"FastAPI backend + Docker + Railway or Render. A live URL beats a 200-slide notebook every single time in a job application. Add basic structured logging, error handling, and a /health endpoint before showing it to anyone.",
      tags:["FastAPI","Docker","Railway","Render","GitHub Actions","Pydantic","Uvicorn"] },
    { phase:"Phase 6", title:"Evals — The Career Differentiator", status:"locked", accent:"#3dffa0",
      body:"Most beginners skip evaluation entirely. RAGAS for RAG quality, LangSmith for traces, LLM-as-judge for open-ended quality. This is what separates hireable engineers from tutorial-watchers. Every senior AI engineer obsesses over eval.",
      tags:["RAGAS","LangSmith","LLM-as-judge","Evals","Pytest","Benchmarks","Helicone"] },
    { phase:"Portfolio", title:"Two Projects, Deployed, Measured", status:"locked", accent:"#ffc93c",
      body:"One RAG app + one agent. Both live URLs. Both with evals showing quality metrics. Write a technical blog post explaining your chunking strategy, why you chose your vector DB, and what your eval scores show. Quality beats quantity.",
      tags:["GitHub","Portfolio","Technical Writing","Blog","Open Source"] },
  ],
  backend: [
    { phase:"Day 1", title:"Swap REST for LLM Calls", status:"done", accent:"#b8ff3c",
      body:"You already know APIs — the mental model is identical. Just call LLM endpoints instead of Stripe or Twilio. Understand tokens like you understand rate limits. Streaming like you understand chunked transfer. The hard part is behind you.",
      tags:["LLM APIs","Streaming","Rate Limits","Retry Logic","Token Budget"] },
    { phase:"Phase 1", title:"Prompt Engineering", status:"done", accent:"#b8ff3c",
      body:"System prompts, few-shot examples, chain-of-thought, structured output with Pydantic. This is your new SQL — it determines output quality as much as any other technical decision and takes real practice to get right.",
      tags:["System Prompts","CoT","Few-shot","Structured Output","Pydantic","JSON Mode"] },
    { phase:"Phase 2", title:"pgvector on Your Existing Stack", status:"active", accent:"#3cf0ff",
      body:"pgvector drops into Postgres with one extension. LangChain or LlamaIndex handle orchestration. You can add intelligent semantic search to any existing service without a full rebuild. This is the fastest path from backend to AI.",
      tags:["pgvector","RAG","Embeddings","LangChain","PostgreSQL","LlamaIndex"] },
    { phase:"Phase 3", title:"LLM Observability", status:"next", accent:"#9d7cff",
      body:"LangSmith for traces, RAGAS for retrieval quality, Helicone for cost tracking. Without observability you are genuinely flying blind in production AI. Your existing APM instincts apply perfectly here.",
      tags:["LangSmith","RAGAS","Helicone","Logging","Cost Tracking","Alerting"] },
    { phase:"Portfolio", title:"Add AI to Something You've Already Built", status:"locked", accent:"#3dffa0",
      body:"Take an existing project, add an intelligent layer. Document what you measured before and after. This framing — 'I added AI to a real service and measured the improvement' — is worth more than any greenfield demo.",
      tags:["Production","FastAPI","Docker","Evals","A/B Testing","GitHub"] },
  ],
  ds: [
    { phase:"Reframe", title:"Your Eval Skills Are Rare", status:"done", accent:"#b8ff3c",
      body:"BLEU, ROUGE, BERTScore, semantic similarity, statistical significance testing — you have these instincts and the AI engineering market desperately needs them. Most AI engineers cannot rigorously evaluate their own systems. Lead with this.",
      tags:["Evals","BERTScore","Statistical Testing","A/B Testing","BLEU","ROUGE"] },
    { phase:"Phase 1", title:"LLM APIs + When to Fine-tune", status:"done", accent:"#b8ff3c",
      body:"Call the APIs. Build on top. Then understand the fine-tuning decision framework deeply: RAG for dynamic knowledge, fine-tuning for behavior and style. Your overfitting intuition transfers directly to prompt sensitivity.",
      tags:["LoRA","PEFT","Hugging Face","Fine-tuning","RLHF","QLoRA","DPO"] },
    { phase:"Phase 2", title:"RAG as Feature Engineering", status:"active", accent:"#3cf0ff",
      body:"Chunking strategy is just feature engineering for retrieval. Embedding model choice is dimensionality reduction with semantics. Reranking is a second-stage model. You already think about this correctly — just learn the new vocabulary.",
      tags:["LangChain","LlamaIndex","Weaviate","Reranking","Hybrid Search","Cohere Rerank"] },
    { phase:"Phase 3", title:"Enough Engineering to Ship", status:"next", accent:"#9d7cff",
      body:"FastAPI, Docker, async Python, GitHub Actions. Not to become a backend engineer — just enough to deploy your own experiments without needing to beg eng to help. This unlocks iteration speed that is genuinely career-defining.",
      tags:["FastAPI","Docker","Async Python","GitHub Actions","Pydantic","CI/CD"] },
  ],
  ml: [
    { phase:"Day 1", title:"Replace model.forward() with API Call", status:"done", accent:"#b8ff3c",
      body:"Seriously, that's 70% of the transition. Call OpenAI or Anthropic instead of loading a local checkpoint. Everything else is orchestration, retrieval, evals — skills you already have instincts for from building ML systems.",
      tags:["LLM APIs","Anthropic API","OpenAI API","Streaming","Async"] },
    { phase:"Phase 1", title:"RAG vs Fine-tuning Decision Tree", status:"done", accent:"#b8ff3c",
      body:"The most-asked system design question in AI engineering interviews. RAG when: knowledge is dynamic, grounding matters, latency is acceptable. Fine-tuning when: behavior change, style, or domain vocabulary is the problem. Know this cold.",
      tags:["RAG","Fine-tuning","System Design","Cost Analysis","Latency","LoRA"] },
    { phase:"Phase 2", title:"Orchestration Frameworks", status:"active", accent:"#3cf0ff",
      body:"LangGraph for stateful agents (your ML pipeline graphs transfer perfectly), CrewAI for multi-agent, raw tool use for simple cases. You think in DAGs already — these frameworks are just DAGs where nodes make LLM calls.",
      tags:["LangGraph","CrewAI","LangChain","Tool Use","AutoGen","DSPy"] },
    { phase:"Phase 3", title:"Production Evals", status:"next", accent:"#9d7cff",
      body:"RAGAS for RAG quality, MLflow (already know it) for experiment tracking, LangSmith for traces. Your ML evaluation background is the biggest competitive advantage you have — most AI engineers have never run a real eval suite.",
      tags:["RAGAS","MLflow","Evals","CI Evals","LangSmith","Wandb"] },
  ],
  frontend: [
    { phase:"Your Edge", title:"Full-Stack AI Is Genuinely Rare", status:"done", accent:"#b8ff3c",
      body:"Most AI engineers cannot build real UIs. You can. A senior AI engineer who can ship the full product — backend, LLM integration, and polished frontend — is worth significantly more than one who can't. Lead with this in every application.",
      tags:["React","Next.js","TypeScript","Streaming UI","UX","Design"] },
    { phase:"Phase 1", title:"Backend Basics First", status:"done", accent:"#b8ff3c",
      body:"FastAPI (Python) or Hono/Express (TypeScript). Environment variables and secrets management. REST design. Async patterns. Docker basics. You need a real backend before you can add AI on top — and it's easier than you think with your JS background.",
      tags:["FastAPI","Node.js","REST","Async","Docker","Environment Vars"] },
    { phase:"Phase 2", title:"LLM Integration + Streaming UI", status:"active", accent:"#3cf0ff",
      body:"Call LLM APIs from your backend. Stream responses to your frontend in real time using SSE or WebSockets. A beautiful streaming chat UI with sources cited and reasoning shown is one of the most common and valuable AI product patterns.",
      tags:["LLM APIs","Streaming","SSE","WebSockets","React","Next.js","AI SDK"] },
    { phase:"Phase 3", title:"RAG for the Full Stack", status:"next", accent:"#9d7cff",
      body:"Vector search in backend, embedding pipeline, retrieval logic, and then render it beautifully in your own UI. You will have built a complete, deployed, production-quality AI product — and that is genuinely rare in 2026.",
      tags:["LangChain","pgvector","Embeddings","React","Vercel","Full Stack"] },
    { phase:"Portfolio", title:"Ship a Complete AI App", status:"locked", accent:"#3dffa0",
      body:"Next.js frontend + FastAPI backend + LLM + RAG + evals, deployed on Vercel + Railway. The combination of AI knowledge and frontend skill is worth a lot. The URL of a live, polished app is your best interview card.",
      tags:["Next.js","Vercel","FastAPI","Railway","Full Stack AI","Open Source"] },
  ],
};

const BG_META: Record<BG, { label:string; timeframe:string; pitch:string }> = {
  beginner: { label:"Complete Beginner",  timeframe:"6–8 phases", pitch:"Start here with minimal coding background" },
  backend:  { label:"Backend Developer",  timeframe:"4–5 phases", pitch:"Your API knowledge is 80% of the work already" },
  ds:       { label:"Data Scientist",     timeframe:"4–5 phases", pitch:"Evaluation is your superpower — lead with it" },
  ml:       { label:"ML Engineer",        timeframe:"3–4 phases", pitch:"Smoothest path — replace model.forward() with API call" },
  frontend: { label:"Frontend Developer", timeframe:"4–5 phases", pitch:"Rare full-stack AI edge most engineers don't have" },
};

const STATUS_BADGE: Record<Status, { label:string; cls:string }> = {
  done:   { label:"✓ done",    cls:"border-acid/30 text-acid bg-acid/5" },
  active: { label:"→ current", cls:"border-cyan/30 text-cyan bg-cyan/5" },
  next:   { label:"up next",   cls:"border-violet/30 text-violet bg-violet/5" },
  locked: { label:"locked",    cls:"border-faint/30 text-faint" },
};

export default function Roadmap() {
  const [bg, setBg] = useState<BG>("beginner");
  const steps = PATHS[bg];
  const meta  = BG_META[bg];

  return (
    <PageWrap>
      <PageHeader title="Learning Roadmaps" sub="Evidence-based paths derived from 1,700+ real job postings — what's actually required, not what tutorials suggest" />
      <Section>
        <Filters>
          <FL>I am a:</FL>
          {(Object.keys(PATHS) as BG[]).map(b => (
            <FB key={b} active={bg===b} onClick={()=>setBg(b)}>{BG_META[b].label}</FB>
          ))}
        </Filters>

        {/* Context card */}
        <div className="mb-6 p-4 rounded-xl border border-line bg-bg2 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-hi">{meta.label}</div>
            <div className="font-mono text-[11px] text-faint mt-0.5">{meta.pitch}</div>
          </div>
          <span className="font-mono text-[11px] border border-acid/25 text-acid bg-acid/5 px-3 py-1.5 rounded-full self-start sm:self-auto flex-shrink-0">
            {meta.timeframe}
          </span>
        </div>

        {/* Timeline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={bg}
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }}
            transition={{ duration:.22 }}
            className="relative pl-7"
          >
            {/* Vertical line */}
            <div className="absolute left-[13px] top-0 bottom-0 w-px"
              style={{ background:"linear-gradient(to bottom, #b8ff3c 0%, #383838 100%)" }} />

            {steps.map((step, i) => {
              const isLocked  = step.status === "locked";
              const sbadge    = STATUS_BADGE[step.status];
              return (
                <motion.div
                  key={step.phase}
                  initial={{ opacity:0, x:-12 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay: i*.07, duration:.3, ease:[.16,1,.3,1] }}
                  className={`relative mb-5 last:mb-0 ${isLocked ? "opacity-45" : ""}`}
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[21px] top-[6px] w-3.5 h-3.5 rounded-full border-2"
                    style={{
                      borderColor: "#030303",
                      background: isLocked ? "#383838" : step.accent,
                      boxShadow: isLocked ? "none" : `0 0 10px ${step.accent}60`,
                    }} />

                  <div className="bg-bg1 border border-line rounded-xl p-5 hover:border-line2 transition-colors relative overflow-hidden">
                    {/* Accent glow bg */}
                    {!isLocked && (
                      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-5 blur-3xl"
                        style={{ background: step.accent }} />
                    )}

                    <div className="flex items-start justify-between gap-3 mb-2.5 relative">
                      <div>
                        <div className="font-mono text-[10px] font-semibold tracking-[.12em] uppercase mb-0.5"
                          style={{ color: isLocked ? "#383838" : step.accent }}>
                          {step.phase}
                        </div>
                        <div className="text-[14px] font-bold text-hi leading-snug">{step.title}</div>
                      </div>
                      <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${sbadge.cls}`}>
                        {sbadge.label}
                      </span>
                    </div>

                    <p className="text-[13px] text-muted leading-relaxed mb-3.5 relative">{step.body}</p>

                    <div className="flex flex-wrap gap-1.5 relative">
                      {step.tags.map(tag => (
                        <span key={tag} className="font-mono text-[10px] px-2 py-0.5 rounded-md border border-line bg-bg3 text-faint">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </Section>
    </PageWrap>
  );
}
