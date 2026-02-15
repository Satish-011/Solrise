"use client";

import React, { useMemo, useState, useEffect } from "react";
import RatingSelector from "./RatingSelector";
import TagSelector from "./TagSelector";
import ProblemList from "./ProblemList";
import { Problem, UserStatus } from "../types";

interface LadderProps {
  problems: Problem[];
  userSolvedSet?: Set<string>;
}

const Ladder: React.FC<LadderProps> = ({
  problems,
  userSolvedSet = new Set(),
}) => {
  const [selectedRating, setSelectedRating] = useState<number>(800);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [userStatusMap, setUserStatusMap] = useState<
    Record<string, UserStatus>
  >({});
  const [showTags, setShowTags] = useState<boolean>(false);

  useEffect(() => {
    setSelectedTags(new Set());
  }, [selectedRating]);
  useEffect(() => {
    if (!showTags) setSelectedTags(new Set());
  }, [showTags]);

  const problemsForRating = useMemo(
    () => problems.filter((p) => p.rating === selectedRating),
    [problems, selectedRating],
  );

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of problemsForRating) {
      for (const t of p.tags || []) counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [problemsForRating]);

  const sortedTags = useMemo(() => {
    const keys = Object.keys(tagCounts);
    keys.sort((a, b) => {
      const diff = (tagCounts[b] || 0) - (tagCounts[a] || 0);
      return diff !== 0 ? diff : a.localeCompare(b);
    });
    return keys;
  }, [tagCounts]);

  const filteredProblems = useMemo(() => {
    if (!showTags || selectedTags.size === 0) {
      return problemsForRating;
    }
    // AND logic: problem must have ALL selected tags
    return problemsForRating.filter((p) => {
      if (!p.tags || p.tags.length === 0) return false;
      const problemTagSet = new Set(p.tags);
      for (const selectedTag of selectedTags) {
        if (!problemTagSet.has(selectedTag)) {
          return false;
        }
      }
      return true;
    });
  }, [problemsForRating, selectedTags, showTags]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  const handleClearTags = () => {
    setSelectedTags(new Set());
  };

  const handleStatusChange = (problemKey: string, status: UserStatus) => {
    setUserStatusMap((prev) => ({ ...prev, [problemKey]: status }));
  };

  return (
    <div className="space-y-5 w-full">
      {/* Rating selector */}
      <section className="space-y-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            <i className="fa-solid fa-layer-group text-[var(--accent)] mr-2" />
            Select Rating
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent-bg)] text-[var(--accent)] font-semibold shadow-sm">
            {problemsForRating.length} problems
          </span>
        </div>
        <RatingSelector
          selectedRating={selectedRating}
          onSelect={setSelectedRating}
        />
      </section>

      {/* Tag toggle + selector */}
      <section className="space-y-2.5">
        <button
          onClick={() => setShowTags(!showTags)}
          className={`group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
            showTags
              ? "bg-[var(--accent)] text-white shadow-lg shadow-amber-500/25"
              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)]/60 hover:text-[var(--text-primary)] hover:shadow-md"
          }`}
        >
          <i
            className={`fa-solid ${showTags ? "fa-eye-slash" : "fa-tags"} text-xs transition-transform duration-300 ${showTags ? "" : "group-hover:rotate-12"}`}
          />
          {showTags ? "Hide Tags" : "Filter by Tags"}
          {!showTags && selectedTags.size === 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-muted)] font-medium">
              {sortedTags.length}
            </span>
          )}
          {!showTags && selectedTags.size > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)] text-white font-medium">
              {selectedTags.size} active
            </span>
          )}
        </button>

        {showTags && (
          <div className="animate-fade-in-up">
            <TagSelector
              tags={sortedTags}
              tagCounts={tagCounts}
              selectedTags={selectedTags}
              onToggleTag={handleToggleTag}
              onClearAll={handleClearTags}
            />
          </div>
        )}
      </section>

      {/* Empty state for no results */}
      {showTags && selectedTags.size > 0 && filteredProblems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4 border border-[var(--border-color)]">
            <i className="fa-solid fa-filter-circle-xmark text-3xl text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            No problems found for selected filters
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-5 text-center max-w-md">
            Try removing some filters to see more results
          </p>
          <button
            onClick={handleClearTags}
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            <i className="fa-solid fa-filter-circle-xmark text-xs" />
            Clear Filters
          </button>
        </div>
      ) : (
        /* Problem list */
        <ProblemList
          problems={filteredProblems}
          userStatusMap={userStatusMap}
          userSolvedSet={userSolvedSet}
          selectedTags={selectedTags}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default Ladder;
