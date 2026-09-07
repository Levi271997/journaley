"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, signIn, signOut, signUp } from "@/lib/auth";
import { createEntry, deleteEntry as removeEntry, updateEntry } from "@/lib/entries";
import { CATEGORIES } from "@/lib/categories";
import { MOODS } from "@/lib/moods";
import { sanitizeEntryHtml } from "@/lib/sanitize";
import { parseTags } from "@/lib/tags";

export type FormState = { error?: string; notice?: string };

const NAME_RE = /^[\w.\- ]{2,32}$/;
const MOOD_VALUES = new Set<string>(MOODS.map((m) => m.value));
const CATEGORY_VALUES = new Set<string>(CATEGORIES.map((c) => c.value));

/* ------------------------------------------------------------------ auth */

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const error = await signIn(email, password);
  if (error) return { error };

  redirect("/journal");
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!NAME_RE.test(name)) {
    return { error: "Name: 2–32 characters, letters, numbers, spaces, . _ - only." };
  }
  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const result = await signUp(email, password, name);

  if (result.status === "error") return { error: result.message };
  if (result.status === "confirm-email") {
    return { notice: `Almost there — open the confirmation link we sent to ${email}.` };
  }

  redirect("/journal");
}

export async function logout() {
  await signOut();
  redirect("/login");
}

/* --------------------------------------------------------------- entries */

function readEntryForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const body = String(formData.get("body") ?? "").trim().slice(0, 50_000);
  const rawMood = String(formData.get("mood") ?? "");
  const rawCategory = String(formData.get("category") ?? "");
  const rawDate = String(formData.get("entry_date") ?? "").trim();

  // parseTags is the same normaliser the editor runs as you type; running it
  // again here is what makes the stored slugs trustworthy.
  const tags = parseTags(String(formData.get("tags") ?? "").slice(0, 1_000));

  // Trimmed before sanitizing, not after: the sanitizer closes whatever tags
  // the cut left open, so the stored markup is always well formed.
  const bodyHtml = sanitizeEntryHtml(
    String(formData.get("body_html") ?? "").slice(0, 200_000),
  );

  return {
    title,
    body,
    bodyHtml,
    mood: MOOD_VALUES.has(rawMood) ? rawMood : null,
    category: CATEGORY_VALUES.has(rawCategory) ? rawCategory : null,
    tags,
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
    if (!Number.isInteger(id) || !(await updateEntry(id, user.id, input))) {
      return { error: "That entry no longer exists." };
    }
  } else {
    id = await createEntry(user.id, input);
  }

  revalidatePath("/journal", "layout");
  redirect(`/journal/${id}?saved=1`);
}

export async function deleteEntry(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) await removeEntry(id, user.id);

  revalidatePath("/journal", "layout");

  // Deleting from the sidebar should leave you on whatever you were reading,
  // unless that is the entry you just deleted. The prefix check keeps the
  // form from being used to bounce anyone off the site.
  const from = String(formData.get("from") ?? "");
  const stayPut = from.startsWith("/journal") && from !== `/journal/${id}`;

  redirect(stayPut ? from : "/journal");
}
