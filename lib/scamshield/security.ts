import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { AuditEntry, ScanInputType, ScanResult, Terminal3Proof } from "./types";

export const SESSION_COOKIE = "scamshield_sid";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const VALID_SESSION = /^[a-zA-Z0-9_-]{24,80}$/;
const ALLOWED_INPUT_TYPES = new Set<ScanInputType>(["screenshot", "link", "email", "qr", "document", "chat"]);

type RateEntry = {
  count: number;
  resetAt: number;
};

const globalForSecurity = globalThis as unknown as {
  __scamshieldRateLimits?: Map<string, RateEntry>;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export type SessionContext = {
  sessionId: string;
  isNew: boolean;
};

export function createSessionId() {
  return randomUUID().replace(/-/g, "");
}

export function isValidSessionId(value?: string) {
  return Boolean(value && VALID_SESSION.test(value));
}

export function resolveSession(request: NextRequest): SessionContext {
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  if (isValidSessionId(existing)) {
    return { sessionId: existing as string, isNew: false };
  }
  return { sessionId: createSessionId(), isNew: true };
}

export function attachSessionCookie<T extends NextResponse>(response: T, session: SessionContext) {
  if (session.isNew) {
    response.cookies.set(SESSION_COOKIE, session.sessionId, {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

export function clientAddress(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || forwarded || "local";
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = globalForSecurity.__scamshieldRateLimits ?? new Map<string, RateEntry>();
  globalForSecurity.__scamshieldRateLimits = bucket;

  const current = bucket.get(key);
  if (!current || current.resetAt <= now) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}

export async function readJsonBody<T>(request: NextRequest, maxBytes: number): Promise<T> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > maxBytes) {
    throw new ApiRequestError(`Request body exceeds ${Math.round(maxBytes / 1024)} KB.`, 413);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new ApiRequestError(`Request body exceeds ${Math.round(maxBytes / 1024)} KB.`, 413);
  }

  try {
    return JSON.parse(raw || "{}") as T;
  } catch {
    throw new ApiRequestError("Request body must be valid JSON.", 400);
  }
}

export function normalizeInputType(value: unknown): ScanInputType {
  const inputType = typeof value === "string" ? value : "link";
  return ALLOWED_INPUT_TYPES.has(inputType as ScanInputType) ? (inputType as ScanInputType) : "link";
}

export function boundedText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  if (text.length > maxLength) {
    throw new ApiRequestError(`Input is too long. Maximum ${maxLength.toLocaleString()} characters allowed.`, 413);
  }
  return text;
}

function maskIdentifier(value?: string) {
  if (!value) return undefined;
  if (value.length <= 18) return value;
  return `${value.slice(0, 12)}...${value.slice(-6)}`;
}

export function auditTerminal3Proof(proof: Terminal3Proof): Terminal3Proof {
  return {
    enabled: proof.enabled,
    authenticated: proof.authenticated,
    environment: proof.environment,
    did: proof.did,
    expectedDid: proof.expectedDid,
    identityMatches: proof.identityMatches,
    latencyMs: proof.latencyMs,
    status: proof.status,
    message: proof.message,
  };
}

export function publicTerminal3Proof(proof: Terminal3Proof): Terminal3Proof {
  return {
    enabled: proof.enabled,
    authenticated: proof.authenticated,
    environment: proof.environment,
    did: maskIdentifier(proof.did),
    expectedDid: maskIdentifier(proof.expectedDid),
    identityMatches: proof.identityMatches,
    latencyMs: proof.latencyMs,
    status: proof.status,
    message: proof.message,
    usageBalance: proof.usageBalance ? "available" : undefined,
  };
}

export function publicAuditEntry(entry: AuditEntry): AuditEntry {
  return {
    id: entry.id,
    scanId: entry.scanId,
    agentId: entry.agentId,
    action: entry.action,
    status: entry.status,
    timestamp: entry.timestamp,
    permission: entry.permission,
    terminal3Status: entry.terminal3Status,
    did: maskIdentifier(entry.did),
    signature: entry.signature,
    details: entry.details,
  };
}

export function publicScan(scan: ScanResult): ScanResult {
  return {
    id: scan.id,
    createdAt: scan.createdAt,
    inputType: scan.inputType,
    inputPreview: scan.inputPreview,
    riskScore: scan.riskScore,
    severity: scan.severity,
    category: scan.category,
    summary: scan.summary,
    recommendation: scan.recommendation,
    detectedSignals: scan.detectedSignals,
    extractedText: scan.extractedText,
    urls: scan.urls,
    agents: scan.agents,
    audit: scan.audit.map(publicAuditEntry),
    terminal3: publicTerminal3Proof(scan.terminal3),
  };
}
