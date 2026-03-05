"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AggregatedData } from "@/lib/data";
import { CAT_COLORS, inferCat } from "@/lib/data";
import { PageWrap, PageHeader, Section, G2, Card, CardLabel, BarRow, Filters, FL, FB } from "@/lib/ui";

type Cat = "all"|"lang"|"framework"|"cloud"|"llm"|"vector";
const CAT_LABELS: Record<Cat, string> = { all:"All", lang:"Languages", framework:"Frameworks / Libs", cloud:"Cloud & Infra", llm:"LLM Providers", vector:"Vector DBs" };

export default function Skills({ data }: { data: AggregatedData }) {
  const [cat, setCat] = useState<Cat>("all");
  const [hov, setHov] = useState<string|null>(null);

  const all = useMemo(() => (data.stats.top_skills ?? []).map(s => ({ ...s, cat: inferCat(s.name) })), [data]);
  const filt = useMemo(() => cat === "all" ? all : all.filter(s=>s.cat===cat), [all, cat]);
  const max  = filt[0]?.count ?? 1;

  const cloud = useMemo(() => all.filter(s=>s.cat==="cloud").slice(0,8), [all]);
  const llm   = useMemo(() => all.filter(s=>s.cat==="llm").slice(0,8), [all]);

  return (
    <PageWrap>
      <PageHeader title="Skills Map" sub={`${filt.length} skills · sized and ranked by frequency from real postings`} />
      <Section>
        <Filters>
          <FL>Category:</FL>
          {(Object.keys(CAT_LABELS) as Cat[]).map(c => (
            <FB key={c} active={cat===c} onClick={()=>setCat(c)} accent={c==="all"?"#b8ff3c":CAT_COLORS[c]}>
              {CAT_LABELS[c]}
            </FB>
          ))}
        </Filters>

        {/* Pill cloud */}
        <Card className="mb-4" p="p-5">
          <CardLabel right={`${filt.length} skills · hover for count`}>Skill Cloud</CardLabel>
          <AnimatePresence>
            <motion.div className="flex flex-wrap gap-2" layout>
              {filt.map(s => {
                const col = CAT_COLORS[s.cat] ?? "#707070";
                const sz  = 11 + Math.round((s.count / max) * 13);
                const isH = hov === s.name;
                return (
                  <motion.span key={s.name} layout
                    initial={{ opacity:0, scale:.75 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.75 }}
                    whileHover={{ scale:1.18, transition:{ duration:.12 } }}
                    onHoverStart={()=>setHov(s.name)} onHoverEnd={()=>setHov(null)}
                    title={`${s.name}: ${s.count} jobs`}
                    className="font-mono px-3 py-1 rounded-full border cursor-default select-none transition-[box-shadow,background] duration-150"
                    style={{
                      fontSize: sz,
                      color: col,
                      borderColor: isH ? col : `${col}2a`,
                      background: isH ? `${col}14` : `${col}06`,
                      boxShadow: isH ? `0 0 20px ${col}35` : "none",
                    }}
                  >
                    {s.name}
                    {isH && <span className="ml-1.5 text-[9px] opacity-60">{s.count}</span>}
                  </motion.span>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </Card>

        {/* Ranked list */}
        <Card className="mb-4" p="p-5">
          <CardLabel right="jobs">Top 20 — by frequency</CardLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5">
            {filt.slice(0,20).map((s,i) => (
              <BarRow key={s.name} name={s.name} count={s.count} max={max} color={CAT_COLORS[s.cat]??'#707070'} delay={i*.028} />
            ))}
          </div>
        </Card>

        <G2>
          <Card p="p-5">
            <CardLabel>Cloud Platforms</CardLabel>
            <div className="space-y-2.5">
              {cloud.map((s,i) => <BarRow key={s.name} name={s.name} count={s.count} max={cloud[0]?.count??1} color="#ff6b4a" delay={i*.04} />)}
            </div>
          </Card>
          <Card p="p-5">
            <CardLabel>LLM Providers</CardLabel>
            <div className="space-y-2.5">
              {llm.map((s,i) => <BarRow key={s.name} name={s.name} count={s.count} max={llm[0]?.count??1} color="#9d7cff" delay={i*.04} />)}
            </div>
          </Card>
        </G2>
      </Section>
    </PageWrap>
  );
}
