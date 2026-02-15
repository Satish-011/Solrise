export type ContestMap = Record<number, string>;

const LOCAL_KEY = "cf_contest_list_cache_v1";
const TTL = 1000 * 60 * 60 * 24; // 24h

async function fetchContestListFromAPI(): Promise<ContestMap> {
  // Route through server API for rate limiting and security
  const res = await fetch("/api/contests");
  if (!res.ok) throw new Error("Failed to fetch contest list");
  const data = await res.json();
  if (!data.contests || !Array.isArray(data.contests)) {
    throw new Error("Unexpected contest list response");
  }
  const map: ContestMap = {};
  for (const c of data.contests) {
    if (typeof c.id === "number" && typeof c.name === "string") {
      map[c.id] = c.name;
    }
  }
  return map;
}

export async function loadContestMap(
  forceRefresh = false,
): Promise<ContestMap> {
  try {
    if (!forceRefresh) {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { ts: number; map: ContestMap };
          // Security: Validate structure before trusting localStorage data
          if (
            parsed &&
            typeof parsed === "object" &&
            typeof parsed.ts === "number" &&
            parsed.map &&
            typeof parsed.map === "object" &&
            Date.now() - parsed.ts < TTL
          ) {
            return parsed.map;
          }
        } catch {
          // Corrupted cache — will refetch below
          try {
            localStorage.removeItem(LOCAL_KEY);
          } catch {}
        }
      }
    }
  } catch {
    // ignore localStorage access errors
  }

  const map = await fetchContestListFromAPI();
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ ts: Date.now(), map }));
  } catch {
    // ignore
  }
  return map;
}

export function parseDivisionFromContestName(
  name?: string | null,
): string | null {
  if (!name) return null;
  const divRegex = /\bDiv(?:ision|\.?)\s*\.?\s*(\d+)(?:\s*\+\s*(\d+))?/i;
  const divAlt = /\b(Div(?:\.)?\s*\d+(?:\+\d+)?)\b/i;
  const educational = /\bEducational\b/i;
  const global = /\bGlobal Round\b/i;
  const gym = /\bGym\b/i;

  const m = name.match(divRegex);
  if (m) {
    if (m[2]) return `Div.${m[1]}+${m[2]}`;
    return `Div.${m[1]}`;
  }
  const m2 = name.match(divAlt);
  if (m2) return m2[1];
  if (educational.test(name)) return "Educational";
  if (global.test(name)) return "Global";
  if (gym.test(name)) return "Gym";
  return null;
}

export async function getContestDivision(
  contestId: number | null | undefined,
): Promise<string | null> {
  if (!contestId && contestId !== 0) return null;
  try {
    const map = await loadContestMap();
    const name = map[contestId];
    if (!name) return null;
    return parseDivisionFromContestName(name);
  } catch {
    return null;
  }
}
