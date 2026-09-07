# 📔 Journaley

A private journal for your own days — write an entry, tag it with a mood, and find it
again later. Everything lives on your own machine in a single SQLite file.

Built with **Next.js 16** (App Router, Server Actions), **React 19**, **Tailwind CSS v4**
and **TypeScript**.

## Features

- **Accounts with a real login** — passwords hashed with bcrypt (12 rounds), sessions
  stored server-side and handed out as an httpOnly cookie.
- **Write, edit and delete entries** — title, free text, a date and an optional mood.
- **Search** across titles and entry text as you type.
- **Your entries are yours** — every query is scoped to the signed-in user, so one
  account can never read another's pages.
- **Warm, paper-like design** that follows your system light/dark setting.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The first time you visit, choose **Create one** to make
your account — after that you just sign in.

A `journal.db` SQLite file is created next to the project on first run. It is
git-ignored; back it up if the entries matter to you.

### Production

```bash
npm run build
npm start
```

There is no signing secret to configure — sessions are random 256-bit ids kept in the
database. Do serve the app over HTTPS in production, though: the session cookie is
marked `secure` whenever `NODE_ENV=production`, and browsers drop secure cookies on
plain HTTP.

## Configuration

| Variable  | Default              | What it does                        |
| --------- | -------------------- | ----------------------------------- |
| `DB_FILE` | `./journal.db`       | Where the SQLite database is stored |
| `PORT`    | `3000`               | Port the server listens on          |

## How it is put together

```
src/
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
    db.ts                 SQLite schema and connection (node:sqlite, no native build)
    auth.ts               Password hashing, sessions, current user
    entries.ts            Entry queries, all scoped by user id
    moods.ts              The mood list, shared by client and server
```

The database uses Node's built-in `node:sqlite`, so there is nothing to compile — but it
does require **Node 22.5 or newer** (Node 24 recommended).

## Security notes

- Passwords are never stored, only bcrypt hashes.
- Sign-in takes the same amount of time for an unknown username as for a wrong password,
  so the form does not leak which usernames exist.
- The session id is regenerated on sign-in and sign-up, and deleted server-side on sign
  out.
- Entry reads and writes always carry the user id in the `WHERE` clause; asking for
  someone else's entry returns a 404.
