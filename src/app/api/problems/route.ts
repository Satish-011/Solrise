import { NextResponse } from "next/server";

const CF_BASE_URL = "https://codeforces.com/api";
const CF_TIMEOUT_MS = 15_000;

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CF_TIMEOUT_MS);

  try {
    const res = await fetch(`${CF_BASE_URL}/problemset.problems`, {
      signal: controller.signal,
      next: { revalidate: 3600 }, // cache for 1 hour
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

    return NextResponse.json(
      { result: data.result },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
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
