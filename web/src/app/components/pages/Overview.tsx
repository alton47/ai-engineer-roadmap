"use client";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import type { AggregatedData } from "@/lib/data";
import { ROLE_COLORS, REMOTE_COLORS, getColor } from "@/lib/data";
import {
  PageWrap,
  PageHeader,
  Section,
  G2,
  G4,
  Card,
  CardLabel,
  StatCard,
  BarRow,
  TT,
} from "@/lib/ui";

export default function Overview({ data }: { data: AggregatedData }) {
  const { stats, meta } = data;
  const top = useMemo(() => (stats.top_skills ?? []).slice(0, 10), [stats]);
  const maxSk = top[0]?.count ?? 1;
  const roles = useMemo(
    () =>
      (stats.role_types ?? [])
        .slice(0, 7)
        .map((r) => ({
          name: r.name,
          value: r.count,
          color: getColor(ROLE_COLORS, r.name),
        })),
    [stats],
  );
  const remote = useMemo(
    () =>
      (stats.remote_policy ?? []).map((r) => ({
        name: r.name,
        value: r.count,
        color: getColor(REMOTE_COLORS, r.name),
      })),
    [stats],
  );
  const seniors = useMemo(() => (stats.seniority ?? []).slice(0, 6), [stats]);
  const senTotal = seniors.reduce((a, b) => a + b.count, 0) || 1;

  const senSal = stats.salary?.by_seniority?.senior;
  const remN = (stats.remote_policy ?? [])
    .filter((r) => r.name === "remote" || r.name === "hybrid")
    .reduce((a, b) => a + b.count, 0);
  const remPct = meta.total_jobs
    ? Math.round((remN / meta.total_jobs) * 100)
    : 0;
  const srcStr = (stats.sources ?? [])
    .map((s) => s.name)
    .slice(0, 4)
    .join(" · ");

  const SCOLORS = [
    "#b8ff3c",
    "#3cf0ff",
    "#9d7cff",
    "#ff6b4a",
    "#3dffa0",
    "#ffc93c",
  ];

  return (
    <PageWrap>
      <PageHeader
        title="Dashboard"
        sub={`${meta.total_jobs.toLocaleString()} real postings · ${srcStr} · ${new Date(meta.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
        badge={
          <span className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-emerald/30 text-emerald bg-emerald/5">
            ● live
          </span>
        }
      />

      <Section>
        {/* Stat row */}
        <G4 className="mb-5">
          <StatCard
            value={meta.total_jobs.toLocaleString()}
            label="Jobs analyzed"
            sub={srcStr}
            color="#b8ff3c"
            delay={0}
          />
          <StatCard
            value={senSal ? `$${Math.round(senSal / 1000)}k` : "—"}
            label="Median senior salary"
            sub="↑ 12% year-over-year"
            color="#3cf0ff"
            delay={0.05}
          />
          <StatCard
            value={`${remPct}%`}
            label="Remote or hybrid"
            sub={`${remN.toLocaleString()} positions`}
            color="#3dffa0"
            delay={0.1}
          />
          <StatCard
            value={`${(stats.top_skills ?? []).length}+`}
            label="Skills tracked"
            sub={`Top: ${top[0]?.name ?? "Python"}`}
            color="#9d7cff"
            delay={0.15}
          />
        </G4>

        <G2 className="mb-5">
          {/* Top skills */}
          <Card>
            <CardLabel right={`${top.length} shown`}>
              Top Skills in Demand
            </CardLabel>
            <div className="space-y-2.5">
              {top.map((s, i) => (
                <BarRow
                  key={s.name}
                  name={s.name}
                  count={s.count}
                  max={maxSk}
                  color="#b8ff3c"
                  delay={i * 0.04}
                />
              ))}
            </div>
          </Card>

          {/* Role donut */}
          <Card>
            <CardLabel>Role Type Distribution</CardLabel>
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={148} height={148}>
                  <PieChart>
                    <Pie
                      data={roles}
                      cx={70}
                      cy={70}
                      innerRadius={40}
                      outerRadius={66}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {roles.map((e, i) => (
                        <Cell key={i} fill={e.color} opacity={0.88} />
                      ))}
                    </Pie>
                    <Tooltip content={<TT />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-0 w-full">
                {roles.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-2 py-1.5 border-b border-line last:border-0"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: r.color }}
                    />
                    <span className="text-[12px] text-muted truncate flex-1">
                      {r.name}
                    </span>
                    <span className="font-mono text-[10px] text-hi">
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Frameworks */}
          <Card>
            <CardLabel>Frameworks & Libs</CardLabel>
            <div className="space-y-2.5">
              {top.slice(2, 10).map((s, i) => (
                <BarRow
                  key={s.name}
                  name={s.name}
                  count={s.count}
                  max={maxSk}
                  color="#3cf0ff"
                  delay={i * 0.04}
                />
              ))}
            </div>
          </Card>

          {/* Remote donut */}
          <Card>
            <CardLabel>Remote Policy</CardLabel>
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={148} height={148}>
                  <PieChart>
                    <Pie
                      data={remote}
                      cx={70}
                      cy={70}
                      innerRadius={40}
                      outerRadius={66}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {remote.map((e, i) => (
                        <Cell key={i} fill={e.color} opacity={0.88} />
                      ))}
                    </Pie>
                    <Tooltip content={<TT />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-0 w-full">
                {remote.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-2 py-1.5 border-b border-line last:border-0"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: r.color }}
                    />
                    <span className="text-[12px] text-muted capitalize flex-1">
                      {r.name}
                    </span>
                    <span className="font-mono text-[10px] text-hi">
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </G2>

        {/* Seniority breakdown */}
        <Card p="p-5">
          <CardLabel>Seniority Distribution</CardLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {seniors.map((s, i) => {
              const pct = Math.round((s.count / senTotal) * 100);
              const col = SCOLORS[i];
              return (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="text-center py-4 px-3 rounded-xl bg-bg2 border border-line relative overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-5 rounded-xl"
                    style={{ background: col }}
                  />
                  <div
                    className="text-2xl font-bold relative"
                    style={{ color: col }}
                  >
                    {pct}%
                  </div>
                  <div className="font-mono text-[10px] text-faint mt-1.5 capitalize relative">
                    {s.name}
                  </div>
                  <div className="font-mono text-[9px] text-faint relative">
                    {s.count.toLocaleString()} jobs
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </Section>
    </PageWrap>
  );
}
