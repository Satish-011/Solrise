"use client";

import React, { useMemo, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { cfRatingColors } from "@/utils/cfRatingColors";

const getCfRatingColor = (rating: number): string => {
  const rounded = Math.floor(rating / 100) * 100;
  return cfRatingColors[rounded] || "#808080";
};

export default function UnsolvedPage() {
  const { handle, problems, attemptedUnsolvedProblems, loadingUser } =
    useAppContext();
  const [sortBy, setSortBy] = useState<"rating-asc" | "rating-desc">(
    "rating-asc",
  );

  const unsolvedProblems = useMemo(() => {
    if (!attemptedUnsolvedProblems || attemptedUnsolvedProblems.length === 0)
      return [];
    const unsolvedKeys = new Set(attemptedUnsolvedProblems.map((a) => a.key));
    const list = problems.filter((p) => {
      const key = `${p.contestId}-${p.index}`;
      return unsolvedKeys.has(key);
    });
    list.sort((a, b) => {
      const rA = a.rating ?? 0;
      const rB = b.rating ?? 0;
      return sortBy === "rating-asc" ? rA - rB : rB - rA;
    });
    return list;
  }, [problems, attemptedUnsolvedProblems, sortBy]);

  if (!handle) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-[var(--danger-bg)] flex items-center justify-center mx-auto">
            <i className="fa-solid fa-circle-xmark text-3xl text-[var(--danger)]" />
          </div>
          <h2 className="text-xl font-bold">View Unsolved Problems</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-xs">
            Enter your Codeforces handle in the navbar to see unsolved problems.
          </p>
        </div>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="h-8 w-64 skeleton" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-fade-in-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-clock-rotate-left text-orange-500" />
              </div>
              Unsolved Problems
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-2 ml-[52px] sm:ml-[60px]">
              {unsolvedProblems.length} problems attempted but not yet solved
            </p>
          </div>

          <div className="flex gap-1.5">
            {[
              {
                value: "rating-asc" as const,
                label: "Low \u2192 High",
                icon: "fa-arrow-up-1-9",
              },
              {
                value: "rating-desc" as const,
                label: "High \u2192 Low",
                icon: "fa-arrow-down-9-1",
              },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  sortBy === opt.value
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
              >
                <i className={`fa-solid ${opt.icon} text-[10px]`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {unsolvedProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
              <i className="fa-solid fa-circle-check text-3xl text-emerald-500" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              No unsolved attempted problems!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
            {unsolvedProblems.map((p) => {
              const url = `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;
              const rColor = getCfRatingColor(p.rating ?? 0);
              return (
                <a
                  key={`${p.contestId}-${p.index}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card group p-3.5 sm:p-4 rounded-xl border-l-4 hover:scale-[1.01] transition-all"
                  style={{ borderLeftColor: rColor }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                      {p.contestId}
                      {p.index}
                    </span>
                    {p.rating && (
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: rColor }}
                      >
                        {p.rating}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                    {p.name}
                  </div>
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {p.tags.length > 3 && (
                        <span className="text-[9px] text-[var(--text-muted)]">
                          +{p.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
