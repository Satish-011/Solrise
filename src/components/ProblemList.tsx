"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProblemCard from "./ProblemCard";
import ProblemSortControls from "./ProblemSortControls";
import { Problem, UserStatus } from "../types";
import { paginate } from "../utils/paginate";

interface ProblemListProps {
  problems: Problem[];
  userStatusMap: Record<string, UserStatus>;
  userSolvedSet?: Set<string>;
  perPage?: number;
  selectedTags?: Set<string>;
  onStatusChange?: (problemKey: string, status: UserStatus) => void;
}

const ProblemList: React.FC<ProblemListProps> = ({
  problems,
  userStatusMap,
  userSolvedSet = new Set(),
  perPage = 30,
  selectedTags = new Set(),
}) => {
  const [page, setPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [sortOption, setSortOption] = useState<"acceptance" | "new" | "old">(
    "new",
  );
  const [hideSolved, setHideSolved] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("cf_hide_solved");
    if (saved !== null) setHideSolved(saved === "true");
  }, []);

  const handleHideSolvedChange = (v: boolean) => {
    setHideSolved(v);
    localStorage.setItem("cf_hide_solved", String(v));
  };




  useEffect(() => {
    setPage(1);
    setPageInput("1");
  }, [selectedTags.size]);

  const filteredSorted = useMemo(() => {
    let list = [...problems];
    if (hideSolved) {
      list = list.filter((p) => {
        const key = `${p.contestId}-${p.index}`;
        const status: UserStatus =
          userStatusMap[key] ??
          (userSolvedSet.has(key) ? "solved" : "unsolved");
        return status !== "solved";
      });
    }
    switch (sortOption) {
      case "acceptance":
        list.sort((a, b) => (b.solvedCount ?? 0) - (a.solvedCount ?? 0));
        break;
      case "old":
        list.sort((a, b) => (a.contestId ?? 0) - (b.contestId ?? 0));
        break;
      default:
        list.sort((a, b) => (b.contestId ?? 0) - (a.contestId ?? 0));
        break;
    }
    return list;
  }, [problems, sortOption, hideSolved, userStatusMap, userSolvedSet]);



  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / perPage));
  const paged = paginate(filteredSorted, page, perPage);

  useEffect(() => setPageInput(String(page)), [page]);

  const handlePageChange = (num: number) => {
    if (num < 1) num = 1;
    else if (num > totalPages) num = totalPages;
    setPage(num);
  };



  return (
    <div className="space-y-3.5">
      <ProblemSortControls
        sortOption={sortOption}
        onSortChange={(v) => {
          setSortOption(v);
          handlePageChange(1);
        }}
        hideSolved={hideSolved}
        onHideSolvedChange={handleHideSolvedChange}
      />

      <div className="stagger-children space-y-2">
        {paged.map((p, idx) => {
          const key = `${p.contestId}-${p.index}`;
          const status: UserStatus =
            userStatusMap[key] ??
            (userSolvedSet.has(key) ? "solved" : "unsolved");
          const problemNumber = (page - 1) * perPage + idx + 1;

          return (
            <ProblemCard
              key={key}
              problem={p}
              status={status}
              number={problemNumber}
            />
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-3">
        <button
          disabled={page === 1}
          onClick={() => handlePageChange(1)}
          title="First page"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] disabled:opacity-30 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-sm transition-all"
        >
          <i className="fa-solid fa-angles-left" />
        </button>
        <button
          disabled={page === 1}
          onClick={() => handlePageChange(page - 1)}
          title="Previous page"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] disabled:opacity-30 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-sm transition-all"
        >
          <i className="fa-solid fa-chevron-left" />
        </button>

        <div className="flex items-center gap-1.5 px-3">
          <input
            type="text"
            value={pageInput}
            title="Page number"
            placeholder="Page"
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const num = parseInt(pageInput, 10);
                handlePageChange(isNaN(num) ? 1 : num);
              }
            }}
            className="w-12 px-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-center text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <span className="text-xs text-[var(--text-muted)]">
            of {totalPages}
          </span>
        </div>

        <button
          disabled={page === totalPages}
          onClick={() => handlePageChange(page + 1)}
          title="Next page"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] disabled:opacity-30 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-sm transition-all"
        >
          <i className="fa-solid fa-chevron-right" />
        </button>
        <button
          disabled={page === totalPages}
          onClick={() => handlePageChange(totalPages)}
          title="Last page"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] disabled:opacity-30 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-sm transition-all"
        >
          <i className="fa-solid fa-angles-right" />
        </button>
      </div>
    </div>
  );
};

export default ProblemList;
