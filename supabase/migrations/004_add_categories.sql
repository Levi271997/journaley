-- Custom categories.
--
-- Run once in the Supabase SQL Editor if your project predates them. New
-- projects get this from supabase/schema.sql already.
--
-- The app ships a short built-in list (see src/lib/categories.ts); this table
-- holds the ones a writer adds on top. `value` is the slug stored in
-- entries.category, so it is unique per user and never overlaps a built-in
-- value — the server action checks that before inserting.

create table if not exists public.categories (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  value      text not null,
  label      text not null,
  emoji      text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, value)
);

alter table public.categories enable row level security;

drop policy if exists "categories are private to their owner" on public.categories;
create policy "categories are private to their owner"
  on public.categories
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
