import { NextResponse } from "next/server";

import { getConnectionsHealth } from "@/lib/connections/health";
import { isDiagnosticsEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDiagnosticsEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const health = await getConnectionsHealth();

  return NextResponse.json(health);
}
