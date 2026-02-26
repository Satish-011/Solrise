"use client";

import React, { useMemo, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  getColorForRating,
  getRatingName,
  getHandleParts,
} from "../utils/ratingColors";
import { useAppContext } from "@/context/AppContext";
import { getVisitStreak } from "@/utils/streakTracker";

const SuccessChart = dynamic(() => import("./SuccessChart"), {
  ssr: false,
  loading: () => <div className="w-28 h-28 skeleton rounded-full" />,
});

interface PersonalInfoProps {
  profileImage?: string;
  handle?: string;
  currentRating?: number | null;
  maxRating?: number | null;
  profileUrl?: string;
  isLoading?: boolean;
}

const PersonalInfo: React.FC<PersonalInfoProps> = ({
  profileImage,
  handle = "",
  currentRating = null,
  maxRating = null,
  isLoading = false,
}) => {
  const {
    problems,
    userSolvedSet,
    attemptedUnsolvedProblems,
    solvedCountInProblems,
    loadingProblems,
    fetchProblems,
  } = useAppContext();

  const visitStreak = useMemo(() => {
    if (typeof window === "undefined") return 0;
    return getVisitStreak().currentStreak;
  }, []);

  useEffect(() => {
    if (handle) fetchProblems();
  }, [handle, fetchProblems]);

  const ready = useMemo(
    () => !!(problems?.length && (userSolvedSet || attemptedUnsolvedProblems)),
    [problems, userSolvedSet, attemptedUnsolvedProblems],
  );

  const attemptedKeys = useMemo(
    () => new Set((attemptedUnsolvedProblems || []).map((a) => a.key)),
    [attemptedUnsolvedProblems],
  );

  const { totalSolved, totalAttemptedUnsolved, totalNotTried } = useMemo(() => {
    const attemptedCount = attemptedKeys.size;
    const totalProblems =
      problems?.filter((p) => p && p.contestId != null).length ?? 0;
    // Use solvedCountInProblems: intersects userSolvedSet with the actual problem list
    // (excludes gym/virtual/unrated rounds not in the problem set)
    const solvedCount = solvedCountInProblems;
    const notTried = Math.max(
      0,
      totalProblems - (solvedCount + attemptedCount),
    );
    return {
      totalSolved: solvedCount,
      totalAttemptedUnsolved: attemptedCount,
      totalNotTried: notTried,
    };
  }, [problems, solvedCountInProblems, attemptedKeys]);

  const color = useMemo(
    () => getColorForRating(currentRating ?? undefined),
    [currentRating],
  );
  const ratingName = useMemo(
    () => getRatingName(currentRating ?? undefined),
    [currentRating],
  );
  const handleParts = useMemo(
    () => getHandleParts(handle ?? "", currentRating ?? undefined),
    [handle, currentRating],
  );

  const displayRating =
    typeof currentRating === "number" ? String(currentRating) : "\u2014";
  const displayMax =
    typeof maxRating === "number" ? String(maxRating) : "\u2014";

  if (isLoading || (handle && (loadingProblems || !ready))) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="card px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-16 h-16 rounded-xl skeleton" />
            <div className="flex-1 space-y-2.5">
              <div className="h-6 w-44 skeleton" />
              <div className="h-4 w-28 skeleton" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 w-24 skeleton" />
                ))}
              </div>
            </div>
            <div className="w-32 h-32 skeleton rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      icon: "fa-trophy",
      label: "Current",
      value: displayRating,
      accent: "text-[var(--accent)]",
      bg: "bg-[var(--accent-bg)]",
    },
    {
      icon: "fa-crown",
      label: "Peak",
      value: displayMax,
      accent: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      icon: "fa-circle-check",
      label: "Solved",
      value: totalSolved.toLocaleString(),
      accent: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      icon: "fa-clock-rotate-left",
      label: "Attempted",
      value: totalAttemptedUnsolved.toLocaleString(),
      accent: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      icon: "fa-fire",
      label: "Streak",
      value: `${visitStreak}d`,
      accent: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-900/20",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 animate-fade-in-up">
      <div className="card px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-5">
          {/* Left: Avatar + Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 flex-1">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden border-2 shadow-md"
                style={{ borderColor: color }}
              >
                <Image
                  src={profileImage || "/default-avatar.png"}
                  alt={`${handle} avatar`}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  unoptimized={!profileImage?.includes("codeforces")}
                />
              </div>
              <div
                className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-md"
                style={{ backgroundColor: color }}
              >
                {ratingName}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-2.5 text-center sm:text-left">
              <div>
                <a
                  href={`https://codeforces.com/profile/${handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl font-bold hover:opacity-80 transition-opacity inline-flex items-center gap-2"
                >
                  {handleParts.map((p, i) => {
                    const isVar =
                      typeof p.color === "string" && p.color.startsWith("var(");
                    const style: React.CSSProperties = isVar
                      ? {}
                      : { color: p.color };
                    const cls =
                      p.color === "var(--lgm-first)" ? "lgm-first" : "";
                    return (
                      <span key={i} className={cls} style={style}>
                        {p.text}
                      </span>
                    );
                  })}
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs text-[var(--text-muted)]" />
                </a>
              </div>

              {/* Stat pills */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {statItems.map((stat) => (
                  <div
                    key={stat.label}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${stat.bg} border border-transparent hover:border-[var(--border-color)] transition-all shadow-sm`}
                  >
                    <i
                      className={`fa-solid ${stat.icon} ${stat.accent} text-sm`}
                    />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-medium leading-tight">
                        {stat.label}
                      </span>
                      <span className="text-[13px] font-bold text-[var(--text-primary)] leading-tight">
                        {stat.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Chart */}
          <div className="shrink-0">
            <SuccessChart
              totalSolved={totalSolved}
              totalAttemptedUnsolved={totalAttemptedUnsolved}
              totalNotTried={totalNotTried}
              size={140}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PersonalInfo);
