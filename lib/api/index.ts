import { API_BASE_URL, API_MODE } from "@/lib/constants/config";
import { createHttpApi } from "./http-api";
import { createMockApi } from "./mock-api";
import type { AquaLertApi } from "./types";

export type { AquaLertApi } from "./types";
export { ApiError } from "./types";

/**
 * The single data source used by the app.
 *  - "mock" (default): in-memory simulated network, no backend needed.
 *  - "http": REST calls to NEXT_PUBLIC_API_BASE_URL.
 */
export const api: AquaLertApi = API_MODE === "http" ? createHttpApi(API_BASE_URL) : createMockApi();
