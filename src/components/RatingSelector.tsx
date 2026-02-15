import React from "react";
import { cfRatingColors } from "../utils/cfRatingColors";

interface RatingSelectorProps {
  selectedRating: number;
  onSelect: (rating: number) => void;
}

const RatingSelector: React.FC<RatingSelectorProps> = ({
  selectedRating,
  onSelect,
}) => {
  const ratings = Array.from({ length: 28 }, (_, i) => 800 + i * 100);

  return (
    <div className="flex flex-wrap gap-1.5 p-1">
      {ratings.map((r) => {
        const isSelected = selectedRating === r;
        const ratingColor = cfRatingColors[r] || "#6366f1";

        return (
          <button
            key={r}
            onClick={() => onSelect(r)}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${
              isSelected
                ? "text-white shadow-sm scale-105 border-transparent"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] hover:scale-[1.02]"
            }`}
            style={
              isSelected
                ? {
                    backgroundColor: ratingColor,
                    boxShadow: `0 2px 8px ${ratingColor}35`,
                  }
                : undefined
            }
          >
            {r}
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(RatingSelector);
