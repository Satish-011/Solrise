import { NextRequest, NextResponse } from "next/server";

const CF_BASE_URL = "https://codeforces.com/api";
const CF_TIMEOUT_MS = 15_000;

const HANDLE_RE = /^[a-zA-Z0-9_-]{3,24}$/;

async function cfFetch(path: string, signal: AbortSignal) {
  const res = await fetch(`${CF_BASE_URL}${path}`, { signal });
  if (!res.ok) throw new Error(`Codeforces API returned ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK") throw new Error("Invalid API response");
  return data.result;
}

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle")?.trim();

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

    // Fetch user info and submissions in parallel
    const [userResult, submissions] = await Promise.all([
      cfFetch(`/user.info?handles=${encoded}`, controller.signal),
      cfFetch(
        `/user.status?handle=${encoded}&from=1&count=10000`,
        controller.signal,
      ),
    ]);

    clearTimeout(timeout);

    const userInfo = userResult?.[0] ?? null;

    return NextResponse.json(
      { userInfo, submissions },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
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
