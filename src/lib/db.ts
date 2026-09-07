import "server-only";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

export type User = {
  id: number;
  username: string;
  created_at: string;
};

export type Entry = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  mood: string | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
};

/**
 * node:sqlite hands back rows with a null prototype, which React refuses to
 * pass from a Server Component to a Client Component. Copy them into plain
 * objects on the way out of the query layer.
 */
export function plain<T extends object>(row: T): T {
  return { ...row };
}

function open() {
  const file = process.env.DB_FILE ?? path.join(process.cwd(), "journal.db");
  const database = new DatabaseSync(file);

  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT NOT NULL DEFAULT '',
      body       TEXT NOT NULL DEFAULT '',
      mood       TEXT,
      entry_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_entries_user_date
      ON entries (user_id, entry_date DESC, id DESC);

    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
  `);

  return database;
}

// Hot reloading re-evaluates this module, so the handle is cached on
// globalThis to avoid piling up connections to the same file in development.
const globalForDb = globalThis as unknown as { journalDb?: DatabaseSync };

export const db = globalForDb.journalDb ?? open();

if (process.env.NODE_ENV !== "production") globalForDb.journalDb = db;
