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
  normalizeInputType,
  publicScan,
  readJsonBody,
  resolveSession,
} from "@/lib/scamshield/security";
import { getTerminal3Proof } from "@/lib/scamshield/terminal3";
import { listScans, saveScan, StorageUnavailableError } from "@/lib/scamshield/storage";
import type { ScanRequest } from "@/lib/scamshield/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_CONTENT_LENGTH = 20_000;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const session = resolveSession(request);
  const rate = checkRateLimit(`read:${clientAddress(request)}:${session.sessionId}`, 120, 60_000);
  if (!rate.allowed) return attachSessionCookie(jsonError("Too many requests. Try again shortly.", 429), session);

  try {
    const scans = await listScans(session.sessionId);
    return attachSessionCookie(NextResponse.json({ scans: scans.map(publicScan) }), session);
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return attachSessionCookie(jsonError(error.message, 503), session);
    }
    return attachSessionCookie(jsonError("Unable to load scans.", 500), session);
  }
}

export async function POST(request: NextRequest) {
  const session = resolveSession(request);
  const rate = checkRateLimit(`scan:${clientAddress(request)}:${session.sessionId}`, 20, 5 * 60_000);
  if (!rate.allowed) return attachSessionCookie(jsonError("Scan limit reached. Try again in a few minutes.", 429), session);

  try {
    const body = await readJsonBody<Partial<ScanRequest>>(request, MAX_BODY_BYTES);
    const content = boundedText(body.content, MAX_CONTENT_LENGTH);
    const inputType = normalizeInputType(body.inputType);
    const fileNames = body.fileNames?.slice(0, 8).map((fileName) => boundedText(fileName, 180));

    if (!content && !fileNames?.length) {
      throw new ApiRequestError("Provide text, a link, QR payload, email content, or uploaded file metadata.", 400);
    }

    const terminal3 = auditTerminal3Proof(await getTerminal3Proof());
    const scan = attachAudit(runScamAnalysis({
      inputType,
      content,
      fileNames,
      source: "scan",
    }, terminal3));

    await saveScan(scan, session.sessionId);
    return attachSessionCookie(NextResponse.json({ scan: publicScan(scan) }), session);
  } catch (error) {
    if (error instanceof ApiRequestError) return attachSessionCookie(jsonError(error.message, error.status), session);
    if (error instanceof StorageUnavailableError) return attachSessionCookie(jsonError(error.message, 503), session);
    return attachSessionCookie(jsonError("Scan failed.", 500), session);
  }
}
