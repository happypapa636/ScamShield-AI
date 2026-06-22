export type AgentId =
  | "ocr-agent"
  | "url-agent"
  | "fraud-agent"
  | "qr-agent"
  | "risk-agent"
  | "chat-agent";

export type ScanInputType = "screenshot" | "link" | "email" | "qr" | "document" | "chat";

export type Severity = "Safe" | "Low" | "Medium" | "High" | "Critical";

export type Terminal3Proof = {
  enabled: boolean;
  authenticated: boolean;
  environment: "testnet" | "production";
  did?: string;
  expectedDid?: string;
  address?: string;
  usageBalance?: number | string;
  latencyMs: number;
  status: "verified" | "demo" | "error";
  message: string;
};

export type AgentFinding = {
  agentId: AgentId;
  label: string;
  status: "idle" | "authorized" | "running" | "completed" | "blocked";
  permission: string;
  summary: string;
  evidence: string[];
};

export type AuditEntry = {
  id: string;
  scanId: string;
  agentId: AgentId;
  action: string;
  status: "success" | "blocked" | "failed";
  timestamp: string;
  permission: string;
  terminal3Status: Terminal3Proof["status"];
  did?: string;
  signature: string;
  details: string;
};

export type ScanResult = {
  id: string;
  createdAt: string;
  inputType: ScanInputType;
  inputPreview: string;
  riskScore: number;
  severity: Severity;
  category: string;
  summary: string;
  recommendation: string;
  detectedSignals: string[];
  extractedText: string;
  urls: string[];
  agents: AgentFinding[];
  audit: AuditEntry[];
  terminal3: Terminal3Proof;
};

export type ScanRequest = {
  inputType: ScanInputType;
  content: string;
  fileNames?: string[];
  source?: "scan" | "chat";
};
