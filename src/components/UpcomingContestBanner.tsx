"use client";

import React, { useState, useEffect, useCallback } from "react";

interface Contest {
  id: number;
  name: string;
  phase: string;
  startTimeSeconds: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const UpcomingContestBanner: React.FC = () => {
  const [upcomingContest, setUpcomingContest] = useState<Contest | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch upcoming contest from optimized API route
  useEffect(() => {
    const fetchUpcomingContest = async () => {
      try {
        const response = await fetch("/api/upcoming-contest");

        if (!response.ok) {
          throw new Error("Failed to fetch contest");
        }

        const data = await response.json();

        if (data.contest) {
          setUpcomingContest(data.contest);
        }
      } catch (error) {
        // Silently handle errors in production
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to fetch upcoming contest:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingContest();
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!upcomingContest) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = upcomingContest.startTimeSeconds - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [upcomingContest]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="sticky top-[64px] z-40 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-pulse" />
              <div className="h-4 w-32 skeleton" />
            </div>
            <div className="h-4 w-24 skeleton" />
            <div className="h-6 w-16 skeleton" />
          </div>
        </div>
      </div>
    );
  }

  // Hide banner if: no contest, no time left, or dismissed
  if (!upcomingContest || !timeLeft || isDismissed) {
    return null;
  }

  return (
    <div className="sticky top-[64px] z-40 animate-fade-in bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-2">
          {/* Left: Live Indicator + Contest Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Live Pulse Animation */}
            <div className="relative flex items-center justify-center shrink-0">
              <span className="absolute inline-flex h-3 w-3 rounded-full bg-amber-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </div>

            {/* Contest Name */}
            <span className="text-sm text-[var(--text-muted)] shrink-0 hidden sm:inline">
              Upcoming:
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {upcomingContest.name}
            </span>
          </div>

          {/* Center: Countdown Timer (Monospace to prevent jitter) */}
          <div className="flex items-center gap-1 font-mono text-sm text-[var(--text-primary)] shrink-0 tabular-nums">
            {timeLeft.days > 0 && (
              <span>{String(timeLeft.days).padStart(2, "0")}d</span>
            )}
            <span>{String(timeLeft.hours).padStart(2, "0")}h</span>
            <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>
            <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
          </div>

          {/* Right: Register Button + Dismiss */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://codeforces.com/contests"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              Register
            </a>
            <button
              onClick={handleDismiss}
              className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              title="Dismiss"
              aria-label="Dismiss notification"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(UpcomingContestBanner);
