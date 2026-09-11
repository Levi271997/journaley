# 📔 Journaley

A private journal for your own days — write an entry, tag it with a mood, and find it
again later. Accounts and entries live in your own [Supabase](https://supabase.com)
project.

Built with **Next.js 16** (App Router, Server Actions), **React 19**, **Tailwind CSS v4**,
**TypeScript** and **Supabase** (Auth + Postgres).

## Features

- **Accounts with a real login** — email and password handled by Supabase Auth, with
  session cookies refreshed automatically on every request.
- **Write, edit and delete entries** — title, free text, a date and an optional mood.
- **Categories and tags** — file an entry under one category and give it as many of
  your own tags as you like, then narrow the sidebar to either. Seven categories
  come built in; add your own from the editor's category picker.
- **Search** across titles and entry text as you type.
- **Profile settings** — a display name and picture, and changes of email address or
  password, all from `/journal/settings`.
- **Your entries are yours** — Row Level Security in Postgres means one account
  physically cannot read another's pages, even if the app had a bug.
- **Warm, paper-like design** that follows your system light/dark setting.

## Getting started

You need a Supabase project (the free tier is plenty).

1. **Create the tables.** In the Supabase dashboard open **SQL Editor → New query**, paste
   [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the `entries`
   and `categories` tables, their indexes, the `updated_at` trigger and the RLS
   policies.

   This also creates the `avatars` storage bucket that profile pictures live in.

   If your project is older than a feature, the files in
   [`supabase/migrations/`](supabase/migrations/) add it to an existing project — run
   `002_add_tags_and_category.sql` for the category and tag columns,
   `003_add_avatars_bucket.sql` for profile pictures, and `004_add_categories.sql`
   for your own categories. A project created from `schema.sql` today already has
   all three.

2. **Add your credentials.** Copy `.env.example` to `.env.local` and fill in the
   two values from the dashboard's **Connect** button (App Frameworks → Next.js):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

3. **Decide about email confirmation.** Under **Authentication → Sign In / Providers →
   Email**, turning *Confirm email* off lets a new account sign in immediately, which is
   the quickest way to try the app locally.

   Leaving it on is what you want in production, and then two settings matter:

   - **Authentication → URL Configuration** — set **Site URL** to where the app runs
     (`http://localhost:3000` in development, your real origin in production) and add
     `<your origin>/**` to **Redirect URLs**.
   - **Authentication → Emails → Confirm signup** — replace the default
     `{{ .ConfirmationURL }}` link with:

     ```
     {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
     ```

     The default template uses the implicit flow, which returns the token in the URL
     fragment where server-side code cannot read it. The `token_hash` form is handled by
     [`src/app/auth/confirm/route.ts`](src/app/auth/confirm/route.ts), which trades it for
     a session cookie and drops the reader in their journal.

   - **Authentication → Emails → Change Email Address** — the same rewrite, with
     `&type=email_change`, so the address change offered in profile settings can be
     confirmed. The route handles password-recovery links the same way.

4. **Run it.**

   ```bash
   npm install
   npm run dev
   ```

Open <http://localhost:3000> and choose **Create one** to make your account.

### Production

```bash
npm run build
npm start
```

Set the same two environment variables wherever you deploy. Serve over HTTPS: the auth
cookies are marked `secure` in production and browsers drop those on plain HTTP.

## Configuration

| Variable                               | What it does                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Your project URL                                                                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The public key. `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works — older projects use that name |
| `PORT`                                 | Port the server listens on (default `3000`)                                             |

Never put the `service_role` key in a `NEXT_PUBLIC_` variable: it bypasses Row Level
Security and is shipped to the browser.

## How it is put together

```
src/
  proxy.ts                Refreshes the Supabase session cookie on every request
  app/
    actions.ts            Server Actions: sign in/up/out, save + delete entries
    page.tsx              Sends you to /journal or /login
    login/page.tsx        Sign-in and account creation
    journal/page.tsx      Landing pane (empty state / greeting)
    journal/new/page.tsx  Blank editor
    journal/[id]/page.tsx Editor for one entry
  components/
    auth-form.tsx         Sign-in / create-account form
    journal-shell.tsx     Top bar, sidebar and auth guard
    entry-list.tsx        Sidebar list with the active entry highlighted
    entry-editor.tsx      Title, body, date, mood, save and delete
    search-box.tsx        Debounced search box
  lib/
    supabase/env.ts       Reads and validates the project credentials
    supabase/server.ts    Per-request Supabase client bound to the cookies
    db.ts                 Row and user types (no queries — types only)
    auth.ts               Sign in/up/out and the current user
    entries.ts            Entry queries, all scoped by user id
    moods.ts              The mood list, shared by client and server
supabase/
  schema.sql              The entries table, index, trigger and RLS policy
```

`src/proxy.ts` is the file Next.js 14/15 called `middleware.ts` — Next.js 16 renamed the
convention to Proxy. Supabase's published guides still show the old name.

## Security notes

- Passwords never reach this codebase: Supabase Auth stores and verifies them.
- Row Level Security is the real boundary. Every statement also carries the user id in
  its filter as a second lock, so a mistake in the policies cannot quietly expose one
  person's journal to another.
- Asking for someone else's entry returns a 404.
- The session is validated with `auth.getUser()`, which checks the token against the auth
  server, rather than trusting whatever the cookie claims.
- Search terms are stripped of the characters PostgREST uses as filter syntax, so a
  search can only change what is matched, never the shape of the query.
