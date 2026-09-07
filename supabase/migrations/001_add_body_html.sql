-- Rich text for entries.
--
-- Run once in the Supabase SQL Editor if your project predates the WYSIWYG
-- editor. New projects get this from supabase/schema.sql already.
--
-- `body` stays the plain-text copy: it is what search matches on and what the
-- sidebar previews, and keeping it free of markup is what makes both behave.

alter table public.entries
  add column if not exists body_html text not null default '';
