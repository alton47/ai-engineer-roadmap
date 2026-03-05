"use client";
import { useState, useMemo } from "react";
import type { AggregatedData } from "@/lib/data";
import { PageWrap, PageHeader, Section, Card, Filters, FL, FB, FSep, RemoteChip, LevelChip, Chip } from "@/lib/ui";

type Sort = "title"|"salary"|"company"|null;

export default function Jobs({ data }: { data: AggregatedData }) {
  const [typeF, setTypeF] = useState("all");
  const [remF,  setRemF]  = useState("all");
  const [lvF,   setLvF]   = useState("all");
  const [srcF,  setSrcF]  = useState("all");
  const [q,     setQ]     = useState("");
  const [sort,  setSort]  = useState<Sort>(null);
  const [sortD, setSortD] = useState(1);
  const [page,  setPage]  = useState(1);
  const PER = 25;

  const { jobs } = data;

  const roles   = useMemo(() => [...new Set((jobs??[]).map(j=>j.role_type).filter(Boolean))].sort(), [jobs]);
  const sources = useMemo(() => [...new Set((jobs??[]).map(j=>j.source).filter(Boolean))].sort(), [jobs]);

  const filtered = useMemo(() => {
    let list = jobs ?? [];
    if (typeF !== "all") list = list.filter(j=>j.role_type===typeF);
    if (remF  !== "all") list = list.filter(j=>j.remote_policy===remF);
    if (lvF   !== "all") list = list.filter(j=>j.seniority===lvF);
    if (srcF  !== "all") list = list.filter(j=>j.source===srcF);
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter(j =>
        j.title?.toLowerCase().includes(ql) ||
        j.company?.toLowerCase().includes(ql) ||
        j.location?.toLowerCase().includes(ql) ||
        (j.skills??[]).some(s=>s.toLowerCase().includes(ql))
      );
    }
    if (sort === "title")   list = [...list].sort((a,b)=>(a.title??"").localeCompare(b.title??"")*sortD);
    if (sort === "salary")  list = [...list].sort((a,b)=>((a.salary_min_usd??0)-(b.salary_min_usd??0))*sortD);
    if (sort === "company") list = [...list].sort((a,b)=>(a.company??"").localeCompare(b.company??"")*sortD);
    return list;
  }, [jobs, typeF, remF, lvF, srcF, q, sort, sortD]);

  const totalPages = Math.ceil(filtered.length / PER);
  const paged      = filtered.slice((page-1)*PER, page*PER);

  const toggleSort = (k: Sort) => {
    if (sort===k) setSortD(d=>d*-1);
    else { setSort(k); setSortD(1); }
    setPage(1);
  };

  const Th = ({ k, children }: { k: Sort; children: React.ReactNode }) => (
    <th onClick={()=>k&&toggleSort(k)}
      className={`text-left font-mono text-[10px] tracking-[.1em] uppercase text-faint py-2.5 px-3 border-b border-line whitespace-nowrap select-none ${k?"cursor-pointer hover:text-muted group":""}`}>
      {children}
      {k && <span className="ml-1 opacity-30 group-hover:opacity-100">{sort===k?(sortD===1?"↑":"↓"):"⇅"}</span>}
    </th>
  );

  return (
    <PageWrap>
      <PageHeader
        title="Job Browser"
        sub={`${filtered.length.toLocaleString()} matched · ${(jobs??[]).length.toLocaleString()} total`}
      >
        <div className="relative flex-shrink-0">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" width="12" height="12" viewBox="0 0 15 15" fill="currentColor">
            <path d="M10 6.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0zm-.64 3.36a5 5 0 111.06-1.06l2.14 2.13a.75.75 0 11-1.06 1.07L9.36 9.86z"/>
          </svg>
          <input className="bg-bg2 border border-line text-tx font-mono text-[12px] pl-7 pr-3 py-1.5 rounded-lg w-44 sm:w-56 outline-none focus:border-line2 transition-colors placeholder:text-faint"
            placeholder="search…" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}} />
        </div>
      </PageHeader>

      <Section>
        <div className="space-y-2 mb-5">
          <Filters>
            <FL>Type:</FL>
            <FB active={typeF==="all"} onClick={()=>{setTypeF("all");setPage(1);}}>All</FB>
            {roles.slice(0,6).map(r=><FB key={r} active={typeF===r} onClick={()=>{setTypeF(r);setPage(1);}}>{r.split("/")[0].trim()}</FB>)}
          </Filters>
          <Filters>
            <FL>Remote:</FL>
            {["all","remote","hybrid","on-site"].map(r=><FB key={r} active={remF===r} onClick={()=>{setRemF(r);setPage(1);}}>{r==="all"?"All":r}</FB>)}
            <FSep />
            <FL>Level:</FL>
            {["all","junior","mid","senior","staff"].map(l=><FB key={l} active={lvF===l} onClick={()=>{setLvF(l);setPage(1);}}>{l==="all"?"All":l}</FB>)}
            <FSep />
            <FL>Source:</FL>
            <FB active={srcF==="all"} onClick={()=>{setSrcF("all");setPage(1);}}>All</FB>
            {sources.map(s=><FB key={s} active={srcF===s} onClick={()=>{setSrcF(s);setPage(1);}}>{s}</FB>)}
          </Filters>
        </div>

        <Card p="">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th k="title">Title</Th>
                  <Th k="company">Company</Th>
                  <Th k={null}>Location</Th>
                  <Th k={null}>Role</Th>
                  <Th k={null}>Remote</Th>
                  <Th k="salary">Salary</Th>
                  <Th k={null}>Level</Th>
                  <Th k={null}>Source</Th>
                </tr>
              </thead>
              <tbody>
                {paged.map((j,i) => (
                  <tr key={i} className="group hover:bg-bg2/60 transition-colors">
                    <td className="py-2.5 px-3 border-b border-line/40">
                      <div className="text-[13px] font-semibold text-hi group-hover:text-acid transition-colors leading-tight">{j.title}</div>
                      <div className="font-mono text-[10px] text-faint mt-0.5 max-w-52 truncate">{(j.skills??[]).slice(0,3).join(" · ")}</div>
                    </td>
                    <td className="py-2.5 px-3 border-b border-line/40 font-mono text-[11px] text-muted whitespace-nowrap">{j.company}</td>
                    <td className="py-2.5 px-3 border-b border-line/40 text-[12px] text-muted whitespace-nowrap">{j.location}</td>
                    <td className="py-2.5 px-3 border-b border-line/40">
                      <Chip color="violet">{j.role_type?.split("/")[0]?.trim() ?? "—"}</Chip>
                    </td>
                    <td className="py-2.5 px-3 border-b border-line/40"><RemoteChip v={j.remote_policy} /></td>
                    <td className="py-2.5 px-3 border-b border-line/40 font-mono text-[11px] text-muted whitespace-nowrap">
                      {j.salary_min_usd ? `$${Math.round(j.salary_min_usd/1000)}k` : j.salary_raw || "—"}
                    </td>
                    <td className="py-2.5 px-3 border-b border-line/40"><LevelChip v={j.seniority} /></td>
                    <td className="py-2.5 px-3 border-b border-line/40">
                      <Chip>{j.source}</Chip>
                    </td>
                  </tr>
                ))}
                {paged.length===0 && (
                  <tr><td colSpan={8} className="text-center py-20 font-mono text-[12px] text-faint">No jobs match your filters</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3.5 border-t border-line">
              <span className="font-mono text-[11px] text-faint">Page {page} of {totalPages} · {filtered.length.toLocaleString()} results</span>
              <div className="flex gap-1 flex-wrap">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  className="px-3 py-1 rounded-lg border border-line font-mono text-[11px] text-muted disabled:opacity-25 hover:border-line2 hover:text-tx transition-colors">← prev</button>
                {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                  const pg=Math.min(Math.max(1,page-2+i),totalPages);
                  return <button key={pg} onClick={()=>setPage(pg)}
                    className={`px-3 py-1 rounded-lg border font-mono text-[11px] transition-colors ${pg===page?"bg-acid border-acid text-bg font-bold":"border-line text-muted hover:border-line2 hover:text-tx"}`}>{pg}</button>;
                })}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="px-3 py-1 rounded-lg border border-line font-mono text-[11px] text-muted disabled:opacity-25 hover:border-line2 hover:text-tx transition-colors">next →</button>
              </div>
            </div>
          )}
        </Card>
      </Section>
    </PageWrap>
  );
}
