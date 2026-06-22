import type { AgentFinding, AgentId } from "./types";

export const AGENTS: Record<AgentId, Omit<AgentFinding, "status" | "summary" | "evidence">> = {
  "ocr-agent": {
    agentId: "ocr-agent",
    label: "OCR Agent",
    permission: "read:image,text,document",
  },
  "url-agent": {
    agentId: "url-agent",
    label: "URL Agent",
    permission: "analyze:url,dns,domain",
  },
  "fraud-agent": {
    agentId: "fraud-agent",
    label: "Fraud Agent",
    permission: "detect:scam-patterns",
  },
  "qr-agent": {
    agentId: "qr-agent",
    label: "QR Agent",
    permission: "inspect:qr,upi,payment",
  },
  "risk-agent": {
    agentId: "risk-agent",
    label: "Risk Agent",
    permission: "score:risk,merge-findings",
  },
  "chat-agent": {
    agentId: "chat-agent",
    label: "Chat Agent",
    permission: "answer:safety-questions",
  },
};

export const PERMISSION_MATRIX: Record<AgentId, string[]> = {
  "ocr-agent": ["Read screenshots", "Extract text", "Read uploaded document text"],
  "url-agent": ["Analyze links", "Inspect domains", "Detect suspicious redirects"],
  "fraud-agent": ["Detect scam language", "Match impersonation patterns", "Classify fraud category"],
  "qr-agent": ["Inspect QR payloads", "Detect UPI payment handles", "Flag unknown payment requests"],
  "risk-agent": ["Combine agent outputs", "Calculate risk score", "Generate recommendation"],
  "chat-agent": ["Answer scan questions", "Explain risk", "Suggest next steps"],
};

export function getAgentOrder(inputType: string): AgentId[] {
  if (inputType === "chat") return ["chat-agent", "fraud-agent", "risk-agent"];
  if (inputType === "link") return ["url-agent", "fraud-agent", "risk-agent"];
  if (inputType === "qr") return ["qr-agent", "url-agent", "fraud-agent", "risk-agent"];
  return ["ocr-agent", "url-agent", "fraud-agent", "qr-agent", "risk-agent"];
}
