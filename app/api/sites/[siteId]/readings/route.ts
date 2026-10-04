import type { NextRequest } from "next/server";
import { json, parseRange, serverApi } from "../../../_shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { siteId: string } }) {
  const range = parseRange(req.nextUrl.searchParams) ?? "24h";
  return json(await serverApi.getReadingsTimeSeries(params.siteId, range));
}
