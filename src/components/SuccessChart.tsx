"use client";

import React, { useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

interface SuccessChartProps {
  totalSolved: number;
  totalAttemptedUnsolved: number;
  totalNotTried: number;
  size?: number;
}

const COLORS = [
  "var(--solved-color)",
  "var(--unsolved-color)",
  "var(--not-tried-color)",
];
const NAMES = ["Solved", "Attempted Unsolved", "Not Tried"];
const EMPTY_DATA = [{ name: "empty", value: 1 }] as const;

const TOOLTIP_STYLE: React.CSSProperties = {
  zIndex: 9999,
  fontSize: "0.7rem",
  backgroundColor: "var(--tooltip-bg)",
  color: "var(--tooltip-text)",
  borderRadius: "10px",
  padding: "6px 10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  border: "1px solid var(--border-color)",
};

const CURSOR_STYLE = { fill: "transparent" } as const;

const formatNumber = (n: number) => n.toLocaleString();

const SuccessChart: React.FC<SuccessChartProps> = ({
  totalSolved,
  totalAttemptedUnsolved,
  totalNotTried,
  size = 140,
}) => {
  const data = useMemo(
    () => [
      { name: NAMES[0], value: Math.max(0, Math.round(totalSolved)) },
      {
        name: NAMES[1],
        value: Math.max(0, Math.round(totalAttemptedUnsolved)),
      },
      { name: NAMES[2], value: Math.max(0, Math.round(totalNotTried)) },
    ],
    [totalSolved, totalAttemptedUnsolved, totalNotTried],
  );

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  const withPerc = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        percent: total > 0 ? Math.round((d.value / total) * 1000) / 10 : 0,
      })),
    [data, total],
  );

  const centerText = useMemo(() => `${withPerc[0]?.percent ?? 0}%`, [withPerc]);

  const tooltipFormatter = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value: any, name?: string) => {
      const item = withPerc.find((i) => i.name === name) || null;
      const pct = item ? `${item.percent}%` : "";
      return [`${formatNumber(value ?? 0)} (${pct})`, name ?? ""];
    },
    [withPerc],
  );

  const chartData = total === 0 ? EMPTY_DATA : withPerc;
  const innerRadius = size * 0.35;
  const outerRadius = size * 0.47;

  return (
    <div
      aria-hidden
      className="relative flex flex-col items-center transition-colors duration-300"
      style={{ width: `${size}px`, height: `${size + 10}px` }}
    >
      <div
        className="relative"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <PieChart width={size} height={size}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={90}
            endAngle={450}
            dataKey="value"
            stroke="none"
            isAnimationActive
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {(total === 0 ? EMPTY_DATA : withPerc).map((entry, index) =>
              total === 0 ? (
                <Cell key="empty" fill="var(--muted-bg)" />
              ) : (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ),
            )}
          </Pie>
          <Tooltip
            formatter={tooltipFormatter}
            cursor={CURSOR_STYLE}
            wrapperStyle={TOOLTIP_STYLE}
          />
        </PieChart>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="absolute w-16 h-16 rounded-full bg-[var(--accent)] opacity-[0.04] blur-xl" />
          <div className="text-xl font-extrabold tracking-tight text-[var(--accent)]">
            {centerText}
          </div>
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.15em] font-semibold mt-0.5">
            Solved
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SuccessChart);
