-- InsightX v0.2: user profiles + persistent chat history
-- Run this in your Supabase SQL editor AFTER the initial schema.sql.

-- ============================================================
-- User profile — used to personalize AI responses ("about you")
-- ============================================================
create table if not exists public.user_profiles (
  user_id text primary key,                  -- Clerk user ID
  display_name text,
  role text,                                  -- e.g. "Designer", "Founder", "Student"
  about text,                                 -- short free-form bio
  goals text,                                 -- what the user is trying to accomplish
  preferred_tone text not null default 'friendly'
    check (preferred_tone in ('friendly', 'concise', 'professional')),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_profiles_updated_at on public.user_profiles;
create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute procedure public.set_updated_at();

alter table public.user_profiles enable row level security;

-- ============================================================
-- Chat sessions — one row per conversation
-- ============================================================
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_idx
  on public.chat_sessions(user_id, updated_at desc);

drop trigger if exists chat_sessions_updated_at on public.chat_sessions;
create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute procedure public.set_updated_at();

alter table public.chat_sessions enable row level security;

-- ============================================================
-- Chat messages — append-only message log per session
-- ============================================================
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_idx
  on public.chat_messages(session_id, created_at asc);

alter table public.chat_messages enable row level security;

-- All access goes through service role (server-side). RLS is enabled but
-- left without policies, which is the secure default — only the service
-- role bypasses RLS.
