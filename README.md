# ScamShield AI

ScamShield AI is a Terminal3-protected fraud detection assistant for suspicious links, scam messages, QR/UPI payment payloads, screenshots, and uploaded evidence. It gives a user a risk score, severity, detected scam signals, a clear recommendation, session-scoped history, and signed audit rows for every agent action.

## What The App Does

- Scans links, emails, WhatsApp/SMS text, QR payloads, screenshots, and readable file evidence.
- Runs local browser OCR for image uploads with `tesseract.js` and QR payload detection where the browser supports `BarcodeDetector`.
- Classifies risk as Safe, Low, Medium, High, or Critical.
- Explains the main scam signals such as urgency, fake KYC/OTP language, suspicious domains, lookalike brands, UPI/payment payloads, and shortened URLs.
- Provides a chat flow for quick "is this safe?" questions.
- Stores history and audit logs per browser session instead of exposing one global history.
- Uses Terminal3 server-side proof for protected agent actions.
- Redacts sensitive Terminal3 operational fields before returning API responses.

## Pages

- `/` - Public landing page.
- `/dashboard` - Session scan metrics, live threat feed, and Terminal3 status.
- `/scan` - Paste or upload evidence and run the fraud analysis.
- `/chat` - Ask safety questions about links, senders, payments, or messages.
- `/history` - Session-scoped scan history.
- `/agents` - Agent identities and permission scopes.
- `/audit` - Session-scoped signed audit logs.

## How It Works

1. The app creates an HTTP-only session cookie for the browser.
2. The user submits evidence through the scan or chat flow.
3. The server validates body size, input type, rate limits, and session scope.
4. Terminal3 proof is collected server-side when configured.
5. ScamShield runs a multi-agent rule engine:
   - `ocr-agent` handles extracted text from screenshots/images/documents.
   - `url-agent` inspects URLs, domains, HTTPS usage, shorteners, and suspicious TLDs.
   - `fraud-agent` detects impersonation, urgency, OTP/KYC, payment pressure, and scam language.
   - `qr-agent` reviews QR and UPI payment payloads.
   - `risk-agent` combines evidence into a score, severity, category, and recommendation.
   - `chat-agent` routes safety questions through the same policy.
6. Each agent action is HMAC-signed and stored as an audit row.
7. MongoDB stores scans and audit logs by session. Local memory fallback is only for development unless explicitly enabled.

## Security And Production Notes

- API history and audit reads are scoped to the session cookie.
- Scan, chat, audit, and Terminal3 status endpoints include in-memory rate limiting.
- Production requires persistent MongoDB. If MongoDB is unavailable in production, the API returns an error instead of silently storing data in memory.
- `AUDIT_SIGNING_SECRET` or `T3N_API_KEY` is required for production audit signing.
- Terminal3 wallet address and raw usage data are not returned to the client.
- Request bodies and text inputs are capped to reduce abuse risk.
- TypeScript errors are no longer ignored during production builds.

## Local Setup

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

## Environment Variables

Copy `frontend/.env.local.example` to `frontend/.env.local`.

```bash
T3N_API_KEY=
T3N_DID=
T3N_ENVIRONMENT=testnet
MONGODB_URI=
MONGODB_DB=scamshield_ai
AUDIT_SIGNING_SECRET=
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
SCAMSHIELD_ALLOW_MEMORY_STORE=true
```

For production, set `NEXT_PUBLIC_SITE_URL` to the deployed URL, configure MongoDB, configure a signing secret, and leave `SCAMSHIELD_ALLOW_MEMORY_STORE` unset unless you intentionally want non-persistent demo storage.

## Commands

```bash
cd frontend
npm run lint
npm run build
npm run dev
```

`npm run lint` runs `tsc --noEmit`. `npm run build` performs the production Next.js build and now fails on TypeScript errors.

## Current Limitations

- The analyzer is deterministic and rule-based; it is explainable, but it is not a replacement for bank, platform, or law-enforcement verification.
- OCR quality depends on image clarity and the browser runtime.
- Rate limiting is in-memory, so a distributed production deployment should use a shared store such as Redis/Valkey for strict global enforcement.
- The current app uses anonymous browser sessions, not full user accounts.
