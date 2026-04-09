import { NextResponse } from "next/server";

import { getConnectionsHealth } from "@/lib/connections/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getConnectionsHealth();

  return NextResponse.json(health);
}
