import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  console.info("[api/chat/toggle] sparkle button toggled", {
    pathname: typeof body.pathname === "string" ? body.pathname : "unknown",
    nextState: typeof body.nextState === "boolean" ? body.nextState : null,
    source: typeof body.source === "string" ? body.source : "site-header",
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
