import type { Terminal3Proof } from "./types";

type Environment = "testnet" | "production";
type Terminal3Sdk = typeof import("@terminal3/t3n-sdk");
type WasmComponent = Awaited<ReturnType<Terminal3Sdk["loadWasmComponent"]>>;

let cached: { at: number; proof: Terminal3Proof } | null = null;
let wasmComponentPromise: Promise<WasmComponent> | null = null;

const CACHE_MS = 120_000;
const T3N_CREDENTIAL = /^0x[0-9a-fA-F]{64}$/;

function environment(): Environment {
  return process.env.T3N_ENVIRONMENT === "production" ? "production" : "testnet";
}

function nodeUrl() {
  return process.env.T3N_BASE_URL?.trim() || process.env.TERMINAL3_BASE_URL?.trim() || undefined;
}

function credential() {
  const raw = (process.env.T3N_API_KEY || process.env.TERMINAL3_API_KEY || "").trim();
  if (!raw) return undefined;
  return raw.startsWith("0x") ? raw : `0x${raw}`;
}

function cleanError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 180);
  return "Terminal3 SDK call failed";
}

function extractDid(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const did = value as { value?: unknown; toString?: () => string };
    if (typeof did.value === "string") return did.value;
    if (did.toString && did.toString !== Object.prototype.toString) return did.toString();
  }
  return "";
}

function matchesExpectedDid(did: string, expectedDid?: string) {
  return expectedDid ? did === expectedDid : undefined;
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Terminal3 SDK timed out after ${ms}ms`)), ms);
    }),
  ]);
}

function getWasmComponent(sdk: Terminal3Sdk) {
  wasmComponentPromise ??= sdk.loadWasmComponent();
  return wasmComponentPromise;
}

export async function getTerminal3Proof(force = false): Promise<Terminal3Proof> {
  if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.proof;

  const started = Date.now();
  const apiKey = credential();
  const expectedDid = process.env.T3N_DID || process.env.TERMINAL3_DID;
  const env = environment();

  if (!apiKey) {
    const proof: Terminal3Proof = {
      enabled: false,
      authenticated: false,
      environment: env,
      expectedDid,
      latencyMs: Date.now() - started,
      status: "demo",
      message: "T3N_API_KEY is not configured; protected actions run in local signed demo mode.",
    };
    cached = { at: Date.now(), proof };
    return proof;
  }

  if (!T3N_CREDENTIAL.test(apiKey)) {
    const proof: Terminal3Proof = {
      enabled: true,
      authenticated: false,
      environment: env,
      expectedDid,
      identityMatches: false,
      latencyMs: Date.now() - started,
      status: "error",
      message: "T3N_API_KEY must be a 0x-prefixed 32-byte hex credential.",
    };
    cached = { at: Date.now(), proof };
    return proof;
  }

  try {
    const sdk = await import("@terminal3/t3n-sdk");
    sdk.setEnvironment(env);

    const wasmComponent = await getWasmComponent(sdk);
    const address = sdk.eth_get_address(apiKey);
    const t3n = new sdk.T3nClient({
      baseUrl: nodeUrl(),
      timeout: 12_000,
      wasmComponent,
      handlers: {
        EthSign: sdk.metamask_sign(address, undefined, apiKey),
      },
    });

    await withTimeout(t3n.handshake(), 12_000);
    const didResult = await withTimeout(t3n.authenticate(sdk.createEthAuthInput(address)), 12_000);
    const did = extractDid(didResult);
    const identityMatches = matchesExpectedDid(did, expectedDid);
    const usage = await withTimeout(t3n.getUsage({ limit: 1 }).catch(() => null), 8_000);
    const status = identityMatches === false ? "error" : "verified";

    const proof: Terminal3Proof = {
      enabled: true,
      authenticated: status === "verified",
      environment: env,
      did,
      expectedDid,
      identityMatches,
      address,
      usageBalance: usage ? JSON.stringify(usage).slice(0, 80) : "usage unavailable",
      latencyMs: Date.now() - started,
      status,
      message: identityMatches === false
        ? "Terminal3 SDK authenticated, but the returned DID does not match T3N_DID."
        : "Terminal3 SDK handshake and authentication completed successfully.",
    };
    cached = { at: Date.now(), proof };
    return proof;
  } catch (error) {
    const proof: Terminal3Proof = {
      enabled: true,
      authenticated: false,
      environment: env,
      expectedDid,
      latencyMs: Date.now() - started,
      status: "error",
      message: cleanError(error),
    };
    cached = { at: Date.now(), proof };
    return proof;
  }
}
