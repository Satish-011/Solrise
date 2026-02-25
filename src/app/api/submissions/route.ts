import { NextRequest, NextResponse } from "next/server";
import { apiRateLimiter, getClientIp } from "@/utils/security";

const CF_BASE_URL = "https://codeforces.com/api";
const CF_TIMEOUT_MS = 15_000;

const HANDLE_RE = /^[a-zA-Z0-9_-]{3,24}$/;

export async function GET(request: NextRequest) {
  // Rate limit check
  const ip = getClientIp(request);
  if (!(await apiRateLimiter.check(ip))) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const handle = request.nextUrl.searchParams.get("handle")?.trim();
  const contestId = request.nextUrl.searchParams.get("contestId");

  if (!handle || !HANDLE_RE.test(handle.normalize("NFKC"))) {
    return NextResponse.json(
      { error: "Invalid or missing handle" },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CF_TIMEOUT_MS);

  try {
    const encoded = encodeURIComponent(handle);
    let url: string;

    if (contestId) {
      const cid = Number(contestId);
      if (!Number.isInteger(cid) || cid < 1 || cid > 999999) {
        clearTimeout(timeout);
        return NextResponse.json(
          { error: "Invalid contestId" },
          { status: 400 },
        );
      }
      url = `${CF_BASE_URL}/contest.status?contestId=${cid}&handle=${encoded}&from=1&count=100`;
    } else {
      url = `${CF_BASE_URL}/user.status?handle=${encoded}&from=1&count=10000`;
    }

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Codeforces API returned ${res.status}`);
    }

    const data = await res.json();

    if (data.status !== "OK") {
      throw new Error("Invalid API response");
    }

    return NextResponse.json(
      { submissions: data.result },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    clearTimeout(timeout);

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
