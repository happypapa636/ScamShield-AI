"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Database,
  FileSearch,
  History,
  LayoutDashboard,
  LockKeyhole,
  MessageSquare,
  QrCode,
  Radar,
  Send,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Upload,
} from "lucide-react";
import { AgentParticleCanvas } from "@/components/scamshield/agent-particle-canvas";
import { PERMISSION_MATRIX } from "@/lib/scamshield/agents";
import type { AgentId, AuditEntry, ScanInputType, ScanResult, Terminal3Proof } from "@/lib/scamshield/types";

type View = "dashboard" | "scan" | "chat" | "history" | "agents" | "audit";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const navItems = [
  { view: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { view: "scan", label: "Scan", href: "/scan", icon: FileSearch },
  { view: "chat", label: "Chat", href: "/chat", icon: MessageSquare },
  { view: "history", label: "History", href: "/history", icon: History },
  { view: "agents", label: "Agents", href: "/agents", icon: Bot },
  { view: "audit", label: "Audit", href: "/audit", icon: Terminal },
] as const;

const scanModes: { value: ScanInputType; label: string; icon: typeof ShieldAlert }[] = [
  { value: "screenshot", label: "Screenshot", icon: Upload },
  { value: "link", label: "Link", icon: Radar },
  { value: "email", label: "Email", icon: MessageSquare },
  { value: "qr", label: "QR", icon: QrCode },
  { value: "document", label: "Document", icon: FileSearch },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function severityTone(severity: string) {
  if (severity === "Critical") return "text-[#ef4444]";
  if (severity === "High") return "text-[#f97316]";
  if (severity === "Medium") return "text-[#f59e0b]";
  if (severity === "Low") return "text-[#60a5fa]";
  return "text-[#22c55e]";
}

function scoreTone(score: number) {
  if (score >= 80) return "#ef4444";
  if (score >= 60) return "#f97316";
  if (score >= 40) return "#f59e0b";
  return "#22c55e";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function maskValue(value?: string) {
  if (!value) return "not configured";
  if (value.length <= 18) return value;
  return `${value.slice(0, 14)}...${value.slice(-6)}`;
}

function StatRail({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="border-b border-[#1e1e1e] p-5 lg:p-6">
      <div className={cx("font-display text-5xl leading-none tracking-wide", tone || "text-[#f2ede6]")}>{value}</div>
      <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5a5a]">{label}</div>
    </div>
  );
}

function Terminal3Status({ proof }: { proof?: Terminal3Proof }) {
  const label = proof?.identityMatches === false ? "T3N MISMATCH" : proof?.status === "verified" ? "T3N VERIFIED" : proof?.status === "error" ? "T3N ERROR" : "LOCAL DEMO";
  const color = proof?.status === "verified" ? "text-[#22c55e]" : proof?.status === "error" ? "text-[#ef4444]" : "text-[#f59e0b]";

  return (
    <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#5a5a5a]">
      <span className={cx("h-2 w-2 rounded-full", proof?.status === "verified" ? "bg-[#22c55e]" : proof?.status === "error" ? "bg-[#ef4444]" : "bg-[#f59e0b]")} />
      <span className={color}>{label}</span>
      <span className="hidden lg:inline">{proof?.environment || "testnet"}</span>
    </div>
  );
}

function ScoreDial({ scan }: { scan: ScanResult }) {
  const color = scoreTone(scan.riskScore);
  return (
    <div className="flex items-center gap-5">
      <div
        className="grid h-32 w-32 shrink-0 place-items-center rounded-full border border-[#1e1e1e]"
        style={{ background: `conic-gradient(${color} ${scan.riskScore}%, #101010 0)` }}
      >
        <div className="grid h-24 w-24 place-items-center rounded-full bg-[#050505]">
          <div className="text-center">
            <div className="font-display text-4xl leading-none text-[#f2ede6]">{scan.riskScore}</div>
            <div className="font-mono text-[9px] tracking-[0.16em] text-[#5a5a5a]">RISK</div>
          </div>
        </div>
      </div>
      <div>
        <div className={cx("font-display text-5xl leading-none", severityTone(scan.severity))}>{scan.severity}</div>
        <div className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-[#2196f3]">{scan.category}</div>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#9a9a9a]">{scan.summary}</p>
      </div>
    </div>
  );
}

function AppChrome({ active, proof, notice, children }: { active: View; proof?: Terminal3Proof; notice?: string; children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#f2ede6]">
      <div className="pointer-events-none fixed inset-y-0 right-0 w-[58vw] opacity-60">
        <AgentParticleCanvas className="h-full w-full" />
      </div>
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-70" />
      <div className="relative z-10 grid min-h-screen min-w-0 lg:grid-cols-[260px_1fr]">
        <aside className="min-w-0 overflow-hidden border-b border-[#1e1e1e] bg-[#050505]/90 backdrop-blur-sm lg:border-b-0 lg:border-r">
          <Link href="/" className="flex h-20 items-center gap-3 border-b border-[#1e1e1e] px-5 lg:h-24 lg:px-6">
            <div className="grid h-9 w-9 place-items-center border border-[#2196f3]">
              <ShieldCheck className="h-5 w-5 text-[#2196f3]" />
            </div>
            <div>
              <div className="font-display text-2xl tracking-[0.16em]">SCAMSHIELD</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5a5a]">Terminal3 protected</div>
            </div>
          </Link>
          <nav className="flex min-w-0 overflow-x-auto border-b border-[#1e1e1e] lg:grid lg:overflow-visible lg:border-b-0">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const selected = item.view === active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={selected ? "page" : undefined}
                  className={cx(
                    "group grid min-w-[156px] grid-cols-[28px_1fr] items-center border-r border-[#1e1e1e] px-3 py-4 transition-colors lg:min-w-0 lg:grid-cols-[44px_1fr_28px] lg:border-b lg:border-r-0 lg:px-4 lg:py-5",
                    selected ? "bg-[#0e0e0e] text-[#2196f3]" : "text-[#8a8a8a] hover:bg-[#0a0a0a] hover:text-[#f2ede6]",
                  )}
                >
                  <span className="font-mono text-[10px] text-[#3a3a3a]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em]">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronRight className={cx("hidden h-4 w-4 transition-transform lg:block", selected && "translate-x-1")} />
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#1e1e1e] bg-[#050505]/92 px-5 backdrop-blur-sm lg:px-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5a5a]">
              SYS:SCAMSHIELD-AI / BUILD 2026.06
            </div>
            <Terminal3Status proof={proof} />
          </header>
          {notice && (
            <div role="status" className="border-b border-[#f59e0b]/40 bg-[#160f05] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#f59e0b] lg:px-8">
              {notice}
            </div>
          )}
          <div className="px-5 py-8 lg:px-8 lg:py-10">{children}</div>
        </section>
      </div>
    </main>
  );
}

function DashboardView({ scans, proof }: { scans: ScanResult[]; proof?: Terminal3Proof }) {
  const total = scans.length;
  const high = scans.filter((scan) => scan.riskScore >= 70).length;
  const safe = scans.filter((scan) => scan.riskScore < 18).length;
  const avg = total ? Math.round(scans.reduce((sum, scan) => sum + scan.riskScore, 0) / total) : 0;

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="border-y border-[#1e1e1e] py-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2196f3]">Trusted AI fraud detection assistant</div>
          <h1 className="mt-4 max-w-full font-display text-4xl leading-[0.96] tracking-wide sm:text-6xl lg:max-w-5xl lg:text-8xl">
            <span className="block sm:hidden">
              <span className="block">SCAN LINKS</span>
              <span className="block">QR MESSAGES</span>
              <span className="block">BEFORE PAYING</span>
            </span>
            <span className="hidden sm:block">SCAN EVERY LINK, QR AND MESSAGE BEFORE IT HITS YOUR WALLET</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-[#9a9a9a]">
            ScamShield runs specialized agents for OCR, URL analysis, fraud patterns, QR payloads, and risk scoring. Terminal3 signs the protected action trail so judges can inspect identity, permission, and audit evidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/scan" className="inline-flex items-center gap-3 bg-[#2196f3] px-5 py-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#050505]">
              Start scan <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/agents" className="inline-flex items-center gap-3 border border-[#1e1e1e] px-5 py-4 font-mono text-xs uppercase tracking-[0.16em] text-[#f2ede6] hover:border-[#2196f3] hover:text-[#2196f3]">
              Agent monitor <Bot className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="border-y border-[#1e1e1e]">
          <StatRail label="Total scans" value={String(total)} />
          <StatRail label="High risk" value={String(high)} tone="text-[#ef4444]" />
          <StatRail label="Safe" value={String(safe)} tone="text-[#22c55e]" />
          <StatRail label="Average risk" value={`${avg}%`} tone="text-[#2196f3]" />
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="border-y border-[#1e1e1e]">
          <div className="flex items-center justify-between border-b border-[#1e1e1e] p-5">
            <h2 className="font-display text-4xl tracking-wide">LIVE THREAT FEED</h2>
            <Activity className="h-5 w-5 text-[#2196f3]" />
          </div>
          {scans.slice(0, 6).map((scan) => (
            <Link key={scan.id} href="/history" className="grid gap-4 border-b border-[#1e1e1e] p-5 transition-colors hover:bg-[#0b0b0b] md:grid-cols-[120px_110px_1fr_80px]">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a5a5a]">{formatDate(scan.createdAt)}</span>
              <span className={cx("font-mono text-[10px] uppercase tracking-[0.14em]", severityTone(scan.severity))}>{scan.severity}</span>
              <span className="text-sm text-[#cfcac3]">{scan.inputPreview}</span>
              <span className="font-display text-3xl text-[#f2ede6]">{scan.riskScore}</span>
            </Link>
          ))}
          {scans.length === 0 && (
            <div className="border-b border-[#1e1e1e] p-5 text-sm leading-6 text-[#8a8a8a]">
              No scans in this session yet. Run a scan to populate the threat feed.
            </div>
          )}
        </div>

        <div className="border-y border-[#1e1e1e]">
          <div className="border-b border-[#1e1e1e] p-5">
            <h2 className="font-display text-4xl tracking-wide">T3N CONTROL</h2>
            <p className="mt-2 text-sm leading-6 text-[#8a8a8a]">{proof?.message || "Checking Terminal3 status."}</p>
          </div>
          <div className="grid grid-cols-[44px_1fr] border-b border-[#1e1e1e]">
            <div className="border-r border-[#1e1e1e] p-4"><LockKeyhole className="h-4 w-4 text-[#2196f3]" /></div>
            <div className="p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5a5a]">Authenticated DID</div>
              <div className="mt-2 break-all font-mono text-xs text-[#f2ede6]">{maskValue(proof?.did || proof?.expectedDid)}</div>
            </div>
          </div>
          <div className="grid grid-cols-[44px_1fr] border-b border-[#1e1e1e]">
            <div className="border-r border-[#1e1e1e] p-4"><Database className="h-4 w-4 text-[#2196f3]" /></div>
            <div className="p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5a5a]">Identity check</div>
              <div className={cx("mt-2 break-all font-mono text-xs", proof?.identityMatches === false ? "text-[#ef4444]" : "text-[#f2ede6]")}>
                {proof?.identityMatches === false ? "configured DID mismatch" : proof?.usageBalance || "pending"}
              </div>
            </div>
          </div>
          <div className="p-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5a5a]">
            Every scan writes signed audit rows for agent identity, permission, action, status, and Terminal3 auth result.
          </div>
        </div>
      </section>
    </div>
  );
}

function ScanResultPanel({ scan }: { scan?: ScanResult }) {
  if (!scan) {
    return (
      <div className="border-y border-[#1e1e1e] p-8">
        <ShieldAlert className="h-10 w-10 text-[#2196f3]" />
        <h2 className="mt-6 font-display text-5xl leading-none tracking-wide">READY FOR PROTECTED ANALYSIS</h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#8a8a8a]">
          Submit a suspicious message, link, QR payload, email, screenshot text, or document text. The agent chain will classify the risk and emit signed audit proof.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-y border-[#1e1e1e] p-6">
        <ScoreDial scan={scan} />
        <div className="mt-7 border-t border-[#1e1e1e] pt-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#2196f3]">Recommendation</div>
          <p className="mt-3 text-base leading-7 text-[#d8d3cc]">{scan.recommendation}</p>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="border-y border-[#1e1e1e]">
          <div className="border-b border-[#1e1e1e] p-4 font-display text-3xl tracking-wide">DETECTED SIGNALS</div>
          {scan.detectedSignals.map((signal) => (
            <div key={signal} className="grid grid-cols-[38px_1fr] border-b border-[#1e1e1e]">
              <div className="border-r border-[#1e1e1e] p-3"><CircleAlert className="h-4 w-4 text-[#f59e0b]" /></div>
              <div className="p-3 text-sm leading-6 text-[#cfcac3]">{signal}</div>
            </div>
          ))}
        </div>
        <div className="border-y border-[#1e1e1e]">
          <div className="border-b border-[#1e1e1e] p-4 font-display text-3xl tracking-wide">AGENT ACTIONS</div>
          {scan.agents.map((agent) => (
            <div key={agent.agentId} className="border-b border-[#1e1e1e] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#2196f3]">{agent.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#22c55e]">{agent.status}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#8a8a8a]">{agent.summary}</p>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a5a5a]">{agent.permission}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScanView({ onScan, latest }: { onScan: (scan: ScanResult) => void; latest?: ScanResult }) {
  const evidenceId = useId();
  const evidenceHelpId = useId();
  const uploadStatusId = useId();
  const errorId = useId();
  const [inputType, setInputType] = useState<ScanInputType>("link");
  const [content, setContent] = useState("https://random-bank-security-login.xyz/verify-kyc");
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    setFileNames(selected.map((file) => `${file.name} (${Math.round(file.size / 1024)} KB)`));
    setUploadStatus("Reading evidence files...");

    const textParts: string[] = [];
    const notes: string[] = [];
    for (const file of selected) {
      if (/text|json|csv|eml|xml|html/i.test(file.type) || /\.(txt|eml|csv|json|html)$/i.test(file.name)) {
        textParts.push(await file.text());
        notes.push(`Read text from ${file.name}`);
        continue;
      }

      if (file.type.startsWith("image/") && "createImageBitmap" in window) {
        const detectorCtor = (window as unknown as {
          BarcodeDetector?: new (options: { formats: string[] }) => { detect(input: ImageBitmapSource): Promise<Array<{ rawValue?: string }>> };
        }).BarcodeDetector;
        if (detectorCtor) {
          try {
            const bitmap = await createImageBitmap(file);
            const detector = new detectorCtor({ formats: ["qr_code"] });
            const codes = await detector.detect(bitmap);
            const values = codes.map((code) => code.rawValue).filter(Boolean);
            if (values.length) textParts.push(`QR payload: ${values.join("\n")}`);
            if (values.length) notes.push(`Decoded QR payload from ${file.name}`);
          } catch {
            notes.push(`QR detection could not read ${file.name}`);
          }
        }

        try {
          setUploadStatus(`Running local OCR on ${file.name}...`);
          const { createWorker } = await import("tesseract.js");
          const worker = await createWorker("eng");
          const result = await worker.recognize(file);
          await worker.terminate();
          const text = result.data.text.replace(/\s+/g, " ").trim();
          if (text.length >= 8) {
            textParts.push(`OCR text from ${file.name}: ${text}`);
            notes.push(`Extracted OCR text from ${file.name}`);
          } else {
            notes.push(`No readable OCR text found in ${file.name}`);
          }
        } catch {
          notes.push(`OCR could not process ${file.name}; paste the readable text manually if needed`);
        }
        continue;
      }

      notes.push(`Unsupported file type for ${file.name}; paste its readable text manually`);
    }
    if (textParts.length) setContent((current) => `${current}\n${textParts.join("\n")}`.trim());
    setUploadStatus(notes.length ? notes.join(" / ") : "No readable content found.");
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType, content, fileNames }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Scan failed");
      onScan(data.scan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-6">
        <div className="border-y border-[#1e1e1e] p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2196f3]">Scan intake</div>
          <h1 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-6xl">PROTECTED SCAN</h1>
          <p className="mt-4 text-sm leading-6 text-[#8a8a8a]">
            Choose the evidence type, paste the suspicious content, or upload a readable text/email/image file. Each scan runs through Terminal3-authenticated agent policy.
          </p>
        </div>

        <div className="grid grid-cols-2 border-t border-[#1e1e1e] md:grid-cols-5">
          {scanModes.map((mode) => {
            const Icon = mode.icon;
            const selected = inputType === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setInputType(mode.value)}
                className={cx(
                  "border-b border-r border-[#1e1e1e] p-4 text-left transition-colors",
                  selected ? "bg-[#0e0e0e] text-[#2196f3]" : "text-[#8a8a8a] hover:text-[#f2ede6]",
                )}
              >
                <Icon className="h-5 w-5" />
                <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em]">{mode.label}</div>
              </button>
            );
          })}
        </div>

        <label htmlFor={evidenceId} className="sr-only">Evidence content</label>
        <p id={evidenceHelpId} className="sr-only">
          Paste the suspicious link, email, message, QR payload, or extracted document text to scan.
        </p>
        <textarea
          id={evidenceId}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          aria-describedby={cx(evidenceHelpId, uploadStatus ? uploadStatusId : "", error ? errorId : "")}
          aria-invalid={Boolean(error)}
          className="min-h-72 w-full resize-y border-y border-[#1e1e1e] bg-[#050505]/90 p-5 font-mono text-sm leading-7 text-[#f2ede6] outline-none transition-colors placeholder:text-[#444] focus:border-[#2196f3]"
          placeholder="Paste suspicious link, email, WhatsApp text, QR payload, or OCR text..."
        />

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex items-center justify-between border border-[#1e1e1e] px-5 py-4 text-left font-mono text-xs uppercase tracking-[0.16em] text-[#8a8a8a] hover:border-[#2196f3] hover:text-[#f2ede6]"
          >
            <span>{fileNames.length ? `${fileNames.length} file(s) staged` : "Upload evidence"}</span>
            <Upload className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="inline-flex items-center justify-center gap-3 bg-[#2196f3] px-6 py-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#050505] disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Scanning..." : "Run scan"} <Radar className="h-4 w-4" />
          </button>
        </div>
        <input ref={fileInput} type="file" multiple className="hidden" onChange={(event) => onFiles(event.target.files)} />
        {uploadStatus && (
          <div id={uploadStatusId} role="status" className="border-y border-[#1e1e1e] p-4 text-sm leading-6 text-[#8a8a8a]">
            {uploadStatus}
          </div>
        )}
        {fileNames.length > 0 && (
          <div className="border-y border-[#1e1e1e] p-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a5a5a]">
            {fileNames.join(" / ")}
          </div>
        )}
        {error && <div id={errorId} role="alert" className="border-y border-[#ef4444]/40 p-4 text-sm text-[#ef4444]">{error}</div>}
      </section>
      <ScanResultPanel scan={latest} />
    </div>
  );
}

function ChatView({ onScan }: { onScan: (scan: ScanResult) => void }) {
  const inputId = useId();
  const statusId = useId();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Ask whether a website, email, QR request, job offer, or payment message looks safe." },
  ]);
  const [message, setMessage] = useState("Should I trust https://amaz0n-sale.shop for a 90% discount?");
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = message.trim();
    if (!text) return;
    setMessage("");
    setMessages((current) => [...current, { role: "user", content: text }]);
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat failed");
      onScan(data.scan);
      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Chat failed" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
      <section className="border-y border-[#1e1e1e]">
        <div className="border-b border-[#1e1e1e] p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2196f3]">Safety co-pilot</div>
          <h1 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-6xl">ASK BEFORE YOU CLICK</h1>
        </div>
        <div className="min-h-[460px] p-5" aria-live="polite">
          {messages.map((item, index) => (
            <div key={`${item.role}-${index}`} className={cx("mb-5 max-w-3xl border-l px-4 py-2", item.role === "assistant" ? "border-[#2196f3]" : "ml-auto border-[#f59e0b] text-right")}>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5a5a]">{item.role}</div>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#d8d3cc]">{item.content}</p>
            </div>
          ))}
          {busy && <div id={statusId} role="status" className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#2196f3]">Agents are reasoning...</div>}
        </div>
        <div className="grid gap-3 border-t border-[#1e1e1e] p-5 sm:grid-cols-[1fr_auto]">
          <label htmlFor={inputId} className="sr-only">Safety question</label>
          <input
            id={inputId}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") void send(); }}
            aria-describedby={busy ? statusId : undefined}
            className="border border-[#1e1e1e] bg-[#050505] px-4 py-4 text-sm text-[#f2ede6] outline-none focus:border-[#2196f3]"
            placeholder="Ask about a suspicious link, sender, QR payment, or message..."
          />
          <button onClick={send} disabled={busy} className="inline-flex items-center justify-center gap-3 bg-[#2196f3] px-5 py-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#050505] disabled:opacity-60">
            Send <Send className="h-4 w-4" />
          </button>
        </div>
      </section>
      <section className="border-y border-[#1e1e1e] p-6">
        <ShieldCheck className="h-9 w-9 text-[#22c55e]" />
        <h2 className="mt-6 font-display text-4xl leading-none tracking-wide">GUIDANCE RULES</h2>
        <div className="mt-6 space-y-4 text-sm leading-6 text-[#8a8a8a]">
          <p>Never share OTP, card PIN, account password, or remote-access permissions through a link from a message.</p>
          <p>For banks, taxes, delivery, jobs, and UPI requests, use the official app or a URL you type manually.</p>
          <p>When ScamShield flags high risk, preserve the evidence and block the sender.</p>
        </div>
      </section>
    </div>
  );
}

function HistoryView({ scans }: { scans: ScanResult[] }) {
  return (
    <section className="border-y border-[#1e1e1e]">
      <div className="border-b border-[#1e1e1e] p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2196f3]">Previous scans</div>
        <h1 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-6xl">HISTORY</h1>
      </div>
      {scans.map((scan) => (
        <div key={scan.id} className="grid gap-4 border-b border-[#1e1e1e] p-5 md:grid-cols-[150px_110px_120px_1fr_80px]">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a5a5a]">{formatDate(scan.createdAt)}</div>
          <div className={cx("font-mono text-[10px] uppercase tracking-[0.14em]", severityTone(scan.severity))}>{scan.severity}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2196f3]">{scan.inputType}</div>
          <div className="text-sm leading-6 text-[#cfcac3]">{scan.inputPreview}</div>
          <div className="font-display text-3xl text-[#f2ede6]">{scan.riskScore}</div>
        </div>
      ))}
      {scans.length === 0 && (
        <div className="p-6 text-sm leading-6 text-[#8a8a8a]">
          No scans have been saved for this browser session.
        </div>
      )}
    </section>
  );
}

function AgentsView({ proof }: { proof?: Terminal3Proof }) {
  const entries = Object.entries(PERMISSION_MATRIX) as Array<[AgentId, string[]]>;
  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      <section className="border-y border-[#1e1e1e]">
        <div className="border-b border-[#1e1e1e] p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2196f3]">Agent identity and permissions</div>
          <h1 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-6xl">AGENT MONITOR</h1>
        </div>
        {entries.map(([agentId, permissions], index) => (
          <div key={agentId} className="grid gap-4 border-b border-[#1e1e1e] p-5 lg:grid-cols-[54px_190px_1fr_120px]">
            <div className="font-mono text-[10px] text-[#3a3a3a]">{String(index + 1).padStart(2, "0")}</div>
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#2196f3]">{agentId}</div>
            <div className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <span key={permission} className="border border-[#1e1e1e] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a8a8a]">{permission}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#22c55e]">
              <CheckCircle2 className="h-4 w-4" /> active
            </div>
          </div>
        ))}
      </section>
      <section className="border-y border-[#1e1e1e] p-6">
        <LockKeyhole className="h-9 w-9 text-[#2196f3]" />
        <h2 className="mt-6 font-display text-4xl leading-none tracking-wide">TERMINAL3 SDK</h2>
        <div className="mt-6 space-y-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5a5a]">Status</div>
            <div className={cx("mt-2 font-display text-4xl", proof?.status === "verified" ? "text-[#22c55e]" : proof?.status === "error" ? "text-[#ef4444]" : "text-[#f59e0b]")}>{proof?.status || "checking"}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5a5a]">DID</div>
            <div className="mt-2 break-all font-mono text-xs text-[#d8d3cc]">{maskValue(proof?.did || proof?.expectedDid)}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5a5a]">SDK proof</div>
            <p className="mt-2 text-sm leading-6 text-[#8a8a8a]">{proof?.message || "Loading Terminal3 status."}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuditView({ audit }: { audit: AuditEntry[] }) {
  return (
    <section className="border-y border-[#1e1e1e]">
      <div className="border-b border-[#1e1e1e] p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2196f3]">Signed protected actions</div>
        <h1 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-6xl">AUDIT LOGS</h1>
      </div>
      {audit.length === 0 && <div className="p-6 text-sm text-[#8a8a8a]">Run a scan to create signed audit entries.</div>}
      {audit.map((entry) => (
        <div key={entry.id} className="grid gap-4 border-b border-[#1e1e1e] p-5 lg:grid-cols-[145px_150px_1fr_150px]">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a5a5a]">{formatDate(entry.timestamp)}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2196f3]">{entry.agentId}</div>
          <div>
            <div className="text-sm leading-6 text-[#d8d3cc]">{entry.action}</div>
            <div className="mt-2 break-all font-mono text-[10px] uppercase tracking-[0.12em] text-[#5a5a5a]">sig:{entry.signature.slice(0, 28)}...</div>
          </div>
          <div className={cx("font-mono text-[10px] uppercase tracking-[0.14em]", entry.terminal3Status === "verified" ? "text-[#22c55e]" : entry.terminal3Status === "error" ? "text-[#ef4444]" : "text-[#f59e0b]")}>{entry.terminal3Status}</div>
        </div>
      ))}
    </section>
  );
}

export function ScamShieldShell({ active }: { active: View }) {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [proof, setProof] = useState<Terminal3Proof>();
  const [notice, setNotice] = useState("");
  const latest = scans[0];

  const mergedAudit = useMemo(() => audit.length ? audit : scans.flatMap((scan) => scan.audit), [audit, scans]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [scanRes, auditRes, proofRes] = await Promise.all([
        fetch("/api/scans").then((res) => res.json()).catch(() => ({ scans: [] })),
        fetch("/api/audit").then((res) => res.json()).catch(() => ({ audit: [] })),
        fetch("/api/terminal3/status").then((res) => res.json()).catch(() => ({ proof: undefined })),
      ]);
      if (cancelled) return;
      const errors = [scanRes.error, auditRes.error, proofRes.error].filter(Boolean);
      setNotice(errors[0] || "");
      if (scanRes.scans) setScans(scanRes.scans);
      if (auditRes.audit) setAudit(auditRes.audit);
      if (proofRes.proof) setProof(proofRes.proof);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  function addScan(scan: ScanResult) {
    setScans((current) => [scan, ...current.filter((item) => item.id !== scan.id)]);
    setAudit((current) => [...scan.audit, ...current]);
    setProof(scan.terminal3);
  }

  return (
    <AppChrome active={active} proof={proof} notice={notice}>
      {active === "dashboard" && <DashboardView scans={scans} proof={proof} />}
      {active === "scan" && <ScanView onScan={addScan} latest={latest} />}
      {active === "chat" && <ChatView onScan={addScan} />}
      {active === "history" && <HistoryView scans={scans} />}
      {active === "agents" && <AgentsView proof={proof} />}
      {active === "audit" && <AuditView audit={mergedAudit} />}
    </AppChrome>
  );
}
