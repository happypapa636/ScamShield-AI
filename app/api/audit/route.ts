import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, checkRateLimit, clientAddress, publicAuditEntry, resolveSession } from "@/lib/scamshield/security";
import { listAudit, StorageUnavailableError } from "@/lib/scamshield/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const session = resolveSession(request);
  const rate = checkRateLimit(`audit:${clientAddress(request)}:${session.sessionId}`, 120, 60_000);
  if (!rate.allowed) return attachSessionCookie(jsonError("Too many requests. Try again shortly.", 429), session);

  try {
    const audit = await listAudit(session.sessionId);
    return attachSessionCookie(NextResponse.json({ audit: audit.map(publicAuditEntry) }), session);
  } catch (error) {
    if (error instanceof StorageUnavailableError) return attachSessionCookie(jsonError(error.message, 503), session);
    return attachSessionCookie(jsonError("Unable to load audit logs.", 500), session);
  }
}
