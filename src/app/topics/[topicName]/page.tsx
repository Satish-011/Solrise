"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import ProblemCard from "@/components/ProblemCard";
import { UserStatus } from "@/types";
import { paginate } from "@/utils/paginate";

const PER_PAGE = 30;

const SORT_OPTIONS = [
  { value: "new", label: "Newest", icon: "fa-clock" },
  { value: "old", label: "Oldest", icon: "fa-clock-rotate-left" },
  { value: "acceptance", label: "Most Solved", icon: "fa-fire" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

/** Rating chip values: "all" or 800–3500 in steps of 100 */
const RATING_CHIPS: (number | "all")[] = [
  "all",
  ...Array.from({ length: 28 }, (_, i) => 800 + i * 100),
];

export default function TopicDetailPage() {
  const params = useParams<{ topicName: string }>();
  const router = useRouter();
  const { problems, userSolvedSet } = useAppContext();

  // Security: decode + sanitise dynamic route param
  const rawTopic = decodeURIComponent(params.topicName ?? "");
  const topicName = rawTopic
    .replace(/[<>"'&]/g, "") // strip HTML-special chars
    .replace(/[\x00-\x1F\x7F]/g, "") // strip control chars
    .slice(0, 100);

  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [sort, setSort] = useState<SortKey>("new");
  const [hideSolved, setHideSolved] = useState(false);

  // Rating chip filter — exact rating or "all"
  const [ratingChip, setRatingChip] = useState<number | "all">("all");

  // Rating range filter
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [appliedRange, setAppliedRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [rangeError, setRangeError] = useState("");

  const applyRange = useCallback(() => {
    const min = minInput ? parseInt(minInput, 10) : NaN;
    const max = maxInput ? parseInt(maxInput, 10) : NaN;

    if (!minInput && !maxInput) {
      // Both empty → clear range
      setAppliedRange(null);
      setRatingChip("all");
      setRangeError("");
      return;
    }

    if ((minInput && isNaN(min)) || (maxInput && isNaN(max))) {
      setRangeError("Enter valid numbers");
      return;
    }

    const lo = isNaN(min) ? 0 : min;
    const hi = isNaN(max) ? 10000 : max;

    if (lo > hi) {
      setRangeError("Min must be ≤ Max");
      return;
    }

    setAppliedRange({ min: lo, max: hi });
    setRatingChip("all"); // range overrides chip
    setRangeError("");
    setPage(1);
    setPageInput("1");
  }, [minInput, maxInput]);

  const clearRange = useCallback(() => {
    setMinInput("");
    setMaxInput("");
    setAppliedRange(null);
    setRangeError("");
  }, []);

  const handleChipClick = useCallback(
    (chip: number | "all") => {
      setRatingChip(chip);
      // Clear range when a chip is selected
      if (appliedRange) clearRange();
      setPage(1);
      setPageInput("1");
    },
    [appliedRange, clearRange],
  );

  const filtered = useMemo(() => {
    let list = problems.filter((p) =>
      p.tags?.some((t) => t.toLowerCase() === topicName.toLowerCase()),
    );

    // Apply rating chip filter (exact match)
    if (ratingChip !== "all" && !appliedRange) {
      list = list.filter((p) => p.rating === ratingChip);
    }

    // Apply rating range filter
    if (appliedRange) {
      list = list.filter(
        (p) =>
          (p.rating ?? 0) >= appliedRange.min &&
          (p.rating ?? 0) <= appliedRange.max,
      );
    }

    // Hide solved filter
    if (hideSolved) {
      list = list.filter(
        (p) =>
          !userSolvedSet.has(
            `${p.contestId}-${String(p.index ?? "")
              .toUpperCase()
              .trim()}`,
          ),
      );
    }

    // Sort (copy to avoid mutation)
    const sorted = [...list];
    switch (sort) {
      case "new":
        sorted.sort((a, b) => (b.contestId ?? 0) - (a.contestId ?? 0));
        break;
      case "old":
        sorted.sort((a, b) => (a.contestId ?? 0) - (b.contestId ?? 0));
        break;
      case "acceptance":
        sorted.sort((a, b) => (b.solvedCount ?? 0) - (a.solvedCount ?? 0));
        break;
    }

    return sorted;
  }, [
    problems,
    topicName,
    sort,
    ratingChip,
    appliedRange,
    hideSolved,
    userSolvedSet,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = paginate(filtered, page, PER_PAGE);

  const handlePageChange = (num: number) => {
    const clamped = Math.max(1, Math.min(num, totalPages));
    setPage(clamped);
    setPageInput(String(clamped));
  };

  if (problems.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="h-8 w-48 skeleton" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back + Header */}
        <div className="mb-8 animate-fade-in-up">
          <button
            onClick={() => router.push("/topics")}
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-4"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            Back to Topics
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 capitalize">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center shadow-sm">
              <i className="fa-solid fa-tag text-[var(--accent)]" />
            </div>
            {topicName}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2 ml-[52px] sm:ml-[60px]">
            <span className="font-semibold text-[var(--text-primary)]">
              {filtered.length.toLocaleString()}
            </span>{" "}
            problems found
          </p>
        </div>

        {/* Sort Controls + Hide Solved */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Hide Solved Toggle */}
          <button
            onClick={() => {
              setHideSolved((v) => !v);
              setPage(1);
              setPageInput("1");
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
              hideSolved
                ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm shadow-[var(--accent)]/20"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
            }`}
          >
            <div
              className={`relative w-7 h-4 rounded-full transition-colors duration-200 ${
                hideSolved ? "bg-white/30" : "bg-[var(--border-color)]"
              }`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${
                  hideSolved
                    ? "left-3.5 bg-white"
                    : "left-0.5 bg-[var(--text-muted)]"
                }`}
              />
            </div>
            Hide Solved
          </button>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] w-fit">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setSort(opt.value);
                  handlePageChange(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  sort === opt.value
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <i className={`fa-solid ${opt.icon}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating Chips */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {RATING_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  ratingChip === chip && !appliedRange
                    ? "bg-[var(--accent)] text-white shadow-sm shadow-[var(--accent)]/20 scale-105"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:scale-[1.03] active:scale-[0.97]"
                }`}
              >
                {chip === "all" ? "All" : chip}
              </button>
            ))}
          </div>
        </div>

        {/* Rating Range Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-[var(--text-muted)] font-medium">
            Range:
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Min"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && applyRange()}
            className="w-16 px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs text-center placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
          />
          <span className="text-xs text-[var(--text-muted)]">—</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Max"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && applyRange()}
            className="w-16 px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs text-center placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
          />
          <button
            onClick={applyRange}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-all"
          >
            Apply
          </button>
          {appliedRange && (
            <button
              onClick={() => {
                clearRange();
                setPage(1);
                setPageInput("1");
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
            >
              <i className="fa-solid fa-xmark mr-1" />
              Clear
            </button>
          )}
          {rangeError && (
            <span className="text-xs text-[var(--danger)] font-medium">
              {rangeError}
            </span>
          )}
          {appliedRange && !rangeError && (
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              Showing {appliedRange.min}–{appliedRange.max}
            </span>
          )}
        </div>

        {/* Problem List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
            <i className="fa-solid fa-folder-open text-3xl mb-3 opacity-40" />
            <p className="text-sm">No problems found for this topic</p>
          </div>
        ) : (
          <>
            <div className="stagger-children space-y-2">
              {paged.map((p, idx) => {
                const key = `${p.contestId}-${p.index}`;
                const status: UserStatus = userSolvedSet.has(key)
                  ? "solved"
                  : "unsolved";
                const problemNumber = (page - 1) * PER_PAGE + idx + 1;

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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  disabled={page === 1}
                  onClick={() => handlePageChange(1)}
                  title="First page"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] disabled:opacity-30 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                >
                  <i className="fa-solid fa-angles-left" />
                </button>
                <button
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  title="Previous page"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] disabled:opacity-30 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
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
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] disabled:opacity-30 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(totalPages)}
                  title="Last page"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] disabled:opacity-30 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                >
                  <i className="fa-solid fa-angles-right" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
