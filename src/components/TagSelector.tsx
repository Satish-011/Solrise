"use client";

import React, { useMemo } from "react";

interface TagSelectorProps {
  tags: string[];
  tagCounts?: Record<string, number>;
  selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  tags,
  tagCounts = {},
  selectedTags,
  onToggleTag,
  onClearAll,
}) => {
  const orderedTags = useMemo(() => {
    const copy = [...tags];
    copy.sort((a, b) => {
      const diff = (tagCounts[b] || 0) - (tagCounts[a] || 0);
      return diff !== 0 ? diff : a.localeCompare(b);
    });
    return copy;
  }, [tags, tagCounts]);

  const hasSelection = selectedTags.size > 0;

  return (
    <div className="space-y-2">
      {/* Selection info & clear button */}
      {hasSelection && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            <i className="fa-solid fa-filter text-[var(--accent)] mr-1.5" />
            {selectedTags.size} tag{selectedTags.size !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={onClearAll}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] font-medium transition-colors"
          >
            <i className="fa-solid fa-xmark mr-1" />
            Clear all
          </button>
        </div>
      )}

      {/* Tag chips */}
      <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm">
        {orderedTags.map((tag, idx) => {
          const count = tagCounts[tag] ?? 0;
          const isActive = selectedTags.has(tag);

          return (
            <button
              key={`${tag}-${idx}`}
              onClick={() => onToggleTag(tag)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm"
                  : "border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--accent)]/60 hover:text-[var(--text-primary)] hover:shadow-sm"
              }`}
            >
              <span className="capitalize">{tag}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition-colors duration-200 ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[var(--bg-primary)] text-[var(--text-muted)]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(TagSelector);
