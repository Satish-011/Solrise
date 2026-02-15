import { NextResponse } from "next/server";

const CF_BASE_URL = "https://codeforces.com/api";
const CF_TIMEOUT_MS = 10_000;

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CF_TIMEOUT_MS);

    const res = await fetch(`${CF_BASE_URL}/contest.list`, {
      signal: controller.signal,
      next: { revalidate: 300 }, // cache for 5 minutes
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Codeforces API returned ${res.status}`);
    }

    const data = await res.json();

    if (data.status !== "OK") {
      throw new Error("Invalid API response");
    }

    const upcoming = (data.result as Array<Record<string, unknown>>)
      .filter((c) => c.phase === "BEFORE")
      .sort(
        (a, b) =>
          ((a.startTimeSeconds as number) ?? 0) -
          ((b.startTimeSeconds as number) ?? 0),
      );

    const contest = upcoming.length > 0 ? upcoming[0] : null;

    return NextResponse.json(
      { contest },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
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
