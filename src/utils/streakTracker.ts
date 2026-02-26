interface StreakData {
  lastVisit: string;
  currentStreak: number;
  longestStreak: number;
}

const STREAK_KEY = "solrise-visit-streak";

export const updateVisitStreak = (): StreakData => {
  if (typeof window === "undefined") {
    return { lastVisit: "", currentStreak: 0, longestStreak: 0 };
  }

  const _now = new Date();
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;

  const stored = localStorage.getItem(STREAK_KEY);
  let streakData: StreakData = {
    lastVisit: "",
    currentStreak: 0,
    longestStreak: 0,
  };
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Security: Validate schema before trusting localStorage data
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.lastVisit === "string" &&
        typeof parsed.currentStreak === "number" &&
        typeof parsed.longestStreak === "number" &&
        !parsed.__proto__ // prevent prototype pollution
      ) {
        streakData = {
          lastVisit: String(parsed.lastVisit).slice(0, 10),
          currentStreak: Math.max(0, Math.floor(parsed.currentStreak)),
          longestStreak: Math.max(0, Math.floor(parsed.longestStreak)),
        };
      }
    } catch {
      // Corrupted data — use defaults
    }
  }

  if (!streakData.lastVisit) {
    streakData = {
      lastVisit: today,
      currentStreak: 1,
      longestStreak: 1,
    };
  } else if (streakData.lastVisit === today) {
    return streakData;
  } else {
    const lastDate = new Date(streakData.lastVisit);
    const currentDate = new Date(today);
    const diffTime = currentDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streakData.currentStreak += 1;
      streakData.longestStreak = Math.max(
        streakData.longestStreak,
        streakData.currentStreak,
      );
    } else if (diffDays > 1) {
      streakData.currentStreak = 1;
    }

    streakData.lastVisit = today;
  }

  localStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
  return streakData;
};

export const getVisitStreak = (): StreakData => {
  if (typeof window === "undefined") {
    return { lastVisit: "", currentStreak: 0, longestStreak: 0 };
  }

  const stored = localStorage.getItem(STREAK_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.lastVisit === "string" &&
        typeof parsed.currentStreak === "number" &&
        typeof parsed.longestStreak === "number"
      ) {
        return {
          lastVisit: String(parsed.lastVisit).slice(0, 10),
          currentStreak: Math.max(0, Math.floor(parsed.currentStreak)),
          longestStreak: Math.max(0, Math.floor(parsed.longestStreak)),
        };
      }
    } catch {
      // Corrupted data — use defaults
    }
  }
  return { lastVisit: "", currentStreak: 0, longestStreak: 0 };
};

export const resetVisitStreak = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(STREAK_KEY);
};
