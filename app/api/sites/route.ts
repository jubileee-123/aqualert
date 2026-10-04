import { json, serverApi } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET() {
  return json(await serverApi.getSites());
}
