# ScamShield AI Frontend

ScamShield AI is a web app that helps users check suspicious links, scam messages, QR/UPI payment requests, screenshots, emails, and uploaded evidence before they click, pay, reply, or share sensitive information.

Live app: [https://scamshield-ai-kohl.vercel.app](https://scamshield-ai-kohl.vercel.app)

 
## The Problem

Most scam attacks do not start with complex malware. They start with a link, a QR code, a fake bank/KYC message, a discount offer, a job promise, or a payment request that pressures the user to act quickly.

ScamShield AI solves this by giving users a fast fraud-risk review before the risky action happens. The app turns suspicious evidence into a clear verdict:

- What scam pattern was detected.
- How risky the evidence is.
- Which signals triggered the score.
- What action the user should take next.
- Which agent actions were recorded in the audit log.

## What The App Does

- Scans suspicious URLs, message text, emails, QR payloads, screenshots, and readable file evidence.
- Runs local image OCR with [`tesseract.js`](https://tesseract.projectnaptha.com/) when the user uploads image evidence.
- Decodes QR payloads in browsers that support `BarcodeDetector`.
- Detects urgency, OTP/KYC pressure, payment terms, suspicious TLDs, shortened URLs, non-HTTPS links, and brand impersonation.
- Produces a risk score, severity, category, explanation, and recommendation.
- Provides a chat interface for quick "is this safe?" questions.
- Stores history and audit logs per anonymous browser session.
- Uses Terminal3 proof for protected server-side agent actions and verifies the returned DID against the configured identity.
- Redacts sensitive Terminal3 operational fields from client responses.

## Product Links

- Landing page: [/](https://scamshield-ai-kohl.vercel.app/)
- Dashboard: [/dashboard](https://scamshield-ai-kohl.vercel.app/dashboard)
- Scan flow: [/scan](https://scamshield-ai-kohl.vercel.app/scan)
- Chat assistant: [/chat](https://scamshield-ai-kohl.vercel.app/chat)
- Scan history: [/history](https://scamshield-ai-kohl.vercel.app/history)
- Agent monitor: [/agents](https://scamshield-ai-kohl.vercel.app/agents)
- Audit logs: [/audit](https://scamshield-ai-kohl.vercel.app/audit)

## Architecture

```text
Browser UI
  |
  |-- /scan and /chat pages
  |-- local OCR and QR extraction
  |
Next.js App Router
  |
  |-- proxy.ts creates an HTTP-only session cookie
  |-- app/api/scans stores and returns session-scoped scans
  |-- app/api/chat runs chat questions through the scan engine
  |-- app/api/audit returns session-scoped audit rows
  |-- app/api/terminal3/status returns redacted Terminal3 proof
  |
ScamShield Core
  |
  |-- analyzer.ts detects scam signals and builds the risk report
  |-- agents.ts defines agent identities and permission scopes
  |-- audit.ts signs protected actions
  |-- security.ts validates input, rate-limits, scopes sessions, and redacts output
  |-- storage.ts persists scans and audit rows
  |
External Services
  |
  |-- MongoDB for persistent scan and audit storage
  |-- Terminal3 SDK for protected action proof
```

## Agent Workflow

1. The browser creates or receives an anonymous session cookie.
2. The user pastes suspicious content or uploads evidence.
3. The UI extracts readable text from text files, images, and QR payloads where possible.
4. The API validates request size, input type, session scope, and rate limits.
5. Terminal3 proof is collected server-side when configured.
6. ScamShield runs the agent pipeline:
   - `ocr-agent` handles extracted evidence text.
   - `url-agent` inspects links and domains.
   - `fraud-agent` detects scam language and impersonation.
   - `qr-agent` reviews QR and UPI payment payloads.
   - `risk-agent` merges signals into a score and recommendation.
   - `chat-agent` answers safety questions using the same policy.
7. The app stores a scan result and signed audit entries for the current session.

## Technology Stack

- [Next.js App Router](https://nextjs.org/docs/app)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Terminal3 Agent Developer Kit](https://www.terminal3.io/products/agent-developer-kit)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [Tesseract.js OCR](https://tesseract.projectnaptha.com/)
- [Vercel](https://vercel.com/docs)

## Security Model

- Session cookie: `scamshield_sid`, HTTP-only, same-site, secure in production.
- API data isolation: scans and audit rows are scoped by session.
- Rate limiting: scan, chat, audit, and Terminal3 status endpoints use in-memory rate limits.
- Input limits: body size and text length are capped.
- Output redaction: Mongo `_id`, session IDs, Terminal3 wallet address, and raw usage details are not returned to the client.
- Storage behavior: MongoDB is required in production. Memory fallback is for local development only unless explicitly enabled.
- Build safety: production builds run TypeScript validation.

## Local Setup

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

## Environment Variables

Create `frontend/.env.local` from `frontend/.env.local.example`.

```bash
T3N_API_KEY=
T3N_DID=
T3N_ENVIRONMENT=testnet
T3N_BASE_URL=
MONGODB_URI=
MONGODB_DB=scamshield_ai
AUDIT_SIGNING_SECRET=
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
SCAMSHIELD_ALLOW_MEMORY_STORE=true
```

Production notes:

- Set `NEXT_PUBLIC_SITE_URL` to the deployed app URL.
- Set `T3N_API_KEY`, `T3N_DID`, and `T3N_ENVIRONMENT`; the app treats a DID mismatch as an error even when SDK authentication succeeds.
- Set `T3N_BASE_URL` only when Terminal3 gives you a dedicated node URL.
- Configure `MONGODB_URI` and `MONGODB_DB`.
- Set `AUDIT_SIGNING_SECRET` or `T3N_API_KEY`.
- Leave `SCAMSHIELD_ALLOW_MEMORY_STORE` unset for real production persistence.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

- `npm run dev` starts the local development server.
- `npm run lint` runs `tsc --noEmit`.
- `npm run build` creates the production Next.js build and fails on TypeScript errors.
- `npm run start` serves a production build locally.

## Main Files

- [`app/layout.tsx`](./app/layout.tsx) - metadata, fonts, icons, and app shell root.
- [`proxy.ts`](./proxy.ts) - session cookie setup.
- [`components/scamshield/scamshield-landing.tsx`](./components/scamshield/scamshield-landing.tsx) - landing page UI.
- [`components/scamshield/scamshield-shell.tsx`](./components/scamshield/scamshield-shell.tsx) - dashboard, scan, chat, history, agents, and audit UI.
- [`lib/scamshield/analyzer.ts`](./lib/scamshield/analyzer.ts) - rule-based fraud detection.
- [`lib/scamshield/security.ts`](./lib/scamshield/security.ts) - sessions, validation, rate limits, and redaction.
- [`lib/scamshield/storage.ts`](./lib/scamshield/storage.ts) - MongoDB and local memory storage.
- [`lib/scamshield/terminal3.ts`](./lib/scamshield/terminal3.ts) - Terminal3 SDK proof.
- [`lib/scamshield/audit.ts`](./lib/scamshield/audit.ts) - HMAC audit signing.

## Current Limitations

- The fraud engine is deterministic and rule-based. It gives explainable safety guidance but does not replace a bank, platform, or law-enforcement verification path.
- OCR quality depends on image clarity and browser support.
- In-memory rate limiting is suitable for one runtime, but distributed production should use Redis, Valkey, or another shared rate-limit store.
- The app uses anonymous sessions, not full user accounts.
