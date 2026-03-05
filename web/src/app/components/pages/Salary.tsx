"use client";
import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import type { AggregatedData } from "@/lib/data";
import { ROLE_COLORS, getColor } from "@/lib/data";
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
  Filters,
  FL,
  FB,
  TT,
} from "@/lib/ui";

type Level = "all" | "junior" | "mid" | "senior" | "staff";

export default function Salary({ data }: { data: AggregatedData }) {
  const [level, setLevel] = useState<Level>("all");
  const { stats, jobs } = data;
  const sal = stats.salary ?? { by_seniority: {} };

  const roleChart = useMemo(() => {
    const m: Record<string, number[]> = {};
    (jobs ?? []).forEach((j) => {
      if (!j.role_type || !j.salary_min_usd) return;
      if (level !== "all" && j.seniority !== level) return;
      if (!m[j.role_type]) m[j.role_type] = [];
      m[j.role_type].push(j.salary_min_usd);
    });
    return Object.entries(m)
      .map(([role, sals]) => {
        const s = sals.sort((a, b) => a - b);
        return {
          role: role
            .replace(" / ", "/")
            .replace(" Platform", "")
            .replace(" / RLHF", ""),
          min: s[0] ?? 0,
          med: s[Math.floor(s.length / 2)] ?? 0,
          max: s[s.length - 1] ?? 0,
          count: s.length,
          color: getColor(ROLE_COLORS, role),
        };
      })
      .filter((d) => d.count >= 1)
      .sort((a, b) => b.med - a.med);
  }, [jobs, level]);

  const locChart = useMemo(() => {
    const m: Record<string, number[]> = {};
    (jobs ?? []).forEach((j) => {
      if (!j.location || !j.salary_min_usd) return;
      const c = j.location.split(",")[0].trim();
      if (!m[c]) m[c] = [];
      m[c].push(j.salary_min_usd);
    });
    return Object.entries(m)
      .map(([name, sals]) => ({
        name,
        count: Math.round(sals.reduce((a, b) => a + b, 0) / sals.length),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [jobs]);

  const LEVELS = [
    { k: "junior", label: "Junior", col: "#3cf0ff" },
    { k: "mid", label: "Mid", col: "#c8c8c8" },
    { k: "senior", label: "Senior", col: "#b8ff3c" },
    { k: "staff", label: "Staff+", col: "#ffc93c" },
  ];

  const RoleTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    const d = roleChart.find((r) => r.role === label);
    if (!d) return null;
    return (
      <div className="bg-bg2 border border-line2 rounded-xl px-4 py-3 font-mono text-[11px] shadow-2xl">
        <div className="text-hi font-bold mb-2 font-sans text-[12px]">
          {label}
        </div>
        <div className="space-y-1 text-muted">
          <div>
            Median:{" "}
            <span className="text-acid">${Math.round(d.med / 1000)}k</span>
          </div>
          <div>
            Min: <span className="text-hi">${Math.round(d.min / 1000)}k</span>
          </div>
          <div>
            Max: <span className="text-hi">${Math.round(d.max / 1000)}k</span>
          </div>
          <div>
            Sample: <span className="text-hi">{d.count} jobs</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageWrap>
      <PageHeader
        title="Salary Explorer"
        sub="Postings with disclosed compensation · all figures USD / year · bar = median"
      />
      <Section>
        <Filters>
          <FL>Seniority:</FL>
          {(["all", "junior", "mid", "senior", "staff"] as Level[]).map((l) => (
            <FB
              key={l}
              active={level === l}
              onClick={() => setLevel(l)}
              accent={
                l === "junior"
                  ? "#3cf0ff"
                  : l === "mid"
                    ? "#c8c8c8"
                    : l === "senior"
                      ? "#b8ff3c"
                      : "#ffc93c"
              }
            >
              {l === "all"
                ? "All Levels"
                : l.charAt(0).toUpperCase() + l.slice(1)}
            </FB>
          ))}
        </Filters>

        <G4 className="mb-5">
          {LEVELS.map((lv, i) => (
            <StatCard
              key={lv.k}
              value={
                sal.by_seniority?.[lv.k]
                  ? `$${Math.round((sal.by_seniority[lv.k] as number) / 1000)}k`
                  : "—"
              }
              label={`${lv.label} median`}
              color={lv.col}
              delay={i * 0.05}
            />
          ))}
        </G4>

        {/* Role chart */}
        <Card className="mb-5" p="p-5">
          <CardLabel
            right={level !== "all" ? `filter: ${level}` : "all seniority"}
          >
            Salary Range by Role Type
          </CardLabel>
          {roleChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={roleChart}
                margin={{ top: 8, right: 8, left: 8, bottom: 44 }}
                barGap={2}
              >
                <CartesianGrid
                  strokeDasharray="0"
                  vertical={false}
                  stroke="#181818"
                />
                <XAxis
                  dataKey="role"
                  tick={{
                    fill: "#383838",
                    fontSize: 10,
                    fontFamily: "JetBrains Mono",
                  }}
                  angle={-22}
                  textAnchor="end"
                  height={52}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${v / 1000}k`}
                  tick={{
                    fill: "#383838",
                    fontSize: 10,
                    fontFamily: "JetBrains Mono",
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<RoleTooltip />} />
                <Bar
                  dataKey="max"
                  fill="#181818"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
                <Bar dataKey="med" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {roleChart.map((e, i) => (
                    <Cell key={i} fill={e.color} opacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center font-mono text-[12px] text-faint">
              No salary data for this filter — run the scraper to populate real
              numbers
            </div>
          )}
        </Card>

        <G2>
          <Card p="p-5">
            <CardLabel>Avg Salary by Market</CardLabel>
            <div className="space-y-2.5">
              {locChart.length > 0 ? (
                locChart.map((l, i) => (
                  <BarRow
                    key={l.name}
                    name={l.name}
                    count={l.count}
                    max={locChart[0]?.count ?? 1}
                    color="#ff6b4a"
                    delay={i * 0.04}
                  />
                ))
              ) : (
                <p className="font-mono text-[11px] text-faint">
                  No location salary data yet
                </p>
              )}
            </div>
          </Card>
          <Card p="p-5">
            <CardLabel>Salary Disclosure Rate</CardLabel>
            {(() => {
              const total = (jobs ?? []).length || 1;
              const disc = (jobs ?? []).filter((j) => j.salary_min_usd).length;
              const range = (jobs ?? []).filter(
                (j) => j.salary_raw && !j.salary_min_usd,
              ).length;
              const none = Math.max(0, total - disc - range);
              const items = [
                { name: "Disclosed (parsed)", count: disc, color: "#3dffa0" },
                { name: "Range string only", count: range, color: "#ffc93c" },
                { name: "Not disclosed", count: none, color: "#383838" },
              ];
              const mx = Math.max(...items.map((i) => i.count), 1);
              return (
                <div className="space-y-2.5">
                  {items.map((it, i) => (
                    <BarRow
                      key={it.name}
                      name={it.name}
                      count={it.count}
                      max={mx}
                      color={it.color}
                      delay={i * 0.06}
                    />
                  ))}
                </div>
              );
            })()}
          </Card>
        </G2>
      </Section>
    </PageWrap>
  );
}
