"use client";
import React from "react";
import Link from "next/link";
import { useAppContext } from "../context/AppContext";

const Unsolved: React.FC = () => {
  const { attemptedUnsolvedProblems } = useAppContext();

  if (!attemptedUnsolvedProblems || attemptedUnsolvedProblems.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] py-4">
        <i className="fa-solid fa-circle-check text-emerald-500" />
        No attempted-but-unsolved problems. Great work!
      </div>
    );
  }

  const filtered = attemptedUnsolvedProblems.filter(
    (p) =>
      p.contestId &&
      Number.isInteger(p.contestId) &&
      p.contestId > 0 &&
      /^[A-Z0-9]+$/.test(p.index),
  );

  if (filtered.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] py-4">
        <i className="fa-solid fa-circle-check text-emerald-500" />
        No valid attempted problems to show.
      </div>
    );
  }

  const sorted = [...filtered].sort(
    (a, b) => (b.lastTime ?? 0) - (a.lastTime ?? 0),
  );
  const limited = sorted.slice(0, 40);
  const hasMore = sorted.length > 40;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 stagger-children">
        {limited.map((p) => {
          const id = `${p.contestId}-${p.index}`;
          return (
            <a
              key={p.key}
              href={p.link}
              target="_blank"
              rel="noreferrer"
              className="group"
            >
              <div className="flex items-center justify-center rounded-xl px-2 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all duration-200 hover:-translate-y-1 hover:shadow-sm">
                <span className="text-xs font-bold font-mono">{id}</span>
              </div>
            </a>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Link
            href="/unsolved"
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            View All Unsolved
            <i className="fa-solid fa-arrow-right text-xs" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Unsolved;
