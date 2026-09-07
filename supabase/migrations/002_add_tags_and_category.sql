-- Categories and tags for entries.
--
-- Run once in the Supabase SQL Editor if your project predates them. New
-- projects get this from supabase/schema.sql already.
--
-- `category` is one value from the app's fixed list (see src/lib/categories.ts);
-- `tags` are the writer's own labels, normalised to lowercase slugs so that
-- "Slow Morning" and "slow-morning" cannot drift into two different tags.

alter table public.entries
  add column if not exists category text,
  add column if not exists tags     text[] not null default '{}';

-- Filtering by tag is a containment test, which is what GIN indexes are for.
create index if not exists idx_entries_tags
  on public.entries using gin (tags);

create index if not exists idx_entries_user_category
  on public.entries (user_id, category);
