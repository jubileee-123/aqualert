import { NextResponse } from "next/server";
import { createMockApi } from "@/lib/api/mock-api";
import { isTimeRange } from "@/lib/time";
import type { TimeRangeInput } from "@/types";

/**
 * Server-side mock backend. These route handlers expose the mock data over
 * HTTP with the same contract the real AquaLert backend will implement.
 */
export const serverApi = createMockApi({ latencyMs: 0 });

export function parseRange(params: URLSearchParams): TimeRangeInput | undefined {
  const range = params.get("range");
  if (range && isTimeRange(range)) return range;
  const from = params.get("from");
  const to = params.get("to");
  if (from && to) return { fromUtc: from, toUtc: to };
  return undefined;
}

export function json<T>(data: T | null) {
  if (data === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
