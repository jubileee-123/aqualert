import type { NextRequest } from "next/server";
import { json, parseRange, serverApi } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  return json(await serverApi.getAlertHistory(params.get("siteId") ?? undefined, parseRange(params)));
}
