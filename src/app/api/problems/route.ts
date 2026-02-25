import { NextRequest, NextResponse } from "next/server";
import { apiRateLimiter, getClientIp } from "@/utils/security";

const CF_BASE_URL = "https://codeforces.com/api";
const CF_TIMEOUT_MS = 15_000;

// In-memory cache — survives across requests in the same warm serverless instance
let cachedData: { result: unknown; timestamp: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const responseHeaders = {
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(request: NextRequest) {
  // Rate limit check
  const ip = getClientIp(request);
  if (!(await apiRateLimiter.check(ip))) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  // Return cached data if still fresh
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { result: cachedData.result },
      { headers: responseHeaders },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CF_TIMEOUT_MS);

  try {
    const res = await fetch(`${CF_BASE_URL}/problemset.problems`, {
      signal: controller.signal,
      next: { revalidate: 3600 }, // Next.js fetch cache for 1 hour
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Codeforces API returned ${res.status}`);
    }

    const data = await res.json();

    if (
      data.status !== "OK" ||
      !data.result?.problems ||
      !Array.isArray(data.result.problems)
    ) {
      throw new Error("Invalid API response");
    }

    // Update in-memory cache on success
    cachedData = { result: data.result, timestamp: Date.now() };

    return NextResponse.json(
      { result: data.result },
      { headers: responseHeaders },
    );
  } catch (error) {
    clearTimeout(timeout);

    // On failure, return stale cache if available (better than error)
    if (cachedData) {
      return NextResponse.json(
        { result: cachedData.result },
        { headers: responseHeaders },
      );
    }

    const isTimeout =
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError");

    if (isTimeout) {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
