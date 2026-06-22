import { MongoClient } from "mongodb";
import type { AuditEntry, ScanResult } from "./types";

type MemoryStore = {
  scansBySession: Map<string, ScanResult[]>;
};

const globalForStore = globalThis as unknown as {
  __scamshieldMongo?: Promise<MongoClient>;
  __scamshieldMemory?: MemoryStore;
  __scamshieldMongoDisabledUntil?: number;
};

function memory() {
  if (!globalForStore.__scamshieldMemory) {
    globalForStore.__scamshieldMemory = { scansBySession: new Map() };
  }
  return globalForStore.__scamshieldMemory;
}

export class StorageUnavailableError extends Error {
  constructor(message = "Persistent storage is unavailable.") {
    super(message);
  }
}

type ScanDocument = ScanResult & {
  sessionId: string;
};

type AuditDocument = AuditEntry & {
  sessionId: string;
};

function canUseMemoryStore() {
  return process.env.NODE_ENV !== "production" || process.env.SCAMSHIELD_ALLOW_MEMORY_STORE === "true";
}

async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    if (canUseMemoryStore()) return null;
    throw new StorageUnavailableError("MONGODB_URI is required in production.");
  }
  if (globalForStore.__scamshieldMongoDisabledUntil && Date.now() < globalForStore.__scamshieldMongoDisabledUntil) {
    if (!canUseMemoryStore()) throw new StorageUnavailableError();
    return null;
  }
  try {
    if (!globalForStore.__scamshieldMongo) {
      globalForStore.__scamshieldMongo = new MongoClient(uri, { serverSelectionTimeoutMS: 2500 }).connect();
    }
    const client = await globalForStore.__scamshieldMongo;
    return client.db(process.env.MONGODB_DB || "scamshield_ai");
  } catch {
    globalForStore.__scamshieldMongo = undefined;
    globalForStore.__scamshieldMongoDisabledUntil = Date.now() + 60_000;
    if (!canUseMemoryStore()) throw new StorageUnavailableError();
    return null;
  }
}

function stripScanDocument(doc: ScanDocument & { _id?: unknown }): ScanResult {
  const { sessionId: _sessionId, _id: _id, ...scan } = doc;
  return scan;
}

function stripAuditDocument(doc: AuditDocument & { _id?: unknown }): AuditEntry {
  const { sessionId: _sessionId, _id: _id, ...entry } = doc;
  return entry;
}

export async function saveScan(scan: ScanResult, sessionId: string) {
  const db = await getDb();
  if (db) {
    try {
      const scanDocument: ScanDocument = { ...scan, sessionId };
      const auditDocuments: AuditDocument[] = scan.audit.map((entry) => ({ ...entry, sessionId }));

      await db.collection<ScanDocument>("scans").updateOne({ id: scan.id, sessionId }, { $set: scanDocument }, { upsert: true });
      await db.collection<AuditDocument>("audit_logs").insertMany(auditDocuments, { ordered: false }).catch(() => undefined);
      return scan;
    } catch {
      globalForStore.__scamshieldMongoDisabledUntil = Date.now() + 60_000;
      if (!canUseMemoryStore()) throw new StorageUnavailableError();
    }
  }

  const store = memory();
  const current = store.scansBySession.get(sessionId) ?? [];
  store.scansBySession.set(sessionId, [scan, ...current.filter((item) => item.id !== scan.id)].slice(0, 50));
  return scan;
}

export async function listScans(sessionId: string, limit = 25) {
  const db = await getDb();
  if (db) {
    try {
      const scans = await db.collection<ScanDocument>("scans").find({ sessionId }).sort({ createdAt: -1 }).limit(limit).toArray();
      return scans.map(stripScanDocument);
    } catch {
      globalForStore.__scamshieldMongoDisabledUntil = Date.now() + 60_000;
      if (!canUseMemoryStore()) throw new StorageUnavailableError();
    }
  }
  return (memory().scansBySession.get(sessionId) ?? []).slice(0, limit);
}

export async function listAudit(sessionId: string, limit = 80) {
  const db = await getDb();
  if (db) {
    try {
      const audit = await db.collection<AuditDocument>("audit_logs").find({ sessionId }).sort({ timestamp: -1 }).limit(limit).toArray();
      return audit.map(stripAuditDocument);
    } catch {
      globalForStore.__scamshieldMongoDisabledUntil = Date.now() + 60_000;
      if (!canUseMemoryStore()) throw new StorageUnavailableError();
    }
  }
  return (memory().scansBySession.get(sessionId) ?? [])
    .flatMap((scan) => scan.audit)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}
