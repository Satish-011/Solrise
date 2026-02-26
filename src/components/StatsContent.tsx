"use client";

import React, { useMemo, useState, useEffect, useRef, memo } from "react";
import dynamic from "next/dynamic";
import { useAppContext } from "@/context/AppContext";

const RatingBarChart = dynamic(() => import("@/components/RatingBarChart"), {
  ssr: false,
  loading: () => <div className="h-52 skeleton rounded-2xl" />,
});

const ContributionHeatmap = dynamic(
  () => import("@/components/ContributionHeatmap"),
  {
    ssr: false,
    loading: () => <div className="h-40 skeleton rounded-2xl" />,
  },
);

/* ── Batched count-up hook — single rAF loop for all values ── */
interface CountUpTargets {
  total: number;
  solved: number;
  avg: number;
  hardest: number;
  streak: number;
}

const COUNTUP_DURATION = 1200;
const STREAK_DURATION = 800;

function useCountUpBatch(targets: CountUpTargets) {
  const [values, setValues] = useState<CountUpTargets>({
    total: 0,
    solved: 0,
    avg: 0,
    hardest: 0,
    streak: 0,
  });
  const currentRef = useRef<CountUpTargets>({
    total: 0,
    solved: 0,
    avg: 0,
    hardest: 0,
    streak: 0,
  });
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const targetsRef = useRef(targets);

  useEffect(() => {
    targetsRef.current = targets;
  });

  useEffect(() => {
    const t = targetsRef.current;
    const allZero =
      t.total === 0 &&
      t.solved === 0 &&
      t.avg === 0 &&
      t.hardest === 0 &&
      t.streak === 0;

    if (allZero) {
      const zero = { total: 0, solved: 0, avg: 0, hardest: 0, streak: 0 };
      currentRef.current = zero;
      rafRef.current = requestAnimationFrame(() => setValues(zero));
      return () => cancelAnimationFrame(rafRef.current);
    }

    startRef.current = null;

    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;

      const ease = (dur: number) => {
        const p = Math.min(elapsed / dur, 1);
        return 1 - Math.pow(1 - p, 3);
      };

      const mainEased = ease(COUNTUP_DURATION);
      const streakEased = ease(STREAK_DURATION);

      const next: CountUpTargets = {
        total: Math.round(mainEased * t.total),
        solved: Math.round(mainEased * t.solved),
        avg: Math.round(mainEased * t.avg),
        hardest: Math.round(mainEased * t.hardest),
        streak: Math.round(streakEased * t.streak),
      };

      const cur = currentRef.current;
      if (
        next.total !== cur.total ||
        next.solved !== cur.solved ||
        next.avg !== cur.avg ||
        next.hardest !== cur.hardest ||
        next.streak !== cur.streak
      ) {
        currentRef.current = next;
        setValues(next);
      }

      const maxDone = Math.max(
        elapsed / COUNTUP_DURATION,
        elapsed / STREAK_DURATION,
      );
      if (maxDone < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [
    targets.total,
    targets.solved,
    targets.avg,
    targets.hardest,
    targets.streak,
  ]);

  return values;
}

/* ── Rank → color mapping (module-level, no re-creation) ── */
const RANK_COLORS: [string, string][] = [
  ["legendary", "text-red-400"],
  ["international grandmaster", "text-red-400"],
  ["grandmaster", "text-red-500"],
  ["international master", "text-orange-400"],
  ["master", "text-orange-500"],
  ["candidate", "text-violet-400"],
  ["expert", "text-blue-400"],
  ["specialist", "text-cyan-400"],
  ["pupil", "text-green-400"],
  ["newbie", "text-gray-400"],
];

function getRankColor(rank?: string): string {
  if (!rank) return "text-[var(--text-muted)]";
  const r = rank.toLowerCase();
  for (const [key, color] of RANK_COLORS) {
    if (r.includes(key)) return color;
  }
  return "text-[var(--text-muted)]";
}

/* ── Memoized sub-components to prevent re-renders ── */
interface StatCardData {
  label: string;
  value: number | string;
  icon: string;
  description: string;
  color: string;
  isText?: boolean;
}

const StatCard = memo(function StatCard({ stat }: { stat: StatCardData }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl glass-card">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-xl`}
          >
            <i className={`fa-solid ${stat.icon} text-white text-sm`} />
          </div>
          <div className="text-right">
            <div className="stat-number-animate">
              {stat.isText ? (
                <span className="text-base font-semibold capitalize text-[var(--text-primary)]">
                  {stat.value || "—"}
                </span>
              ) : (
                <span className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  {(stat.value as number)?.toLocaleString() || "0"}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {stat.description}
            </div>
          </div>
        </div>
        <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          {stat.label}
        </div>
      </div>
      <div
        className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.color} opacity-40 group-hover:opacity-70 transition-opacity duration-300`}
      />
    </div>
  );
});

export default function StatsContent() {
  const {
    handle,
    userInfo,
    problems,
    solvedCountInProblems,
    solvingStreak,
    dailySolveCounts,
    userSolvedSet,
    loadingUser,
  } = useAppContext();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Enhanced statistics calculations
  const enhancedStats = useMemo(() => {
    if (!userSolvedSet.size || !problems.length) {
      return {
        averageRating: 0,
        hardestSolved: 0,
        mostActiveTag: "",
        highestRatingAttempted: 0,
        completionRate: 0,
      };
    }

    const solvedProblems = problems.filter((p) =>
      userSolvedSet.has(`${p.contestId}-${p.index}`),
    );

    const ratedSolved = solvedProblems.filter((p) => p.rating);
    const averageRating = ratedSolved.length
      ? Math.round(
          ratedSolved.reduce((sum, p) => sum + (p.rating || 0), 0) /
            ratedSolved.length,
        )
      : 0;

    const hardestSolved = Math.max(...solvedProblems.map((p) => p.rating || 0));

    const solvedTagCounts: Record<string, number> = {};
    solvedProblems.forEach((p) => {
      p.tags.forEach((tag) => {
        solvedTagCounts[tag] = (solvedTagCounts[tag] || 0) + 1;
      });
    });
    const mostActiveTag =
      Object.entries(solvedTagCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "";

    const highestRatingAttempted = Math.max(
      ...problems.map((p) => p.rating || 0),
    );

    const completionRate = Math.round(
      (solvedCountInProblems / problems.length) * 100,
    );

    return {
      averageRating,
      hardestSolved,
      mostActiveTag,
      highestRatingAttempted,
      completionRate,
    };
  }, [problems, userSolvedSet, solvedCountInProblems]);

  const ratingBuckets = useMemo(() => {
    if (!userSolvedSet.size || !problems.length) return [];

    const counts: Record<number, number> = {};
    for (const p of problems) {
      if (!p.rating || !userSolvedSet.has(`${p.contestId}-${p.index}`))
        continue;
      const bucket = Math.floor(p.rating / 100) * 100;
      counts[bucket] = (counts[bucket] || 0) + 1;
    }

    const ratings = Object.keys(counts)
      .map(Number)
      .sort((a, b) => a - b);
    if (ratings.length === 0) return [];

    const min = ratings[0];
    const max = ratings[ratings.length - 1];
    const result: { rating: number; count: number }[] = [];
    for (let r = min; r <= max; r += 100) {
      result.push({ rating: r, count: counts[r] || 0 });
    }
    return result;
  }, [problems, userSolvedSet]);

  const countUpTargets = useMemo<CountUpTargets>(() => {
    if (!mounted || loadingUser || !handle) {
      return { total: 0, solved: 0, avg: 0, hardest: 0, streak: 0 };
    }
    return {
      total: problems.length,
      solved: solvedCountInProblems,
      avg: enhancedStats.averageRating,
      hardest: enhancedStats.hardestSolved,
      streak: solvingStreak,
    };
  }, [
    mounted,
    loadingUser,
    handle,
    problems.length,
    solvedCountInProblems,
    enhancedStats.averageRating,
    enhancedStats.hardestSolved,
    solvingStreak,
  ]);

  const anim = useCountUpBatch(countUpTargets);

  const heroStats = useMemo<StatCardData[]>(
    () => [
      {
        label: "Total Problems",
        value: anim.total,
        icon: "fa-layer-group",
        description: "Available problems",
        color: "from-blue-500/80 to-cyan-500/80",
      },
      {
        label: "Problems Solved",
        value: anim.solved,
        icon: "fa-circle-check",
        description: `${enhancedStats.completionRate}% completed`,
        color: "from-emerald-500/80 to-teal-500/80",
      },
      {
        label: "Average Rating",
        value: anim.avg,
        icon: "fa-star",
        description: "Solved problems",
        color: "from-amber-500/80 to-orange-500/80",
      },
      {
        label: "Hardest Solved",
        value: anim.hardest,
        icon: "fa-trophy",
        description: "Peak difficulty",
        color: "from-amber-500/80 to-yellow-500/80",
      },
      {
        label: "Most Active Tag",
        value: enhancedStats.mostActiveTag,
        icon: "fa-tags",
        description: "Primary focus",
        color: "from-amber-500/80 to-orange-500/80",
        isText: true,
      },
      {
        label: "Solving Streak",
        value: anim.streak,
        icon: "fa-fire",
        description: "Current streak",
        color: "from-rose-500/80 to-red-500/80",
      },
    ],
    [
      anim.total,
      anim.solved,
      anim.avg,
      anim.hardest,
      anim.streak,
      enhancedStats.completionRate,
      enhancedStats.mostActiveTag,
    ],
  );

  if (!mounted || loadingUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="h-10 w-80 skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 skeleton" />
          <div className="h-80 skeleton" />
        </div>
      </div>
    );
  }

  if (!handle) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-6 animate-fade-in-up">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/25">
            <i className="fa-solid fa-chart-line text-4xl text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">View Your Analytics</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-sm">
              Enter your Codeforces handle in the navbar to unlock detailed
              statistics and progress insights.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Header with Profile Card */}
      <div className="mb-10 animate-fade-in-up hero-glow">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left: Title */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/20">
              <i className="fa-solid fa-chart-line text-xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--text-primary)] via-amber-400 to-orange-400 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Performance insights for{" "}
                <span className="font-semibold text-[var(--accent)]">
                  {handle}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Profile Card */}
          {userInfo && (
            <div className="rounded-2xl glass-card p-4 sm:p-5 lg:min-w-[340px] shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/80 to-orange-500/80 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-user text-white text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {userInfo.handle}
                    </span>
                    {userInfo.rank && (
                      <span
                        className={`rating-badge ${getRankColor(userInfo.rank)} shrink-0`}
                      >
                        <i className="fa-solid fa-shield-halved text-[9px]" />
                        {userInfo.rank}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <span>
                      Rating{" "}
                      <span className="font-semibold text-[var(--accent)]">
                        {userInfo.rating ?? "—"}
                      </span>
                    </span>
                    <span className="opacity-30">|</span>
                    <span>
                      Max{" "}
                      <span className="font-semibold text-[var(--text-primary)]">
                        {userInfo.maxRating ?? "—"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hero Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 stagger-children">
        {heroStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Rating Distribution Bar Chart */}
      <div className="mb-5">
        <div className="rounded-2xl glass-card p-6 sm:p-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/80 to-orange-500/80 flex items-center justify-center">
              <i className="fa-solid fa-chart-bar text-white text-sm" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Rating Distribution
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Problems solved by difficulty rating
              </p>
            </div>
          </div>
          <RatingBarChart buckets={ratingBuckets} />
        </div>
      </div>

      {/* Contribution Heatmap */}
      <ContributionHeatmap dailySolveCounts={dailySolveCounts} />
    </main>
  );
}
