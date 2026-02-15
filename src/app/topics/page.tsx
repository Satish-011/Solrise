"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";

const ACCENT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#14b8a6",
  "#e11d48",
  "#84cc16",
  "#7c3aed",
  "#0ea5e9",
  "#d946ef",
  "#f43f5e",
];

const ICONS: Record<string, string> = {
  dp: "fa-table-cells",
  math: "fa-calculator",
  greedy: "fa-bolt",
  implementation: "fa-code",
  "brute force": "fa-hammer",
  "data structures": "fa-database",
  "constructive algorithms": "fa-puzzle-piece",
  sortings: "fa-arrow-down-short-wide",
  "binary search": "fa-magnifying-glass",
  "dfs and similar": "fa-diagram-project",
  graphs: "fa-circle-nodes",
  strings: "fa-font",
  "number theory": "fa-hashtag",
  geometry: "fa-shapes",
  trees: "fa-sitemap",
  combinatorics: "fa-dice",
  "two pointers": "fa-arrows-left-right",
  bitmasks: "fa-microchip",
  probabilities: "fa-chart-pie",
  games: "fa-gamepad",
  flows: "fa-water",
  "divide and conquer": "fa-scissors",
  hashing: "fa-fingerprint",
  interactive: "fa-comments",
  matrices: "fa-border-all",
  fft: "fa-wave-square",
  "shortest paths": "fa-route",
  dsu: "fa-link",
};

function getIcon(tag: string) {
  const lower = tag.toLowerCase();
  for (const [key, icon] of Object.entries(ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "fa-tag";
}

export default function TopicsPage() {
  const { tagCounts, problems } = useAppContext();
  const [search, setSearch] = useState("");

  const sortedTags = useMemo(() => {
    const entries = Object.entries(tagCounts);
    entries.sort((a, b) => b[1] - a[1]);
    return entries;
  }, [tagCounts]);

  const filteredTags = useMemo(() => {
    if (!search.trim()) return sortedTags;
    const q = search.toLowerCase();
    return sortedTags.filter(([tag]) => tag.toLowerCase().includes(q));
  }, [sortedTags, search]);

  const maxCount = useMemo(
    () => (sortedTags.length > 0 ? sortedTags[0][1] : 1),
    [sortedTags],
  );

  if (sortedTags.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="h-8 w-48 skeleton" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shadow-sm">
              <i className="fa-solid fa-tags text-amber-500" />
            </div>
            Topics
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2 ml-[52px] sm:ml-[60px]">
            Explore{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {sortedTags.length}
            </span>{" "}
            tags across{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {problems.length.toLocaleString()}
            </span>{" "}
            problems
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5 max-w-md">
          <i className="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs" />
          <input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all shadow-sm"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
          {filteredTags.map(([tag, count], idx) => {
            const color = ACCENT_COLORS[idx % ACCENT_COLORS.length];
            const barWidth = Math.max(8, (count / maxCount) * 100);
            const icon = getIcon(tag);

            return (
              <Link
                key={tag}
                href={`/topics/${encodeURIComponent(tag)}`}
                className="group card rounded-xl p-5 hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden relative block"
              >
                {/* Top accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: color }}
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      <i className={`fa-solid ${icon} text-xs`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate capitalize text-[var(--text-primary)]">
                        {tag}
                      </h3>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {count.toLocaleString()} problems
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-base font-bold shrink-0"
                    style={{ color }}
                  >
                    {count.toLocaleString()}
                  </span>
                </div>

                <div className="mt-3 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${barWidth}%`, backgroundColor: color }}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {filteredTags.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
            <i className="fa-solid fa-search text-3xl mb-3 opacity-40" />
            <p className="text-sm">No topics match your search</p>
          </div>
        )}
      </main>
    </div>
  );
}
