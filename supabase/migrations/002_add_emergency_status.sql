-- Nidaan AI: Add 'emergency' to conversations status constraint
-- Run this in your Supabase SQL editor (table already exists)

-- Drop the existing status check constraint and re-add with 'emergency'
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_status_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_status_check
  CHECK (status IN ('active', 'completed', 'emergency'));
