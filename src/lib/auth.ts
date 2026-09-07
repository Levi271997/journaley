import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db, type User } from "./db";

const COOKIE = "journal_session";
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

// Compared against when the username is unknown, so a wrong username costs the
// same time as a wrong password and the two cannot be told apart from outside.
const DUMMY_HASH = bcrypt.hashSync("placeholder-never-matches", BCRYPT_ROUNDS);

type UserRow = User & { password_hash: string };

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Verifies a username/password pair, or returns null if either is wrong. */
export async function verifyCredentials(username: string, password: string) {
  const row = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;

  const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) return null;

  return { id: row.id, username: row.username, created_at: row.created_at } satisfies User;
}

export function findUserByName(username: string) {
  return db.prepare("SELECT id FROM users WHERE username = ?").get(username) as
    | { id: number }
    | undefined;
}

export function createUser(username: string, passwordHash: string) {
  const { lastInsertRowid } = db
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, passwordHash);
  return Number(lastInsertRowid);
}

export async function createSession(userId: number) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;

  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    id,
    userId,
    expiresAt,
  );

  const store = await cookies();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession() {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;
  if (id) db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
  store.delete(COOKIE);
}

/** The signed-in user for this request, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;

  const row = db
    .prepare(
      `SELECT u.id, u.username, u.created_at, s.expires_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.id = ?`,
    )
    .get(id) as (User & { expires_at: number }) | undefined;

  if (!row) return null;
  if (row.expires_at <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
    return null;
  }

  return { id: row.id, username: row.username, created_at: row.created_at };
}
