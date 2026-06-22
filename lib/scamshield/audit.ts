import { createHmac, randomUUID } from "node:crypto";
import type { AuditEntry, ScanResult, Terminal3Proof } from "./types";

function canonical(value: unknown) {
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
}

export function signAuditPayload(payload: Record<string, unknown>) {
  const configuredSecret = process.env.AUDIT_SIGNING_SECRET || process.env.T3N_API_KEY;
  if (!configuredSecret && process.env.NODE_ENV === "production") {
    throw new Error("AUDIT_SIGNING_SECRET is required in production.");
  }
  const secret = configuredSecret || "scamshield-local-audit-secret";
  return createHmac("sha256", secret).update(canonical(payload)).digest("hex");
}

export function createAuditEntries(scan: ScanResult, terminal3: Terminal3Proof): AuditEntry[] {
  return scan.agents.map((agent) => {
    const unsigned = {
      scanId: scan.id,
      agentId: agent.agentId,
      action: agent.summary,
      timestamp: new Date().toISOString(),
      permission: agent.permission,
      terminal3Status: terminal3.status,
      did: terminal3.did,
    };

    return {
      id: randomUUID(),
      scanId: scan.id,
      agentId: agent.agentId,
      action: agent.summary,
      status: agent.status === "blocked" ? "blocked" : "success",
      timestamp: unsigned.timestamp,
      permission: agent.permission,
      terminal3Status: terminal3.status,
      did: terminal3.did,
      signature: signAuditPayload(unsigned),
      details: agent.evidence.join(" "),
    };
  });
}

export function attachAudit(scan: ScanResult) {
  return {
    ...scan,
    audit: createAuditEntries(scan, scan.terminal3),
  };
}
