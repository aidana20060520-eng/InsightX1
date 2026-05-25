-- InsightX Notion integration schema
-- Run this in your Supabase SQL editor (or via the Supabase CLI)

-- Notion workspace connections (one per user/workspace pair)
create table if not exists public.notion_connections (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  workspace_id text not null,
  workspace_name text,
  workspace_icon text,
  bot_id text,
  -- AES-256-GCM encrypted access_token: iv:authTag:ciphertext (hex-encoded segments)
  access_token_encrypted text not null,
  owner_user_id text,
  status text not null default 'connected' check (status in ('connected', 'syncing', 'error', 'disconnected')),
  last_sync_at timestamptz,
  last_sync_cursor text,
  last_error text,
  pages_synced int not null default 0,
  databases_synced int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, workspace_id)
);

create index if not exists notion_connections_user_idx
  on public.notion_connections(user_id);

-- Pages mirrored from Notion
create table if not exists public.notion_pages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.notion_connections(id) on delete cascade,
  notion_id text not null,
  parent_id text,
  parent_type text,
  title text,
  url text,
  icon text,
  archived boolean not null default false,
  -- Free-form metadata extracted from Notion (cover, page_id, public_url, etc.)
  metadata jsonb not null default '{}'::jsonb,
  notion_created_at timestamptz,
  notion_last_edited_at timestamptz,
  synced_at timestamptz not null default now(),
  unique(connection_id, notion_id)
);

create index if not exists notion_pages_connection_idx
  on public.notion_pages(connection_id);
create index if not exists notion_pages_last_edited_idx
  on public.notion_pages(notion_last_edited_at desc);

-- Databases mirrored from Notion
create table if not exists public.notion_databases (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.notion_connections(id) on delete cascade,
  notion_id text not null,
  parent_id text,
  parent_type text,
  title text,
  url text,
  icon text,
  archived boolean not null default false,
  properties jsonb not null default '{}'::jsonb,
  notion_created_at timestamptz,
  notion_last_edited_at timestamptz,
  synced_at timestamptz not null default now(),
  unique(connection_id, notion_id)
);

create index if not exists notion_databases_connection_idx
  on public.notion_databases(connection_id);

-- Tasks extracted from Notion databases (rows in any DB tagged as "tasks")
create table if not exists public.notion_tasks (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.notion_connections(id) on delete cascade,
  database_id uuid not null references public.notion_databases(id) on delete cascade,
  notion_id text not null,
  title text,
  status text,
  assignee text,
  due_date timestamptz,
  completed_at timestamptz,
  url text,
  raw_properties jsonb not null default '{}'::jsonb,
  notion_created_at timestamptz,
  notion_last_edited_at timestamptz,
  synced_at timestamptz not null default now(),
  unique(connection_id, notion_id)
);

create index if not exists notion_tasks_connection_idx
  on public.notion_tasks(connection_id);
create index if not exists notion_tasks_status_idx
  on public.notion_tasks(status);
create index if not exists notion_tasks_due_idx
  on public.notion_tasks(due_date);

-- Sync activity log (audit trail of every sync run)
create table if not exists public.notion_sync_runs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.notion_connections(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  pages_added int not null default 0,
  pages_updated int not null default 0,
  databases_added int not null default 0,
  databases_updated int not null default 0,
  error_message text
);

create index if not exists notion_sync_runs_connection_idx
  on public.notion_sync_runs(connection_id, started_at desc);

-- Update the updated_at timestamp on connection changes
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists notion_connections_updated_at on public.notion_connections;
create trigger notion_connections_updated_at
  before update on public.notion_connections
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.notion_connections enable row level security;
alter table public.notion_pages enable row level security;
alter table public.notion_databases enable row level security;
alter table public.notion_tasks enable row level security;
alter table public.notion_sync_runs enable row level security;

-- NOTE: All access is gated through the server-side service role.
-- If you wire up Clerk -> Supabase JWT, you can add user-scoped policies like:
--
--   create policy "Users see own connections"
--     on public.notion_connections for select
--     using (user_id = auth.jwt() ->> 'sub');
