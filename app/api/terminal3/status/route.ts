import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, checkRateLimit, clientAddress, publicTerminal3Proof, resolveSession } from "@/lib/scamshield/security";
import { getTerminal3Proof } from "@/lib/scamshield/terminal3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = resolveSession(request);
  const rate = checkRateLimit(`t3n:${clientAddress(request)}:${session.sessionId}`, 20, 60_000);
  if (!rate.allowed) {
    return attachSessionCookie(NextResponse.json({ error: "Too many status checks. Try again shortly." }, { status: 429 }), session);
  }

  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  const proof = await getTerminal3Proof(refresh);
  return attachSessionCookie(NextResponse.json({ proof: publicTerminal3Proof(proof) }), session);
}
