# Nidaan AI

**Multilingual, voice-first health triage for rural India** — powered by AI, delivered over WhatsApp.

Nidaan AI helps patients in rural India describe symptoms by voice in their own language, runs structured clinical triage with red-flag detection, and connects them to the nearest appropriate health facility via ABDM's Health Facility Registry.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS |
| Voice & Translation | Sarvam AI (STT, TTS, translation) |
| Clinical Reasoning | Claude (Anthropic) |
| Messaging | WhatsApp Business API via Gupshup |
| Facility Search | ABDM Health Facility Registry (HFR) |

## Project Structure

```
/app
  /api
    /webhook/whatsapp/route.ts  — incoming WhatsApp message handler
    /triage/route.ts            — symptom analysis endpoint
    /facility-lookup/route.ts   — ABDM HFR facility search
  /dashboard
    /page.tsx                   — overview with metrics
    /conversations/page.tsx     — conversation logs
  /page.tsx                     — landing page
/lib
  /sarvam.ts                    — Sarvam AI API wrapper (STT, TTS, translation)
  /claude.ts                    — Claude API wrapper for clinical reasoning
  /whatsapp.ts                  — WhatsApp Business API helpers (Gupshup)
  /abdm.ts                      — ABDM HFR API wrapper
  /triage-engine.ts             — clinical decision tree + severity scoring
  /supabase.ts                  — Supabase client
/data
  /conditions.json              — 20 conditions with symptom mappings & severity rules
/types
  /index.ts                     — TypeScript types
/supabase
  /schema.sql                   — Database schema for Supabase
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `SARVAM_API_KEY` | Sarvam AI API key for STT, TTS, and translation |
| `CLAUDE_API_KEY` | Anthropic API key for clinical reasoning |
| `WHATSAPP_API_KEY` | Gupshup WhatsApp Business API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `ABDM_CLIENT_ID` | ABDM HFR API client ID |
| `ABDM_CLIENT_SECRET` | ABDM HFR API client secret |

### 3. Set up the database

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor to create the required tables:

- `patients`
- `conversations`
- `messages`
- `triage_results`
- `facilities_cache`

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## Key Modules

- **Triage Engine** (`lib/triage-engine.ts`): Matches symptoms against 20 common conditions, detects red flags, computes severity, and routes to the appropriate specialty.
- **Sarvam AI** (`lib/sarvam.ts`): Handles speech-to-text, text-to-speech, and translation across 10+ Indian languages.
- **Claude** (`lib/claude.ts`): Provides clinical reasoning — symptom extraction, follow-up question generation, and patient-friendly advice.
- **ABDM HFR** (`lib/abdm.ts`): Searches India's Health Facility Registry to find the nearest PHC/CHC/hospital by specialty and location.
- **WhatsApp** (`lib/whatsapp.ts`): Send and receive messages via Gupshup's WhatsApp Business API.

## License

Private — not open source.
