import type { Terminal3Proof } from "./types";

type Environment = "testnet" | "production";

let cached: { at: number; proof: Terminal3Proof } | null = null;
const CACHE_MS = 45_000;

function environment(): Environment {
  return process.env.T3N_ENVIRONMENT === "production" ? "production" : "testnet";
}

function cleanError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 180);
  return "Terminal3 SDK call failed";
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Terminal3 SDK timed out after ${ms}ms`)), ms);
    }),
  ]);
}

export async function getTerminal3Proof(force = false): Promise<Terminal3Proof> {
  if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.proof;

  const started = Date.now();
  const apiKey = process.env.T3N_API_KEY || process.env.TERMINAL3_API_KEY;
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

  try {
    const sdk = await import("@terminal3/t3n-sdk");
    sdk.setEnvironment(env);

    const wasmComponent = await sdk.loadWasmComponent();
    const address = sdk.eth_get_address(apiKey);
    const t3n = new sdk.T3nClient({
      wasmComponent,
      handlers: {
        EthSign: sdk.metamask_sign(address, undefined, apiKey),
      },
    });

    await withTimeout(t3n.handshake(), 12_000);
    const didResult = await withTimeout(t3n.authenticate(sdk.createEthAuthInput(address)), 12_000);
    const did = String((didResult as { value?: string }).value ?? didResult);
    const usage = await withTimeout(t3n.getUsage({ limit: 1 }).catch(() => null), 8_000);

    const proof: Terminal3Proof = {
      enabled: true,
      authenticated: true,
      environment: env,
      did,
      expectedDid,
      address,
      usageBalance: usage ? JSON.stringify(usage).slice(0, 80) : "usage unavailable",
      latencyMs: Date.now() - started,
      status: "verified",
      message: "Terminal3 SDK handshake and authentication completed successfully.",
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
