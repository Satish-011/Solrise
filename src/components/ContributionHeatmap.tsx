"use client";

import React, { useMemo, memo } from "react";

/* ── Types ── */
interface ContributionHeatmapProps {
  dailySolveCounts: Record<string, number>;
}

interface CellData {
  key: string;
  level: number;
  title: string;
  hidden: boolean;
}

interface GridData {
  /** Column-major flat list: iterate week→day so grid-auto-flow:column works */
  cells: CellData[];
  monthLabels: { text: string; col: number }[];
  totalSolved: number;
}

/* ── Constants ── */
const TOTAL_WEEKS = 53;
const DAYS_IN_WEEK = 7;
const DAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

/** Green/cyan monochromatic scale via CSS variables */
const LEVEL_CLASSES = [
  "bg-[var(--heatmap-0)]",
  "bg-[var(--heatmap-1)]",
  "bg-[var(--heatmap-2)]",
  "bg-[var(--heatmap-3)]",
  "bg-[var(--heatmap-4)]",
] as const;

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

/** Format YYYY-MM-DD → human-readable local date */
function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Extract local date string YYYY-MM-DD from a Date object */
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Build a column-major cell list (week → day order).
 * With CSS `grid-auto-flow: column` and 7 template rows,
 * cells fill each column (week) top-to-bottom before moving to the next —
 * no explicit grid-row / grid-column inline styles needed.
 */
function buildGrid(daily: Record<string, number>): GridData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDay = new Date(today);
  endDay.setDate(endDay.getDate() + (6 - endDay.getDay()));

  const startDay = new Date(endDay);
  startDay.setDate(startDay.getDate() - TOTAL_WEEKS * 7 + 1);

  const cells: CellData[] = [];
  const monthLabels: { text: string; col: number }[] = [];
  let prevMonth = -1;
  let totalSolved = 0;
  const cursor = new Date(startDay);

  for (let w = 0; w < TOTAL_WEEKS; w++) {
    for (let d = 0; d < DAYS_IN_WEEK; d++) {
      const iso = toLocalDateStr(cursor);
      const isFuture = cursor > today;
      const count = isFuture ? 0 : daily[iso] || 0;
      if (!isFuture) totalSolved += count;

      cells.push({
        key: iso,
        level: isFuture ? -1 : getLevel(count),
        title: isFuture
          ? ""
          : count === 0
            ? `No submissions on ${formatDate(iso)}`
            : `${count} problem${count !== 1 ? "s" : ""} on ${formatDate(iso)}`,
        hidden: isFuture,
      });

      // Track month boundaries on the first day (Sunday) of each week
      if (d === 0) {
        const m = cursor.getMonth();
        if (m !== prevMonth) {
          monthLabels.push({
            text: cursor.toLocaleString("en-US", { month: "short" }),
            col: w,
          });
          prevMonth = m;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return { cells, monthLabels, totalSolved };
}

/* ── Cell component — native title tooltip, zero inline styles ── */
const HeatmapCell = memo(function HeatmapCell({ cell }: { cell: CellData }) {
  if (cell.hidden) {
    return <div className="w-4 h-4" />;
  }
  return (
    <div
      className={`w-4 h-4 rounded-sm ${LEVEL_CLASSES[cell.level]} transition-colors duration-75 hover:ring-1 hover:ring-white/20 cursor-default`}
      title={cell.title}
    />
  );
});

/* ── Main component ── */
function ContributionHeatmap({ dailySolveCounts }: ContributionHeatmapProps) {
  const { cells, monthLabels, totalSolved } = useMemo(
    () => buildGrid(dailySolveCounts),
    [dailySolveCounts],
  );

  // Visible month labels — skip ones that are too close together
  const months = useMemo(() => {
    const out: { text: string; col: number }[] = [];
    for (const m of monthLabels) {
      if (out.length === 0 || m.col - out[out.length - 1].col >= 3) {
        out.push(m);
      }
    }
    return out;
  }, [monthLabels]);

  return (
    <div className="rounded-2xl glass-card p-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/80 to-teal-500/80 flex items-center justify-center">
          <i className="fa-solid fa-calendar-days text-white text-[10px]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
          {totalSolved.toLocaleString()} contributions in the last year
        </h3>
      </div>

      {/* Scrollable heatmap — centered, not full-width */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels row — offset by day-label column width */}
          <div className="grid grid-cols-[repeat(53,1rem)] gap-1 mb-1 pl-9">
            {Array.from({ length: TOTAL_WEEKS }, (_, w) => {
              const label = months.find((m) => m.col === w);
              return (
                <div
                  key={w}
                  className="text-[10px] leading-none text-[var(--text-muted)] font-medium truncate"
                >
                  {label?.text ?? ""}
                </div>
              );
            })}
          </div>

          {/* Main grid: day labels + cells */}
          <div className="flex">
            {/* Day labels column — 7 rows matching cell h-4 + gap-1 */}
            <div className="flex flex-col gap-1 pr-1 w-8 shrink-0">
              {Array.from({ length: DAYS_IN_WEEK }, (_, d) => (
                <div key={d} className="h-4 flex items-center justify-end">
                  <span className="text-[10px] leading-none text-[var(--text-muted)] font-medium">
                    {DAY_LABELS[d] ?? ""}
                  </span>
                </div>
              ))}
            </div>

            {/* Cell grid — 7 rows × 53 cols, column-major auto flow */}
            <div className="grid grid-rows-[repeat(7,1rem)] grid-flow-col auto-cols-[1rem] gap-1">
              {cells.map((cell) => (
                <HeatmapCell key={cell.key} cell={cell} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-[10px] text-[var(--text-muted)]">Less</span>
        {LEVEL_CLASSES.map((cls, i) => (
          <span
            key={i}
            className={`inline-block w-[10px] h-[10px] rounded-sm ${cls}`}
          />
        ))}
        <span className="text-[10px] text-[var(--text-muted)]">More</span>
      </div>
    </div>
  );
}

export default memo(ContributionHeatmap);
