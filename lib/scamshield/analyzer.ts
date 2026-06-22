import { AGENTS, getAgentOrder } from "./agents";
import type { AgentFinding, ScanRequest, ScanResult, Severity, Terminal3Proof } from "./types";

const SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd", "rebrand.ly", "rb.gy"]);
const SUSPICIOUS_TLDS = [".xyz", ".top", ".click", ".shop", ".loan", ".work", ".support", ".zip", ".mov"];
const BRANDS = ["sbi", "hdfc", "icici", "axis", "paytm", "phonepe", "google pay", "amazon", "flipkart", "netflix", "irctc", "uidai", "income tax", "rbi", "bank"];
const URGENCY = ["urgent", "immediately", "suspended", "blocked", "verify now", "limited time", "act now", "final warning", "24 hours", "otp", "password", "kyc", "prize", "lottery", "refund", "claim"];
const MONEY = ["upi", "bank", "account", "wallet", "investment", "crypto", "transfer", "payment", "loan", "credit card", "debit card", "pin"];
const SAFE_HINTS = ["official", "receipt", "invoice", "confirmed", "thank you", "order delivered", "statement"];

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function preview(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "No readable content supplied";
  return cleaned.length > 180 ? `${cleaned.slice(0, 180)}...` : cleaned;
}

function extractUrls(text: string) {
  const matches = text.match(/https?:\/\/[^\s<>"')]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"')]+)?/gi) ?? [];
  return Array.from(new Set(matches.map((item) => item.replace(/[.,;!?]+$/, ""))));
}

function getHost(rawUrl: string) {
  try {
    const normalized = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    return new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return rawUrl.toLowerCase();
  }
}

function classify(score: number): Severity {
  if (score >= 90) return "Critical";
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  if (score >= 18) return "Low";
  return "Safe";
}

function categoryFromSignals(signals: string[], inputType: string) {
  const text = signals.join(" ").toLowerCase();
  if (inputType === "qr" || text.includes("upi")) return "Payment / QR Scam";
  if (text.includes("impersonation") || text.includes("brand")) return "Brand Impersonation";
  if (text.includes("credential") || text.includes("password") || text.includes("kyc")) return "Credential Phishing";
  if (text.includes("investment") || text.includes("crypto")) return "Investment Scam";
  if (text.includes("job")) return "Job Offer Scam";
  if (text.includes("url") || text.includes("domain")) return "Suspicious Link";
  return inputType === "email" ? "Email Scam" : "General Fraud Risk";
}

function recommendation(score: number, category: string) {
  if (score >= 70) return `Do not click, pay, reply, or share OTP/passwords. Block the sender and verify through the official ${category.includes("Brand") ? "brand" : "support"} channel.`;
  if (score >= 40) return "Treat this as suspicious. Verify the sender, inspect the domain manually, and avoid sharing personal or payment details until confirmed.";
  if (score >= 18) return "Low risk, but keep normal caution. Use official apps or typed URLs instead of links in messages.";
  return "No strong scam indicators were found. Continue normal caution and avoid sharing sensitive data unless the source is verified.";
}

export function runScamAnalysis(request: ScanRequest, terminal3: Terminal3Proof): ScanResult {
  const content = `${request.content ?? ""}\n${request.fileNames?.join("\n") ?? ""}`.trim();
  const lower = content.toLowerCase();
  const urls = extractUrls(content);
  const signals: string[] = [];
  let score = 8;

  const urgencyHits = URGENCY.filter((word) => lower.includes(word));
  if (urgencyHits.length) {
    score += Math.min(28, urgencyHits.length * 7);
    signals.push(`Urgent or coercive language detected: ${urgencyHits.slice(0, 5).join(", ")}`);
  }

  const moneyHits = MONEY.filter((word) => lower.includes(word));
  if (moneyHits.length) {
    score += Math.min(18, moneyHits.length * 4);
    signals.push(`Money, credential, or payment terms detected: ${moneyHits.slice(0, 5).join(", ")}`);
  }

  const brandHits = BRANDS.filter((brand) => lower.includes(brand));
  if (brandHits.length) {
    score += Math.min(18, brandHits.length * 5);
    signals.push(`Possible brand or institution impersonation: ${brandHits.slice(0, 4).join(", ")}`);
  }

  for (const rawUrl of urls) {
    const host = getHost(rawUrl);
    if (!rawUrl.startsWith("https://")) {
      score += 10;
      signals.push(`URL is not explicitly HTTPS: ${rawUrl}`);
    }
    if (SHORTENERS.has(host)) {
      score += 18;
      signals.push(`Shortened link hides the destination: ${host}`);
    }
    if (SUSPICIOUS_TLDS.some((tld) => host.endsWith(tld))) {
      score += 18;
      signals.push(`Suspicious top-level domain: ${host}`);
    }
    if (host.includes("login") || host.includes("verify") || host.includes("secure") || host.includes("support")) {
      score += 12;
      signals.push(`Credential-themed domain wording: ${host}`);
    }
    if (host.includes("amaz0n") || host.includes("paytm-") || host.includes("sbi-") || host.includes("hdfc-")) {
      score += 22;
      signals.push(`Lookalike brand domain pattern: ${host}`);
    }
  }

  if (/(?:\b\d{6}\b|\botp\b|\bpin\b)/i.test(content)) {
    score += 14;
    signals.push("OTP, PIN, or one-time code language appears in the message");
  }

  if (/(?:upi:\/\/|pa=|@[a-z]{2,}|payee|collect request)/i.test(content)) {
    score += 16;
    signals.push("Payment or UPI request payload detected");
  }

  if (request.inputType === "qr") {
    score += 8;
    signals.push("QR payloads are treated as payment-sensitive until verified");
  }

  const safeHits = SAFE_HINTS.filter((word) => lower.includes(word));
  if (safeHits.length && score < 50) score -= Math.min(8, safeHits.length * 2);

  score = Math.max(0, Math.min(99, score));
  if (!content) score = 0;

  const severity = classify(score);
  const category = categoryFromSignals(signals, request.inputType);
  const scanId = id("scan");
  const agentOrder = getAgentOrder(request.inputType);

  const agents: AgentFinding[] = agentOrder.map((agentId) => {
    const agent = AGENTS[agentId];
    const evidence = (() => {
      if (agentId === "ocr-agent") return [content ? `Extracted ${content.length.toLocaleString()} characters from submitted content.` : "No extracted text was available."];
      if (agentId === "url-agent") return urls.length ? urls.map((url) => `Checked ${getHost(url)}`) : ["No URL-like string detected."];
      if (agentId === "fraud-agent") return signals.length ? signals.slice(0, 5) : ["No known fraud language pattern matched."];
      if (agentId === "qr-agent") return request.inputType === "qr" || /upi:\/\//i.test(content) ? ["QR/payment payload inspection completed."] : ["No QR-specific payload supplied."];
      if (agentId === "chat-agent") return ["Safety question routed through scam-intelligence policy."];
      return [`Merged ${signals.length} signal${signals.length === 1 ? "" : "s"} into a ${severity.toLowerCase()} risk score.`];
    })();

    return {
      ...agent,
      status: "completed",
      summary:
        agentId === "risk-agent"
          ? `${severity} risk, ${score}% confidence-weighted score`
          : evidence[0],
      evidence,
    };
  });

  const summary =
    score >= 70
      ? `This looks dangerous and matches ${category.toLowerCase()} patterns.`
      : score >= 40
        ? `This needs verification before trusting it.`
        : score >= 18
          ? `Only weak scam indicators were found.`
          : `No major scam indicators were found.`;

  return {
    id: scanId,
    createdAt: new Date().toISOString(),
    inputType: request.inputType,
    inputPreview: preview(content),
    riskScore: score,
    severity,
    category,
    summary,
    recommendation: recommendation(score, category),
    detectedSignals: signals.length ? signals : ["No high-confidence scam indicators detected."],
    extractedText: content,
    urls,
    agents,
    audit: [],
    terminal3,
  };
}
