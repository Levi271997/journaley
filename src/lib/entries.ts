import "server-only";
import { db, plain, type Entry } from "./db";

export type EntrySummary = Pick<
  Entry,
  "id" | "title" | "body" | "mood" | "entry_date" | "updated_at"
>;

export function listEntries(userId: number, search = ""): EntrySummary[] {
  const q = search.trim();
  return db
    .prepare(
      `SELECT id, title, body, mood, entry_date, updated_at
         FROM entries
        WHERE user_id = ?
          AND (? = '' OR title LIKE '%' || ? || '%' OR body LIKE '%' || ? || '%')
        ORDER BY entry_date DESC, id DESC`,
    )
    .all(userId, q, q, q)
    .map((row) => plain(row as EntrySummary));
}

export function getEntry(id: number, userId: number): Entry | null {
  const row = db
    .prepare("SELECT * FROM entries WHERE id = ? AND user_id = ?")
    .get(id, userId) as Entry | undefined;
  return row ? plain(row) : null;
}

export function createEntry(
  userId: number,
  input: { title: string; body: string; mood: string | null; entryDate: string },
) {
  const { lastInsertRowid } = db
    .prepare(
      "INSERT INTO entries (user_id, title, body, mood, entry_date) VALUES (?, ?, ?, ?, ?)",
    )
    .run(userId, input.title, input.body, input.mood, input.entryDate);
  return Number(lastInsertRowid);
}

export function updateEntry(
  id: number,
  userId: number,
  input: { title: string; body: string; mood: string | null; entryDate: string },
) {
  const { changes } = db
    .prepare(
      `UPDATE entries
          SET title = ?, body = ?, mood = ?, entry_date = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?`,
    )
    .run(input.title, input.body, input.mood, input.entryDate, id, userId);
  return Number(changes) > 0;
}

export function deleteEntry(id: number, userId: number) {
  const { changes } = db
    .prepare("DELETE FROM entries WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return Number(changes) > 0;
}

export function countEntries(userId: number) {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM entries WHERE user_id = ?")
    .get(userId) as { n: number };
  return Number(row.n);
}
