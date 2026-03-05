"use client";
import { useState, useMemo } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import type { AggregatedData, TrendPoint } from "@/lib/data";
import { TREND_PALETTE, DEMO_TREND } from "@/lib/data";
import { PageWrap, PageHeader, Section, G2, Card, CardLabel, BarRow, Filters, FL, FB, TT } from "@/lib/ui";

type View = "volume"|"salary"|"skills"|"roles";

export default function Trends({ data }: { data: AggregatedData }) {
  const [view, setView] = useState<View>("volume");

  // Use real trend if ≥2 points, else rich demo
  const trend: TrendPoint[] = useMemo(() => {
    const t = data.stats?.trend ?? [];
    return t.length >= 2 ? t : DEMO_TREND;
  }, [data.stats?.trend]);

  const isDemoTrend = (data.stats?.trend ?? []).length < 2;

  // Top 5 skills across all trend points
  const topSkillNames = useMemo(() => {
    const f: Record<string,number> = {};
    trend.forEach(pt => pt.top_skills.forEach(s => { f[s.name]=(f[s.name]??0)+s.count; }));
    return Object.entries(f).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n])=>n);
  }, [trend]);

  const skillRows = useMemo(() => trend.map(pt => {
    const r: Record<string,string|number> = { month: pt.month };
    topSkillNames.forEach(sk => { r[sk] = pt.top_skills.find(s=>s.name===sk)?.count ?? 0; });
    return r;
  }), [trend, topSkillNames]);

  const topRoleNames = useMemo(() => {
    const f: Record<string,number> = {};
    trend.forEach(pt => pt.role_types.forEach(r => { f[r.name]=(f[r.name]??0)+r.count; }));
    return Object.entries(f).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([n])=>n);
  }, [trend]);

  const roleRows = useMemo(() => trend.map(pt => {
    const r: Record<string,string|number> = { month: pt.month };
    topRoleNames.forEach(rn => { r[rn] = pt.role_types.find(x=>x.name===rn)?.count ?? 0; });
    return r;
  }), [trend, topRoleNames]);

  // Rising skills: compare first vs last trend point
  const rising = useMemo(() => {
    if (trend.length < 2) return [];
    const first = Object.fromEntries(trend[0].top_skills.map(s=>[s.name,s.count]));
    const last  = Object.fromEntries(trend[trend.length-1].top_skills.map(s=>[s.name,s.count]));
    return Object.keys(last).map(name => ({
      name, count:last[name], prev:first[name]??0,
      growth: first[name] ? Math.round(((last[name]-first[name])/first[name])*100) : 999,
    })).sort((a,b)=>b.growth-a.growth).slice(0,8);
  }, [trend]);
  const maxRising = rising[0]?.count ?? 1;

  const fmtSal = (v: number) => `$${Math.round(v/1000)}k`;

  const VIEWS: { id:View; label:string }[] = [
    { id:"volume", label:"Job Volume" },
    { id:"salary", label:"Salary Trend" },
    { id:"skills", label:"Skill Demand" },
    { id:"roles",  label:"Role Types" },
  ];

  return (
    <PageWrap>
      <PageHeader
        title="Demand Trends"
        sub={isDemoTrend ? "Showing historical demo data — run scraper monthly to populate real trends" : `${trend.length} data points · ${trend[0]?.month} → ${trend[trend.length-1]?.month}`}
        badge={isDemoTrend ? <span className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-gold/30 text-gold bg-gold/5">demo trend</span> : undefined}
      />
      <Section>
        <Filters>
          <FL>View:</FL>
          {VIEWS.map(v => <FB key={v.id} active={view===v.id} onClick={()=>setView(v.id)}>{v.label}</FB>)}
        </Filters>

        <Card className="mb-5" p="p-5">
          <CardLabel right={view==="salary"?"USD / year":"job count"}>
            {view==="volume" && "AI Engineering Job Postings Over Time"}
            {view==="salary" && "Median Salary Trend (USD)"}
            {view==="skills" && `Top ${topSkillNames.length} Skills — Demand Growth`}
            {view==="roles"  && "Role Type Growth Over Time"}
          </CardLabel>

          {view === "volume" && (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trend} margin={{ top:10, right:8, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#b8ff3c" stopOpacity={.15}/>
                    <stop offset="95%" stopColor="#b8ff3c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#181818" />
                <XAxis dataKey="month" tick={{ fill:"#383838", fontSize:10, fontFamily:"JetBrains Mono" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill:"#383838", fontSize:10, fontFamily:"JetBrains Mono" }} tickLine={false} axisLine={false} />
                <Tooltip content={<TT />} />
                <Area type="monotone" dataKey="count" name="Job Postings" stroke="#b8ff3c" strokeWidth={2}
                  fill="url(#gVol)" dot={{ fill:"#b8ff3c", r:3, strokeWidth:0 }}
                  activeDot={{ r:6, fill:"#b8ff3c", stroke:"#030303", strokeWidth:2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {view === "salary" && (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trend} margin={{ top:10, right:8, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="gSal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3cf0ff" stopOpacity={.15}/>
                    <stop offset="95%" stopColor="#3cf0ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#181818" />
                <XAxis dataKey="month" tick={{ fill:"#383838", fontSize:10, fontFamily:"JetBrains Mono" }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={fmtSal} tick={{ fill:"#383838", fontSize:10, fontFamily:"JetBrains Mono" }} tickLine={false} axisLine={false} />
                <Tooltip content={<TT fmt={(v,n)=>n==="Median Salary"?fmtSal(v):v.toLocaleString()} />} />
                <Area type="monotone" dataKey="median_salary" name="Median Salary" stroke="#3cf0ff" strokeWidth={2}
                  fill="url(#gSal)" dot={{ fill:"#3cf0ff", r:3, strokeWidth:0 }}
                  activeDot={{ r:6, fill:"#3cf0ff", stroke:"#030303", strokeWidth:2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {view === "skills" && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={skillRows} margin={{ top:10, right:8, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="0" stroke="#181818" />
                <XAxis dataKey="month" tick={{ fill:"#383838", fontSize:10, fontFamily:"JetBrains Mono" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill:"#383838", fontSize:10, fontFamily:"JetBrains Mono" }} tickLine={false} axisLine={false} />
                <Tooltip content={<TT />} />
                <Legend wrapperStyle={{ fontFamily:"JetBrains Mono", fontSize:10, color:"#707070", paddingTop:12 }} />
                {topSkillNames.map((sk,i) => (
                  <Line key={sk} type="monotone" dataKey={sk} stroke={TREND_PALETTE[i%TREND_PALETTE.length]}
                    strokeWidth={2} dot={false}
                    activeDot={{ r:5, stroke:"#030303", strokeWidth:2 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}

          {view === "roles" && (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={roleRows} margin={{ top:10, right:8, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="0" stroke="#181818" />
                <XAxis dataKey="month" tick={{ fill:"#383838", fontSize:10, fontFamily:"JetBrains Mono" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill:"#383838", fontSize:10, fontFamily:"JetBrains Mono" }} tickLine={false} axisLine={false} />
                <Tooltip content={<TT />} />
                <Legend wrapperStyle={{ fontFamily:"JetBrains Mono", fontSize:10, color:"#707070", paddingTop:12 }} />
                {topRoleNames.map((rn,i) => (
                  <Area key={rn} type="monotone" dataKey={rn} stroke={TREND_PALETTE[i%TREND_PALETTE.length]}
                    fill={TREND_PALETTE[i%TREND_PALETTE.length]} fillOpacity={.06} strokeWidth={2}
                    activeDot={{ r:5, stroke:"#030303", strokeWidth:2 }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <G2>
          <Card p="p-5">
            <CardLabel right="growth %">Fastest Rising Skills</CardLabel>
            <div className="space-y-2.5">
              {rising.map((s,i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <BarRow name={s.name} count={s.count} max={maxRising} color="#b8ff3c" delay={i*.04} />
                  </div>
                  {s.prev>0 && (
                    <span className="font-mono text-[9px] text-acid flex-shrink-0 w-10 text-right">
                      +{s.growth > 999 ? "∞" : s.growth}%
                    </span>
                  )}
                </div>
              ))}
              {rising.length === 0 && <p className="font-mono text-[11px] text-faint">Run scraper multiple times to see growth trends</p>}
            </div>
          </Card>
          <Card p="p-5">
            <CardLabel>Scrape History</CardLabel>
            <div className="space-y-1">
              {(data.meta?.sources_scraped ?? []).slice().reverse().map((s,i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[11px] text-tx">{s.source} — {s.count} jobs</div>
                    <div className="font-mono text-[9px] text-faint">{new Date(s.scraped_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {!(data.meta?.sources_scraped?.length) && (
                <div className="py-8 text-center">
                  <p className="font-mono text-[11px] text-faint">No scrape history yet</p>
                  <p className="font-mono text-[10px] text-faint mt-1">Run <code className="text-acid">python scraper/scrape_jobs.py</code> to start</p>
                </div>
              )}
            </div>
          </Card>
        </G2>
      </Section>
    </PageWrap>
  );
}
