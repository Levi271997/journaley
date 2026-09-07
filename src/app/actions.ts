"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSession,
  createUser,
  destroySession,
  findUserByName,
  getCurrentUser,
  hashPassword,
  verifyCredentials,
} from "@/lib/auth";
import { createEntry, deleteEntry as removeEntry, updateEntry } from "@/lib/entries";
import { MOODS } from "@/lib/moods";

export type FormState = { error?: string };

const USERNAME_RE = /^[\w.-]{3,32}$/;
const MOOD_VALUES = new Set<string>(MOODS.map((m) => m.value));

/* ------------------------------------------------------------------ auth */

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) return { error: "Enter your username and password." };

  const user = await verifyCredentials(username, password);
  if (!user) return { error: "Wrong username or password." };

  await createSession(user.id);
  redirect("/journal");
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!USERNAME_RE.test(username)) {
    return { error: "Username: 3–32 characters, letters, numbers, . _ - only." };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };
  if (findUserByName(username)) return { error: "That username is taken." };

  const id = createUser(username, await hashPassword(password));
  await createSession(id);
  redirect("/journal");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

/* --------------------------------------------------------------- entries */

function readEntryForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const body = String(formData.get("body") ?? "").trim().slice(0, 50_000);
  const rawMood = String(formData.get("mood") ?? "");
  const rawDate = String(formData.get("entry_date") ?? "").trim();

  return {
    title,
    body,
    mood: MOOD_VALUES.has(rawMood) ? rawMood : null,
    entryDate: /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : new Date().toISOString().slice(0, 10),
  };
}

export async function saveEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const input = readEntryForm(formData);
  if (!input.title && !input.body) {
    return { error: "An entry needs a title or some text." };
  }

  const rawId = String(formData.get("id") ?? "");
  let id: number;

  if (rawId) {
    id = Number(rawId);
    if (!Number.isInteger(id) || !updateEntry(id, user.id, input)) {
      return { error: "That entry no longer exists." };
    }
  } else {
    id = createEntry(user.id, input);
  }

  revalidatePath("/journal", "layout");
  redirect(`/journal/${id}?saved=1`);
}

export async function deleteEntry(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) removeEntry(id, user.id);

  revalidatePath("/journal", "layout");
  redirect("/journal");
}
