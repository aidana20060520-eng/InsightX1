-- InsightX v0.3: contact form submissions
-- Run this in your Supabase SQL editor AFTER 002_profile_and_chat.sql.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  user_id text,                                    -- Clerk user ID if signed in
  user_agent text,
  ip_hash text,                                     -- sha256 of ip, for rate-limit context
  created_at timestamptz not null default now(),
  resolved boolean not null default false,         -- you can flip this in the dashboard
  notes text                                        -- your private notes
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages(created_at desc);

create index if not exists contact_messages_resolved_idx
  on public.contact_messages(resolved, created_at desc);

-- We use the service_role key server-side so RLS isn't required for our
-- inserts. We still enable RLS to lock the table down from the anon role.
alter table public.contact_messages enable row level security;
