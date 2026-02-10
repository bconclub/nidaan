-- Nidaan AI — Supabase Schema
-- Run this in the Supabase SQL editor to create the required tables.

-- ── Patients ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  TEXT UNIQUE NOT NULL,
  name          TEXT,
  age           INTEGER,
  gender        TEXT CHECK (gender IN ('male', 'female', 'other')),
  language      TEXT NOT NULL DEFAULT 'hi',
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  district      TEXT,
  state         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Conversations ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'awaiting_input', 'triaged', 'referred', 'closed')),
  language        TEXT NOT NULL DEFAULT 'hi',
  chief_complaint TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at       TIMESTAMPTZ
);

CREATE INDEX idx_conversations_patient ON conversations(patient_id);
CREATE INDEX idx_conversations_status  ON conversations(status);

-- ── Messages ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID NOT NULL REFERENCES conversations(id),
  role                TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  type                TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'audio', 'image')),
  content             TEXT NOT NULL,
  audio_url           TEXT,
  translated_content  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- ── Triage Results ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS triage_results (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id         UUID NOT NULL REFERENCES conversations(id),
  matched_conditions      JSONB NOT NULL DEFAULT '[]',
  symptoms_extracted      JSONB NOT NULL DEFAULT '[]',
  severity                TEXT NOT NULL CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
  recommended_specialty   TEXT NOT NULL DEFAULT 'general',
  recommended_facility_id UUID,
  advice_given            TEXT NOT NULL DEFAULT '',
  red_flags_detected      JSONB NOT NULL DEFAULT '[]',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_triage_conversation ON triage_results(conversation_id);

-- ── Facilities Cache ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS facilities_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hfr_id      TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT CHECK (type IN ('PHC', 'CHC', 'DH', 'SDH', 'clinic', 'hospital')),
  specialties JSONB NOT NULL DEFAULT '[]',
  address     TEXT,
  district    TEXT,
  state       TEXT,
  pincode     TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  phone       TEXT,
  cached_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_facilities_district ON facilities_cache(district);
CREATE INDEX idx_facilities_hfr      ON facilities_cache(hfr_id);

-- ── Row-Level Security (enable later) ───────────────────────────────

ALTER TABLE patients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_results    ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities_cache  ENABLE ROW LEVEL SECURITY;
