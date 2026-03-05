"use client";
import { motion } from "framer-motion";
import { clsx } from "clsx";

// ─── Page Shell ───────────────────────────────────────────────────────────────
export function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [.16,1,.3,1] }}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({
  title, sub, badge, children,
}: { title: string; sub?: string; badge?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="px-8 pt-8 pb-6 border-b border-line">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-hi tracking-tight">{title}</h1>
          {sub && <p className="font-mono text-[11px] text-faint mt-1.5 leading-relaxed">{sub}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">{badge}{children}</div>
      </div>
    </div>
  );
}

export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("px-8 py-6", className)}>{children}</div>;
}

// ─── Grids ────────────────────────────────────────────────────────────────────
export function G2({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>{children}</div>;
}
export function G3({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>{children}</div>;
}
export function G4({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("grid grid-cols-2 lg:grid-cols-4 gap-3", className)}>{children}</div>;
}

// ─── Cards ────────────────────────────────────────────────────────────────────
export function Card({ children, className, p = "p-5" }: { children: React.ReactNode; className?: string; p?: string }) {
  return (
    <div className={clsx("bg-bg1 border border-line rounded-xl relative overflow-hidden shadow-card hover:border-line2 transition-colors duration-150 noise", p, className)}>
      {children}
    </div>
  );
}

export function CardLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <span className="font-mono text-[10px] tracking-[.12em] uppercase text-faint font-medium">{children}</span>
      {right && <div className="flex-shrink-0 text-[10px] font-mono text-faint">{right}</div>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ value, label, sub, color = "#b8ff3c", delay = 0 }: {
  value: string; label: string; sub?: string; color?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: .97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: .45, delay, ease: [.16,1,.3,1] }}
      className="bg-bg1 border border-line rounded-xl p-5 relative overflow-hidden noise hover:border-line2 transition-colors"
    >
      {/* Glow accent */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 blur-2xl" style={{ background: color }} />
      <div className="font-bold text-3xl tracking-tight leading-none" style={{ color }}>{value}</div>
      <div className="text-[13px] text-muted mt-2.5 leading-tight">{label}</div>
      {sub && <div className="font-mono text-[10px] text-faint mt-1">{sub}</div>}
    </motion.div>
  );
}

// ─── Bar Row ──────────────────────────────────────────────────────────────────
export function BarRow({ name, count, max, color = "#b8ff3c", delay = 0, right }: {
  name: string; count: number; max: number; color?: string; delay?: number; right?: React.ReactNode;
}) {
  const pct = max > 0 ? Math.max(2, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 group cursor-default">
      <div className="font-mono text-[11px] text-muted text-right w-28 flex-shrink-0 truncate group-hover:text-tx transition-colors" title={name}>{name}</div>
      <div className="flex-1 h-[2.5px] rounded-full bg-bg3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: .9, delay, ease: [.16,1,.3,1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <div className="font-mono text-[10px] text-faint w-10 text-right flex-shrink-0 group-hover:text-muted transition-colors">
        {right ?? count.toLocaleString()}
      </div>
    </div>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────
export function Filters({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 mb-5">{children}</div>;
}
export function FL({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[10px] text-faint tracking-wide flex-shrink-0 select-none">{children}</span>;
}
export function FB({ active, onClick, children, accent }: {
  active: boolean; onClick: () => void; children: React.ReactNode; accent?: string;
}) {
  return (
    <button onClick={onClick}
      className={clsx(
        "font-mono text-[11px] px-3 py-1 rounded-lg border transition-all duration-100 cursor-pointer select-none",
        active
          ? "border-transparent text-bg font-semibold"
          : "bg-transparent border-line text-muted hover:border-line2 hover:text-tx"
      )}
      style={active ? { background: accent ?? "#b8ff3c", color: "#030303" } : {}}
    >
      {children}
    </button>
  );
}
export function FSep() { return <div className="w-px h-3.5 bg-line flex-shrink-0 mx-1" />; }

// ─── Badges ───────────────────────────────────────────────────────────────────
type BC = "default"|"acid"|"cyan"|"violet"|"coral"|"emerald"|"gold"|"rose";
const BS: Record<BC, string> = {
  default:  "border-line2 text-muted bg-bg3",
  acid:     "border-acid/30 text-acid bg-acid/5",
  cyan:     "border-cyan/30 text-cyan bg-cyan/5",
  violet:   "border-violet/30 text-violet bg-violet/5",
  coral:    "border-coral/30 text-coral bg-coral/5",
  emerald:  "border-emerald/30 text-emerald bg-emerald/5",
  gold:     "border-gold/30 text-gold bg-gold/5",
  rose:     "border-rose/30 text-rose bg-rose/5",
};

export function Chip({ children, color = "default" }: { children: React.ReactNode; color?: BC }) {
  return (
    <span className={clsx("font-mono text-[10px] px-2 py-0.5 rounded-md border inline-block", BS[color])}>
      {children}
    </span>
  );
}

export function RemoteChip({ v }: { v: string }) {
  const val = (v ?? "").toLowerCase();
  if (val === "remote")    return <Chip color="emerald">remote</Chip>;
  if (val === "hybrid")    return <Chip color="cyan">hybrid</Chip>;
  if (val.includes("site")) return <Chip color="rose">on-site</Chip>;
  return <Chip>—</Chip>;
}

export function LevelChip({ v }: { v: string }) {
  const m: Record<string, BC> = { junior:"cyan", mid:"default", senior:"acid", staff:"gold", lead:"coral", principal:"violet" };
  return <Chip color={m[(v??"").toLowerCase()] ?? "default"}>{v || "—"}</Chip>;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
export function TT({ active, payload, label, fmt }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  fmt?: (v: number, n: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg2 border border-line2 rounded-xl px-4 py-3 font-mono text-[11px] shadow-2xl min-w-36 max-w-52">
      {label && <div className="text-hi font-semibold mb-2 text-[12px] font-sans">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-[3px]">
          <div className="w-2 h-2 rounded-full flex-shrink-0 glow-dot" style={{ background: p.color, color: p.color }} />
          <span className="text-muted truncate">{p.name}:</span>
          <span className="text-hi ml-auto pl-2">{fmt ? fmt(p.value, p.name) : p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────
export function Spin({ size = 28 }: { size?: number }) {
  return (
    <div className="rounded-full border-2 border-line2 border-t-acid animate-spin"
      style={{ width: size, height: size }} />
  );
}
export function LoadScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-80 gap-5">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-line2 border-t-acid animate-spin" />
        <div className="absolute inset-0 rounded-full border-2 border-acid/10 animate-pulse" />
      </div>
      <div className="font-mono text-[11px] text-faint tracking-widest uppercase animate-pulse">
        Loading data…
      </div>
    </div>
  );
}

// ─── Demo Banner ─────────────────────────────────────────────────────────────
export function DemoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="mx-8 mt-6 px-4 py-3 rounded-xl border border-gold/20 bg-gold/5 flex flex-wrap items-center gap-3"
    >
      <span className="font-mono text-[10px] text-gold uppercase tracking-widest flex-shrink-0">⚠ Demo data</span>
      <span className="text-[12px] text-muted">
        Run{" "}
        <code className="font-mono text-acid bg-bg3 px-1.5 py-0.5 rounded text-[11px]">
          python scraper/scrape_jobs.py && python scraper/aggregate_free.py
        </code>{" "}
        to load your real scraped data
      </span>
    </motion.div>
  );
}
