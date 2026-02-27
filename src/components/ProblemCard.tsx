import React, { useSyncExternalStore } from "react";
import { Problem, UserStatus } from "../types";
import { FaUser } from "react-icons/fa";
import { cfRatingColors } from "../utils/cfRatingColors";
import { getTagColor } from "../utils/tagColors";

// Shared dark-mode subscription — all ProblemCards share one listener instead of N MutationObservers
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "class"],
  });
  mq.addEventListener("change", cb);
  return () => {
    mo.disconnect();
    mq.removeEventListener("change", cb);
  };
};
const getIsDark = () => {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  return document.documentElement.classList.contains("dark");
};
const getServerSnapshot = () => false;

interface ProblemCardProps {
  problem: Problem;
  status: UserStatus;
  number?: number;
}

const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  status,
  number,
}) => {
  const isDark = useSyncExternalStore(subscribe, getIsDark, getServerSnapshot);

  const isSolved = status === "solved";
  const isFailed = status === "failed";

  const ratingColor = problem.rating
    ? cfRatingColors[problem.rating] || "#6366f1"
    : "#6366f1";

  const problemURL =
    problem.contestId && problem.index
      ? `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
      : "#";

  return (
    <a
      href={problemURL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group card flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl transition-all duration-200 ${
        isSolved
          ? "border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
          : isFailed
            ? "border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-900/10"
            : "border-l-4 border-l-transparent hover:border-l-[var(--accent)]"
      }`}
    >
      {/* Number + Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {number && (
          <span className="text-xs font-bold text-[var(--text-muted)] w-8 text-right shrink-0">
            {number}.
          </span>
        )}

        {/* Status icon */}
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${
            isSolved
              ? "bg-emerald-500 text-white"
              : isFailed
                ? "bg-red-400 text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
          }`}
        >
          <i
            className={`fa-solid ${
              isSolved ? "fa-check" : isFailed ? "fa-xmark" : "fa-minus"
            } text-[8px]`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
              {problem.name}
            </span>
            <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-color)]">
              {problem.contestId}
              {problem.index}
            </span>
          </div>
        </div>
      </div>

      {/* Rating pill */}
      {problem.rating && (
        <span
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-sm"
          style={{
            backgroundColor: ratingColor,
            boxShadow: `0 2px 6px ${ratingColor}35`,
          }}
        >
          <i className="fa-solid fa-star text-[8px] opacity-80" />
          {problem.rating}
        </span>
      )}

      {/* Tags */}
      <div className="hidden md:flex flex-wrap gap-1.5 max-w-[350px]">
        {problem.tags.slice(0, 4).map((tag, idx) => {
          const { bg, text } = getTagColor(tag, isDark);
          return (
            <span
              key={`${tag}-${idx}`}
              className="px-2 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: bg, color: text }}
            >
              {tag}
            </span>
          );
        })}
        {problem.tags.length > 4 && (
          <span className="text-[10px] text-[var(--text-muted)] self-center">
            +{problem.tags.length - 4}
          </span>
        )}
      </div>

      {/* Solved count */}
      <div className="shrink-0 flex items-center gap-1.5 text-[var(--text-muted)]">
        <FaUser className="w-3 h-3" />
        <span className="text-xs font-medium">
          {(problem.solvedCount ?? 0).toLocaleString()}
        </span>
      </div>
    </a>
  );
};

export default ProblemCard;
