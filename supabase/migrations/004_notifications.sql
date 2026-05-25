-- InsightX v0.4: in-app notifications
-- Run this in your Supabase SQL editor AFTER 003_contact_messages.sql.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,                                -- Clerk user ID
  type text not null check (type in (
    'sync_complete',     -- Notion sync finished successfully
    'sync_error',        -- Notion sync failed
    'first_connect',     -- Welcome notification on first Notion connect
    'insight',           -- AI noticed something noteworthy
    'system'             -- Generic platform message
  )),
  title text not null,
  body text,                                            -- optional plain-text detail
  link text,                                            -- optional in-app link, e.g. '/dashboard'
  read_at timestamptz,                                  -- null = unread
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications(user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, read_at)
  where read_at is null;

-- Cleanup helper: notifications older than 60 days can be removed by a
-- future cron. We don't auto-prune here, just enable the query.
create index if not exists notifications_created_at_idx
  on public.notifications(created_at);

-- All access goes through service role server-side. RLS enabled with no
-- policies = locked down to service role only.
alter table public.notifications enable row level security;
