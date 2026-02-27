"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Problem } from "@/types";

interface CFUserInfo {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  titlePhoto: string;
}

export interface AttemptInfo {
  key: string;
  contestId: number;
  index: string;
  name?: string;
  tags?: string[];
  attempts: number;
  lastVerdict?: string;
  lastTime?: number;
  link: string;
}

export type ActiveTab = "solrise" | "contests" | "topics" | "stats";

interface AppContextType {
  problems: Problem[];
  tagCounts: Record<string, number>;
  unsolvedProblems: Problem[];
  attemptedUnsolvedProblems: AttemptInfo[];
  handle: string | null;
  userInfo: CFUserInfo | null;
  userSolvedSet: Set<string>;
  loadingProblems: boolean;
  loadingUser: boolean;
  errorProblems: string | null;
  fetchProblems: () => Promise<void>;
  fetchAndMergeUserData: (handle: string) => Promise<void>;
  refreshUserSubmissions: (handle: string) => Promise<void>;
  refreshContestUserSubmissions: (
    contestId: number,
    handle: string,
  ) => Promise<void>;
  setHandleAndFetch: (handle: string) => Promise<void>;
  clearUser: () => void;
  solvedCountInProblems: number;
  attemptedCountInProblems: number;
  notTriedCount: number;
  solvingStreak: number;
  dailySolveCounts: Record<string, number>;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Helpers
const normalizeIndex = (idx: unknown) =>
  String(idx ?? "")
    .toUpperCase()
    .trim();
export const makeKey = (
  contestId: number | string | undefined,
  index: unknown,
) => `${String(contestId ?? "")}-${normalizeIndex(index)}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flattenProblemsResponse = (data: any) => {
  if (!data) return [];
  if (data.result && Array.isArray(data.result.problems))
    return data.result.problems;
  return [];
};

const computeTagCounts = (list: Problem[]) => {
  const map: Record<string, number> = {};
  for (const p of list)
    for (const t of p.tags || []) map[t] = (map[t] || 0) + 1;
  return map;
};

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [errorProblems, setErrorProblems] = useState<string | null>(null);

  const [handle, setHandle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("solrise");

  const [userInfo, setUserInfo] = useState<CFUserInfo | null>(null);
  const [userSolvedSet, setUserSolvedSet] = useState<Set<string>>(new Set());
  const [attemptedUnsolvedProblems, setAttemptedUnsolvedProblems] = useState<
    AttemptInfo[]
  >([]);
  const [solvingStreak, setSolvingStreak] = useState(0);
  const [dailySolveCounts, setDailySolveCounts] = useState<
    Record<string, number>
  >({});
  const [loadingUser, setLoadingUser] = useState(false);

  const fetchProblemsPromiseRef = useRef<Promise<void> | null>(null);
  const hasFetchedProblemsRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSubmissionsRef = useRef<any[]>([]);
  const hasFetchedForHandleRef = useRef<string | null>(null);

  // Fetch problem set with retry logic
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchProblems = useCallback(async () => {
    // Use a stable ref instead of reactive state to avoid stale-closure race
    if (hasFetchedProblemsRef.current) return;
    if (fetchProblemsPromiseRef.current) return fetchProblemsPromiseRef.current;

    const p = (async () => {
      setLoadingProblems(true);
      setErrorProblems(null); // Clear previous errors on retry
      try {
        const PROBLEMS_CACHE_KEY = "cf_all_problems";
        const PROBLEMS_CACHE_TS_KEY = "cf_all_problems_ts";
        const PROBLEMS_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

        const stored = localStorage.getItem(PROBLEMS_CACHE_KEY);
        const storedTs = localStorage.getItem(PROBLEMS_CACHE_TS_KEY);
        const isProblemsCacheFresh =
          storedTs && Date.now() - Number(storedTs) < PROBLEMS_CACHE_TTL_MS;

        if (stored && isProblemsCacheFresh) {
          try {
            const parsed = JSON.parse(stored);
            // Security: Validate that parsed data is a non-empty array
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProblems(parsed);
              setTagCounts(computeTagCounts(parsed));
              return;
            }
          } catch {
            // Corrupted cache — refetch from API
            try {
              localStorage.removeItem(PROBLEMS_CACHE_KEY);
              localStorage.removeItem(PROBLEMS_CACHE_TS_KEY);
            } catch {}
          }
        }

        // Retry up to 3 times with exponential backoff
        const MAX_RETRIES = 3;
        let lastError: Error | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            if (attempt > 0) {
              await new Promise((r) => setTimeout(r, 1000 * attempt));
            }
            const res = await fetch("/api/problems");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.json();
            lastError = null;
            break;
          } catch (err) {
            lastError =
              err instanceof Error ? err : new Error(String(err));
          }
        }

        if (lastError || !data) {
          throw lastError || new Error("Failed to fetch problems");
        }

        const allProblems = flattenProblemsResponse(data);

        const statsMap: Record<string, number> = {};
        if (data.result?.problemStatistics) {
          for (const stat of data.result.problemStatistics) {
            statsMap[makeKey(stat.contestId, stat.index)] = stat.solvedCount;
          }
        }

        const mergedProblems = allProblems.map((p: Problem) => ({
          ...p,
          solvedCount: statsMap[makeKey(p.contestId, p.index)] ?? 0,
        }));

        setProblems(mergedProblems);
        setTagCounts(computeTagCounts(mergedProblems));
        hasFetchedProblemsRef.current = true;
        try {
          localStorage.setItem(
            "cf_all_problems",
            JSON.stringify(mergedProblems),
          );
          localStorage.setItem("cf_all_problems_ts", String(Date.now()));
        } catch {
          // Ignore quota errors
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error(err);
        }
        setErrorProblems("Failed to fetch problems");
      } finally {
        setLoadingProblems(false);
        fetchProblemsPromiseRef.current = null; // Clear ref after state updates
      }
    })();

    fetchProblemsPromiseRef.current = p;
    await p;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processSubmissions = (subs: any[]) => {
    const newSolved = new Set<string>();
    const attempted: Record<string, AttemptInfo> = {};
    const dailyCounts: Record<string, number> = {};

    for (const s of subs) {
      const p = s.problem || {};
      const contestId = Number(p.contestId);
      const idx = normalizeIndex(p.index);
      const key = makeKey(contestId, idx);
      const submissionTime = s.creationTimeSeconds || 0;

      if (s.verdict === "OK") {
        newSolved.add(key);
        const d = new Date(submissionTime * 1000);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      }

      if (!attempted[key]) {
        const isGym = contestId >= 10000;
        attempted[key] = {
          key,
          contestId,
          index: idx,
          name: p.name,
          tags: p.tags || [],
          attempts: 0,
          lastVerdict: s.verdict,
          lastTime: submissionTime,
          link: isGym
            ? `https://codeforces.com/gym/${contestId}/problem/${idx}`
            : `https://codeforces.com/contest/${contestId}/problem/${idx}`,
        };
      }
      attempted[key].attempts++;
    }

    const attemptedUnsolved = Object.values(attempted).filter(
      (a) => !newSolved.has(a.key),
    );

    // Calculate solving streak
    const sortedDates = Object.keys(dailyCounts)
      .filter((date) => dailyCounts[date] > 0)
      .sort()
      .reverse();
    let streak = 0;
    if (sortedDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentDate = new Date(today);

      for (let i = 0; i < sortedDates.length; i++) {
        const solveDate = new Date(sortedDates[i]);
        solveDate.setHours(0, 0, 0, 0);

        const diffTime = currentDate.getTime() - solveDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0 || diffDays === 1) {
          streak++;
          currentDate = solveDate;
        } else {
          break;
        }
      }
    }
    setSolvingStreak(streak);
    setDailySolveCounts(dailyCounts);
    setUserSolvedSet(newSolved);
    setAttemptedUnsolvedProblems(attemptedUnsolved);
  };

  const fetchAndMergeUserData = async (h: string) => {
    setLoadingUser(true);
    try {
      // Security: URL-encode handle to prevent injection
      const response = await fetch(
        `/api/user-dashboard?handle=${encodeURIComponent(h)}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();

      // Validate that the user was actually found
      if (!data.userInfo) {
        throw new Error("User not found. Please check the handle.");
      }

      setUserInfo(data.userInfo);

      // Process submissions
      const subs = data.submissions || [];
      rawSubmissionsRef.current = subs;
      processSubmissions(subs);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error(err);
      }
      // Re-throw so callers can surface the error in UI
      throw err;
    } finally {
      setLoadingUser(false);
    }
  };

  const refreshUserSubmissions = async (h: string) => {
    if (!h) return;
    // Security: Validate handle before using in API call
    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(h.normalize("NFKC"))) return;

    try {
      // Route through server API for rate limiting and security
      const res = await fetch(
        `/api/submissions?handle=${encodeURIComponent(h)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.submissions) {
        const newSubs = data.submissions;
        const existingIds = new Set(
          rawSubmissionsRef.current.map(
            (s: Record<string, unknown>) => (s as { id: number }).id,
          ),
        );
        const uniqueNew = newSubs.filter(
          (s: Record<string, unknown>) =>
            !existingIds.has((s as { id: number }).id),
        );

        if (uniqueNew.length > 0) {
          const merged = [...uniqueNew, ...rawSubmissionsRef.current];
          rawSubmissionsRef.current = merged;
          processSubmissions(merged);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to refresh user submissions", err);
      }
    }
  };

  const refreshContestUserSubmissions = async (
    contestId: number,
    h: string,
  ) => {
    if (!h || !contestId) return;
    // Security: Validate handle and contestId before using in API call
    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(h.normalize("NFKC"))) return;
    if (!Number.isInteger(contestId) || contestId < 1 || contestId > 999999)
      return;

    try {
      // Route through server API for rate limiting and security
      const res = await fetch(
        `/api/submissions?handle=${encodeURIComponent(h)}&contestId=${contestId}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.submissions) {
        const newSubs = data.submissions;
        const existingIds = new Set(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rawSubmissionsRef.current.map((s: any) => s.id),
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniqueNew = newSubs.filter((s: any) => !existingIds.has(s.id));

        if (uniqueNew.length > 0) {
          const merged = [...uniqueNew, ...rawSubmissionsRef.current];
          rawSubmissionsRef.current = merged;
          processSubmissions(merged);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `Failed to refresh contest ${contestId} submissions`,
          err,
        );
      }
      throw err;
    }
  };

  const setHandleAndFetch = async (h: string) => {
    // Security: Validate handle before storing and fetching
    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(h.normalize("NFKC"))) return;
    setHandle(h);
    hasFetchedForHandleRef.current = h;
    try {
      localStorage.setItem("cf_user_handle_v1", h);
    } catch {
      // Ignore quota errors
    }
    if (problems.length === 0) await fetchProblems();
    try {
      await fetchAndMergeUserData(h);
    } catch (err) {
      // Clear persisted handle on failure so app doesn't retry on reload
      clearUser();
      throw err;
    }
  };

  const clearUser = () => {
    setHandle(null);
    setUserInfo(null);
    setUserSolvedSet(new Set());
    setAttemptedUnsolvedProblems([]);
    setSolvingStreak(0);
    setDailySolveCounts({});
    hasFetchedForHandleRef.current = null;
    hasFetchedProblemsRef.current = false;
    localStorage.removeItem("cf_user_handle_v1");
  };

  // Computed statistics
  const problemKeySet = useMemo(
    () => new Set(problems.map((p) => makeKey(p.contestId, p.index))),
    [problems],
  );

  const solvedCountInProblems = useMemo(() => {
    let c = 0;
    for (const k of problemKeySet) if (userSolvedSet.has(k)) c++;
    return c;
  }, [problemKeySet, userSolvedSet]);

  const attemptedCountInProblems = useMemo(() => {
    let c = 0;
    for (const a of attemptedUnsolvedProblems)
      if (problemKeySet.has(a.key)) c++;
    return c;
  }, [attemptedUnsolvedProblems, problemKeySet]);

  const notTriedCount = useMemo(
    () =>
      Math.max(
        0,
        problemKeySet.size - solvedCountInProblems - attemptedCountInProblems,
      ),
    [problemKeySet, solvedCountInProblems, attemptedCountInProblems],
  );

  // Side effects
  useEffect(() => {
    if (problems.length === 0) fetchProblems();
    // Hydration-safe: read persisted handle after mount
    try {
      const stored = localStorage.getItem("cf_user_handle_v1");
      if (
        stored &&
        !handle &&
        /^[a-zA-Z0-9_-]{3,24}$/.test(stored.normalize("NFKC"))
      ) {
        setHandle(stored);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!handle) return;
    if (hasFetchedForHandleRef.current === handle) return;
    if (problems.length > 0) {
      hasFetchedForHandleRef.current = handle;
      setHandleAndFetch(handle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, problems]);

    const contextValue = useMemo(
    () => ({
        problems,
        tagCounts,
        unsolvedProblems: [] as Problem[],
        attemptedUnsolvedProblems,
        handle,
        userInfo,
        userSolvedSet,
        loadingProblems,
        loadingUser,
        errorProblems,
        fetchProblems,
        fetchAndMergeUserData,
        refreshUserSubmissions,
        refreshContestUserSubmissions,
        setHandleAndFetch,
        clearUser,
        solvedCountInProblems,
        attemptedCountInProblems,
        notTriedCount,
        solvingStreak,
        dailySolveCounts,
        activeTab,
        setActiveTab,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      problems,
      tagCounts,
      attemptedUnsolvedProblems,
      handle,
      userInfo,
      userSolvedSet,
      loadingProblems,
      loadingUser,
      errorProblems,
      solvedCountInProblems,
      attemptedCountInProblems,
      notTriedCount,
      solvingStreak,
      dailySolveCounts,
      activeTab,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx)
    throw new Error("useAppContext must be used within AppContextProvider");
  return ctx;
};
