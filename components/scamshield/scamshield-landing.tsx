"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, ChevronRight, FileSearch, LockKeyhole, MessageSquare, QrCode, ShieldCheck, Terminal } from "lucide-react";
import { AgentParticleCanvas } from "@/components/scamshield/agent-particle-canvas";

const rotating = ["PHISHING", "QR SCAMS", "FAKE UPI", "JOB FRAUD", "BANK SPOOFS"];

const capabilities = [
  {
    id: "01",
    title: "SCREENSHOT\nANALYSIS",
    tag: "OCR AGENT",
    desc: "Extracts suspicious text from WhatsApp, SMS, and email screenshots, then passes clean evidence into the agent chain.",
    icon: FileSearch,
  },
  {
    id: "02",
    title: "LINK\nSCANNER",
    tag: "URL AGENT",
    desc: "Flags lookalike domains, suspicious TLDs, shortened links, non-HTTPS flows, and credential-themed URLs.",
    icon: ShieldCheck,
  },
  {
    id: "03",
    title: "QR & UPI\nINSPECTION",
    tag: "QR AGENT",
    desc: "Checks payment-sensitive QR payloads, UPI handles, unknown merchants, and collect-request language before the user pays.",
    icon: QrCode,
  },
  {
    id: "04",
    title: "SIGNED\nAUDIT TRAIL",
    tag: "TERMINAL3",
    desc: "Every agent action records identity, permission, action, DID context, status, timestamp, and signature.",
    icon: LockKeyhole,
  },
];

function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#1e1e1e] bg-[#050505]/92 backdrop-blur-sm">
      <div className="flex h-8 items-center justify-between border-b border-[#1e1e1e] px-5 lg:px-12">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#3a3a3a]">SYS:SCAMSHIELD-AI / T3N ADK BUILD</span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[#22c55e] md:inline">Protected agents online</span>
      </div>
      <div className="flex h-14 items-center justify-between px-5 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center border border-[#2196f3]">
            <ShieldCheck className="h-5 w-5 text-[#2196f3]" />
          </div>
          <span className="font-display text-2xl tracking-[0.16em] text-[#f2ede6]">SCAMSHIELD</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {["features", "workflow", "terminal3", "demo"].map((item) => (
            <a key={item} href={`#${item}`} className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#5a5a5a] hover:text-[#2196f3]">
              {item}
            </a>
          ))}
        </nav>
        <Link href="/dashboard" className="bg-[#2196f3] px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#050505]">
          Open app
        </Link>
      </div>
    </header>
  );
}

export function ScamShieldLanding() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIndex((current) => (current + 1) % rotating.length), 760);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-[#f2ede6]">
      <LandingNav />
      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden pt-[88px] grid-bg">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full opacity-80 lg:w-[58%]">
          <AgentParticleCanvas className="h-full w-full" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_80%_50%,rgba(33,150,243,0.08),transparent_70%)]" />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 py-20 lg:px-12">
          <div className="max-w-5xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#2196f3]">ScamShield AI / Terminal3 protected fraud detection</div>
            <h1 className="mt-6 max-w-full font-display text-6xl leading-[0.9] tracking-wide sm:text-7xl md:text-8xl lg:text-9xl">
              STOP
              <span className="block h-20 overflow-hidden text-[#2196f3] md:h-24 lg:h-28">
                <span key={index} className="block animate-[fade-up_0.12s_ease_forwards]">{rotating[index]}</span>
              </span>
              BEFORE THEY STEAL
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-7 text-[#8a8a8a]">
              Upload screenshots, paste links, inspect QR payment payloads, and ask safety questions. ScamShield runs specialized agents and records Terminal3-backed identity, permission, and audit proof for every protected action.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/scan" className="inline-flex items-center gap-3 bg-[#2196f3] px-6 py-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#050505]">
                Scan evidence <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/chat" className="inline-flex items-center gap-3 border border-[#1e1e1e] px-6 py-4 font-mono text-xs uppercase tracking-[0.16em] text-[#f2ede6] hover:border-[#2196f3] hover:text-[#2196f3]">
                Ask assistant <MessageSquare className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 border-t border-[#1e1e1e] py-5">
          <div className="marquee-fast flex whitespace-nowrap">
            {[...Array(2)].map((_, repeat) => (
              <span key={repeat} className="inline-flex gap-16 px-8">
                {["OCR AGENT", "URL AGENT", "FRAUD AGENT", "QR AGENT", "RISK AGENT", "TERMINAL3 AUTH", "SIGNED ACTIONS", "AUDIT LOGS"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#3a3a3a]">
                    <span className="h-1 w-1 bg-[#2196f3]" />
                    {item}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-[#1e1e1e] scroll-mt-[88px]">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-12">
          <div className="border-b border-[#1e1e1e] py-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2196f3]">Core capabilities</div>
            <h2 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-6xl">BUILT FOR REAL SCAM FLOWS</h2>
          </div>
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="group grid gap-0 border-b border-[#1e1e1e] transition-colors hover:bg-[#0b0b0b] lg:grid-cols-[64px_260px_1fr_96px]">
                <div className="border-r border-[#1e1e1e] p-5 font-mono text-[10px] text-[#3a3a3a]">{item.id}</div>
                <div className="border-r border-[#1e1e1e] p-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#2196f3]">{item.tag}</div>
                  <h3 className="mt-4 whitespace-pre-line font-display text-4xl leading-[0.92] tracking-wide group-hover:text-[#2196f3]">{item.title}</h3>
                </div>
                <div className="flex items-center border-r border-[#1e1e1e] p-6">
                  <p className="max-w-2xl text-sm leading-7 text-[#8a8a8a]">{item.desc}</p>
                </div>
                <div className="hidden place-items-center p-6 lg:grid">
                  <Icon className="h-8 w-8 text-[#2196f3]" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="border-t border-[#1e1e1e] scroll-mt-[88px]">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2196f3]">Demo flow for judges</div>
            <h2 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-6xl">FROM MESSAGE TO SIGNED REPORT</h2>
          </div>
          <div className="border-y border-[#1e1e1e]">
            {["User uploads WhatsApp screenshot", "OCR Agent extracts text", "URL Agent checks link", "Fraud Agent detects phishing", "Risk Agent calculates score", "Terminal3 verifies protected action", "Signed audit report is stored"].map((step, idx) => (
              <div key={step} className="grid grid-cols-[54px_1fr] border-b border-[#1e1e1e]">
                <div className="border-r border-[#1e1e1e] p-4 font-mono text-[10px] text-[#3a3a3a]">{String(idx + 1).padStart(2, "0")}</div>
                <div className="p-4 text-sm leading-6 text-[#d8d3cc]">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="terminal3" className="border-t border-[#1e1e1e] scroll-mt-[88px]">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-14 lg:grid-cols-3 lg:px-12">
          {[
            ["Agent identity", "No anonymous workers. Every ScamShield agent has a named identity and permission scope."],
            ["Authentication", "Server routes initialize Terminal3 ADK sessions, run handshake/authenticate, and attach DID context to scan reports."],
            ["Signed actions", "Audit rows are HMAC-signed locally with Terminal3 key material or a dedicated audit secret, then stored for review."],
          ].map(([title, text]) => (
            <div key={title} className="border-y border-[#1e1e1e] p-6">
              <Terminal className="h-8 w-8 text-[#2196f3]" />
              <h3 className="mt-6 font-display text-4xl leading-none tracking-wide">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#8a8a8a]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="border-t border-[#1e1e1e] px-5 py-16 lg:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-8 border-y border-[#1e1e1e] py-10 lg:flex-row lg:items-center">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2196f3]">Session-safe fraud desk</div>
            <h2 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-6xl">RUN THE AGENT DEMO</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-3 bg-[#2196f3] px-6 py-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#050505]">
              Open dashboard <Bot className="h-4 w-4" />
            </Link>
            <Link href="/audit" className="inline-flex items-center gap-3 border border-[#1e1e1e] px-6 py-4 font-mono text-xs uppercase tracking-[0.16em] text-[#f2ede6] hover:border-[#2196f3] hover:text-[#2196f3]">
              View audit logs <Terminal className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
