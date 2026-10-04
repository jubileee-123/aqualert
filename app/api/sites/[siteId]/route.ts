import { json, serverApi } from "../../_shared";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { siteId: string } }) {
  return json(await serverApi.getSite(params.siteId));
}
