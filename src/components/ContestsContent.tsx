"use client";

import React, { useEffect, useState } from "react";

interface Contest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds?: number;
  startTimeSeconds?: number;
}

const FILTER_OPTIONS = [
  { value: "all" as const, label: "All", icon: "fa-layer-group" },
  { value: "CF" as const, label: "CF", icon: "fa-code" },
  { value: "ICPC" as const, label: "ICPC", icon: "fa-users" },
];

const DIV_FILTERS = [
  { value: "all", label: "All Divs" },
  { value: "div12", label: "Div 1+2" },
  { value: "div1", label: "Div 1" },
  { value: "div2", label: "Div 2" },
  { value: "div3", label: "Div 3" },
  { value: "div4", label: "Div 4" },
  { value: "edu", label: "Educational" },
  { value: "global", label: "Global" },
  { value: "other", label: "Others" },
] as const;

type DivFilter = (typeof DIV_FILTERS)[number]["value"];

function matchesDivFilter(name: string, div: DivFilter): boolean {
  if (div === "all") return true;
  const n = name.toLowerCase();
  switch (div) {
    case "div12":
      return (
        (n.includes("div. 1") && n.includes("div. 2")) ||
        n.includes("div. 1 + div. 2") ||
        n.includes("div.1+div.2") ||
        /div\.?\s*1\s*\+\s*2/.test(n)
      );
    case "div1": {
      const hasDv1 = /div\.?\s*1(?!\s*\+)/.test(n);
      const hasDv2 = /div\.?\s*2/.test(n);
      return hasDv1 && !hasDv2;
    }
    case "div2": {
      const hasDv2 = /div\.?\s*2/.test(n);
      const hasDv1 = /div\.?\s*1/.test(n);
      return hasDv2 && !hasDv1;
    }
    case "div3":
      return /div\.?\s*3/.test(n);
    case "div4":
      return /div\.?\s*4/.test(n);
    case "edu":
      return n.includes("educational");
    case "global":
      return n.includes("global");
    case "other": {
      const isDivN = /div\.?\s*[1234]/.test(n);
      const isEdu = n.includes("educational");
      const isGlobal = n.includes("global");
      return !isDivN && !isEdu && !isGlobal;
    }
    default:
      return true;
  }
}

export default function ContestsContent() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "CF" | "ICPC">("all");
  const [divFilter, setDivFilter] = useState<DivFilter>("all");

  useEffect(() => {
    (async () => {
      try {
        const CACHE_KEY = "cf_finished_contests";
        const CACHE_TS_KEY = "cf_finished_contests_ts";
        const CACHE_TTL_MS = 60 * 60 * 1000;

        const stored = localStorage.getItem(CACHE_KEY);
        const storedTs = localStorage.getItem(CACHE_TS_KEY);
        const isFresh =
          storedTs && Date.now() - Number(storedTs) < CACHE_TTL_MS;

        if (stored && isFresh) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setContests(parsed);
              setLoading(false);
              return;
            }
          } catch {
            try {
              localStorage.removeItem(CACHE_KEY);
              localStorage.removeItem(CACHE_TS_KEY);
            } catch {}
          }
        }

        const res = await fetch("/api/contests");
        const data = await res.json();

        if (data.contests) {
          setContests(data.contests);
          localStorage.setItem(
            "cf_finished_contests",
            JSON.stringify(data.contests),
          );
          localStorage.setItem("cf_finished_contests_ts", String(Date.now()));
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = contests.filter((c) => {
    if (filter !== "all" && c.type !== filter) return false;
    if (!matchesDivFilter(c.name, divFilter)) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const formatDate = (ts?: number) => {
    if (!ts) return "\u2014";
    return new Date(ts * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (sec?: number) => {
    if (!sec) return "\u2014";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shadow-sm">
            <i className="fa-solid fa-trophy text-amber-500" />
          </div>
          Contests
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2 ml-[52px] sm:ml-[60px]">
          Browse {contests.length.toLocaleString()} finished contests
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs" />
          <input
            type="text"
            placeholder="Search contests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
          />
        </div>
        <div className="flex gap-1.5 order-2 sm:order-1">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                filter === f.value
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              <i className={`fa-solid ${f.icon} text-[10px]`} />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Division Filters */}
      <div className="flex flex-wrap gap-2 mb-5 animate-fade-in-up">
        {DIV_FILTERS.map((d) => (
          <button
            key={d.value}
            onClick={() => setDivFilter(d.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              divFilter === d.value
                ? "bg-[var(--accent)] text-white shadow-sm shadow-[var(--accent)]/20"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:scale-[1.03] active:scale-[0.97]"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 skeleton" />
          ))}
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {filtered.slice(0, 100).map((c) => (
            <a
              key={c.id}
              href={`https://codeforces.com/contest/${c.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card group flex items-center justify-between p-4 rounded-xl"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0 group-hover:bg-[var(--accent-bg)] transition-colors">
                  <i
                    className={`fa-solid ${c.type === "ICPC" ? "fa-users" : "fa-code"} text-xs text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors`}
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate block">
                    {c.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {formatDate(c.startTimeSeconds)}
                    </span>
                    <span className="w-0.5 h-0.5 rounded-full bg-[var(--border-color)]" />
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {formatDuration(c.durationSeconds)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-medium">
                      {c.type}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--accent)] shrink-0">
                #{c.id}
              </span>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
