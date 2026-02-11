-- ============================================================
-- Nidaan AI: COMPLETE FIX migration
-- Run this in Supabase SQL Editor to fix all issues.
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS).
-- ============================================================

-- 1. Add missing columns if they don't exist
DO $$
BEGIN
  -- Add 'messages' JSONB column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'messages'
  ) THEN
    ALTER TABLE conversations ADD COLUMN messages jsonb NOT NULL DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added messages column';
  END IF;

  -- Add 'created_at' timestamp column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
    RAISE NOTICE 'Added created_at column';
  END IF;

  -- Add 'updated_at' timestamp column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
    RAISE NOTICE 'Added updated_at column';
  END IF;
END $$;

-- 2. Fix status constraint to allow 'emergency'
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_status_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_status_check
  CHECK (status IN ('active', 'completed', 'emergency'));

-- 3. Create indexes (safe: IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- 4. Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger (safe to re-run)
DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5. Fix RLS: disable restrictive policies, allow full access
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow all access to conversations" ON conversations;
DROP POLICY IF EXISTS "Allow anon select" ON conversations;
DROP POLICY IF EXISTS "Allow anon insert" ON conversations;
DROP POLICY IF EXISTS "Allow anon update" ON conversations;
DROP POLICY IF EXISTS "Allow anon delete" ON conversations;

-- Create permissive policies for anon (dashboard + webhook)
CREATE POLICY "Allow anon select" ON conversations FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON conversations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON conversations FOR DELETE USING (true);

-- ============================================================
-- DONE! Your conversations table now has:
--   id (uuid), phone_number, contact_name, messages (jsonb),
--   status (active/completed/emergency), detected_language,
--   last_triage (jsonb), created_at, updated_at
--
-- RLS is enabled with full access for anon key.
-- updated_at auto-updates on every row change.
-- ============================================================
