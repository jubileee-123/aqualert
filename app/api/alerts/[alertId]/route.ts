import { json, serverApi } from "../../_shared";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { alertId: string } }) {
  return json(await serverApi.getAlertById(params.alertId));
}
