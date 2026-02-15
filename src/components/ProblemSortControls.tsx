import React from "react";

interface ProblemSortControlsProps {
  sortOption: "acceptance" | "new" | "old";
  onSortChange: (v: "acceptance" | "new" | "old") => void;
  hideSolved: boolean;
  onHideSolvedChange: (v: boolean) => void;
}

const SORT_OPTIONS = [
  { value: "new" as const, label: "Newest", icon: "fa-clock" },
  { value: "old" as const, label: "Oldest", icon: "fa-hourglass" },
  { value: "acceptance" as const, label: "Most Solved", icon: "fa-fire-flame-curved" },
];

const ProblemSortControls: React.FC<ProblemSortControlsProps> = ({
  sortOption,
  onSortChange,
  hideSolved,
  onHideSolvedChange,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
      <div className="flex items-center gap-2">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSortChange(opt.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              sortOption === opt.value
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <i className={`fa-solid ${opt.icon} text-[10px]`} />
            {opt.label}
          </button>
        ))}
      </div>

      <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
        <div className="relative">
          <input
            type="checkbox"
            checked={hideSolved}
            onChange={(e) => onHideSolvedChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 rounded-full bg-[var(--border-color)] peer-checked:bg-[var(--accent)] transition-colors" />
          <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
        </div>
        <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
          Hide Solved
        </span>
      </label>
    </div>
  );
};

export default ProblemSortControls;
