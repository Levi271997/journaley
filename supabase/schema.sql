-- Journaley schema for Supabase Postgres.
--
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Accounts themselves live in Supabase's own `auth.users` table, so the only
-- table this app owns is `entries`.

create table if not exists public.entries (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null default '',
  body       text not null default '',
  mood       text,
  entry_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_entries_user_date
  on public.entries (user_id, entry_date desc, id desc);

-- updated_at is maintained in the database so every write path gets it,
-- including edits made by hand in the dashboard.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists entries_touch_updated_at on public.entries;
create trigger entries_touch_updated_at
  before update on public.entries
  for each row execute function public.touch_updated_at();

-- Row Level Security: a signed-in user can only ever see or change their own
-- rows. This is what replaces the manual `WHERE user_id = ?` guard the old
-- SQLite version relied on.
alter table public.entries enable row level security;

drop policy if exists "entries are private to their owner" on public.entries;
create policy "entries are private to their owner"
  on public.entries
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Rich text: body_html holds the editor's markup, while body keeps a
-- plain-text copy for searching and for the sidebar previews.
alter table public.entries
  add column if not exists body_html text not null default '';

-- Labels: `category` is one value from the app's fixed list, `tags` are the
-- writer's own, stored as lowercase slugs.
alter table public.entries
  add column if not exists category text,
  add column if not exists tags     text[] not null default '{}';

create index if not exists idx_entries_tags
  on public.entries using gin (tags);

create index if not exists idx_entries_user_category
  on public.entries (user_id, category);
