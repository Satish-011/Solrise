"use client";

import React, { useMemo, memo } from "react";

/* ── Types ── */
export interface RatingBucket {
  rating: number;
  count: number;
}

interface RatingBarChartProps {
  buckets: RatingBucket[];
}

/* ── Rating → color gradient (Codeforces-inspired scale) ── */
function barGradient(rating: number): string {
  if (rating < 1200) return "from-gray-400 to-gray-500";
  if (rating < 1400) return "from-green-400 to-green-500";
  if (rating < 1600) return "from-cyan-400 to-teal-500";
  if (rating < 1900) return "from-blue-400 to-blue-600";
  if (rating < 2100) return "from-violet-400 to-purple-600";
  if (rating < 2400) return "from-orange-400 to-amber-500";
  return "from-red-400 to-rose-600";
}

/* ── Main chart ── */
function RatingBarChart({ buckets }: RatingBarChartProps) {
  const maxCount = useMemo(
    () => Math.max(...buckets.map((b) => b.count), 1),
    [buckets],
  );

  // Inject CSS custom property for each bar height via a className trick isn't
  // possible without inline styles. Instead we use a tiny inline <style> block
  // scoped by data attribute so each bar's height is set purely via CSS.
  const barStyles = useMemo(() => {
    return buckets.map((b) => {
      const pct = maxCount > 0 ? (b.count / maxCount) * 100 : 0;
      return b.count > 0 ? `${Math.max(pct, 6)}%` : "0%";
    });
  }, [buckets, maxCount]);

  if (buckets.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--text-muted)]">
        No rating data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Scoped styles for bar heights — avoids inline style attribute */}
      <style>
        {buckets
          .map(
            (b, i) =>
              `[data-bar-chart] [data-bar="${i}"] { height: ${barStyles[i]}; }`,
          )
          .join("\n")}
      </style>

      <div
        className="inline-flex items-end gap-1 min-w-full px-2"
        data-bar-chart
      >
        {buckets.map((bucket, i) => (
          <div
            key={bucket.rating}
            className="flex flex-col items-center gap-1.5 flex-1 min-w-0"
          >
            {/* Bar area */}
            <div className="w-full h-40 flex items-end justify-center">
              <div
                data-bar={i}
                className={`w-full max-w-[28px] rounded-t-md bg-gradient-to-t ${barGradient(bucket.rating)} transition-all duration-500 ease-out hover:opacity-80 hover:scale-x-110 cursor-default relative group`}
                title={`Rating ${bucket.rating}: ${bucket.count} problem${bucket.count !== 1 ? "s" : ""} solved`}
              >
                {/* Count label on hover */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {bucket.count}
                </div>
                {/* Inline count */}
                {(bucket.count / maxCount) * 100 > 18 && (
                  <div className="absolute inset-x-0 top-1.5 text-center text-[10px] font-bold text-white/90 drop-shadow-sm">
                    {bucket.count}
                  </div>
                )}
              </div>
            </div>
            {/* X-axis label */}
            <span className="text-[10px] text-[var(--text-muted)] font-medium leading-none">
              {bucket.rating}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(RatingBarChart);
