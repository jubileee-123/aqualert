/** Runtime configuration read from NEXT_PUBLIC_* environment variables. */
export const API_MODE: "mock" | "http" =
  process.env.NEXT_PUBLIC_API_MODE === "http" ? "http" : "mock";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

/** How often live queries refetch in the background. */
export const LIVE_REFETCH_MS = 30_000;
/** How long fetched data is considered fresh. */
export const STALE_TIME_MS = 15_000;
