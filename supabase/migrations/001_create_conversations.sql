-- Nidaan AI: Conversations table for live dashboard
-- Run this in your Supabase SQL editor

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  contact_name text default 'Unknown',
  messages jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'completed')),
  detected_language text default 'en-IN',
  last_triage jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for quick lookup by phone number
create index if not exists idx_conversations_phone on conversations(phone_number);

-- Index for dashboard sorting by most recent
create index if not exists idx_conversations_updated on conversations(updated_at desc);

-- Index for status filtering
create index if not exists idx_conversations_status on conversations(status);

-- Auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger conversations_updated_at
  before update on conversations
  for each row
  execute function update_updated_at();

-- Enable Row Level Security (but allow all for now via anon key)
alter table conversations enable row level security;

-- Policy: allow all operations for authenticated and anon users (for dashboard)
create policy "Allow all access to conversations"
  on conversations for all
  using (true)
  with check (true);
