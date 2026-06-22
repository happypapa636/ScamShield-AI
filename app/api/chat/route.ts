import { NextRequest, NextResponse } from "next/server";
import { attachAudit } from "@/lib/scamshield/audit";
import { runScamAnalysis } from "@/lib/scamshield/analyzer";
import {
  ApiRequestError,
  attachSessionCookie,
  auditTerminal3Proof,
  boundedText,
  checkRateLimit,
  clientAddress,
  publicScan,
  readJsonBody,
  resolveSession,
} from "@/lib/scamshield/security";
import { getTerminal3Proof } from "@/lib/scamshield/terminal3";
import { saveScan, StorageUnavailableError } from "@/lib/scamshield/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_CONTEXT_LENGTH = 8_000;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const session = resolveSession(request);
  const rate = checkRateLimit(`chat:${clientAddress(request)}:${session.sessionId}`, 30, 5 * 60_000);
  if (!rate.allowed) return attachSessionCookie(jsonError("Chat limit reached. Try again in a few minutes.", 429), session);

  try {
    const body = await readJsonBody<{ message?: string; context?: string }>(request, MAX_BODY_BYTES);
    const message = boundedText(body.message, MAX_MESSAGE_LENGTH);
    const context = boundedText(body.context, MAX_CONTEXT_LENGTH);

    if (!message) {
      throw new ApiRequestError("Ask a safety question first.", 400);
    }

    const terminal3 = auditTerminal3Proof(await getTerminal3Proof());
    const scan = attachAudit(runScamAnalysis({
      inputType: "chat",
      content: `${message}\n${context}`.trim(),
      source: "chat",
    }, terminal3));

    await saveScan(scan, session.sessionId);

    const answer = [
      scan.summary,
      scan.detectedSignals[0] ? `Main signal: ${scan.detectedSignals[0]}` : "",
      `Recommendation: ${scan.recommendation}`,
    ].filter(Boolean).join("\n\n");

    return attachSessionCookie(NextResponse.json({ answer, scan: publicScan(scan) }), session);
  } catch (error) {
    if (error instanceof ApiRequestError) return attachSessionCookie(jsonError(error.message, error.status), session);
    if (error instanceof StorageUnavailableError) return attachSessionCookie(jsonError(error.message, 503), session);
    return attachSessionCookie(jsonError("Chat failed.", 500), session);
  }
}
