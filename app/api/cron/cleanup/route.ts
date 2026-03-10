import { NextRequest, NextResponse } from "next/server";
import { cleanupPastTicketKeys } from "@/lib/kv";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const result = await cleanupPastTicketKeys();

  return NextResponse.json({
    ok: true,
    ...result
  });
}
