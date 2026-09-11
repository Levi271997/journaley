"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  changeEmail,
  changePassword,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
  updateProfile,
} from "@/lib/auth";
import { removeAvatar, uploadAvatar } from "@/lib/avatars";
import {
  categoryEmoji,
  categoryValue,
  MAX_CATEGORY_LABEL_LENGTH,
  type CategoryOption,
} from "@/lib/categories";
import { createEntry, deleteEntry as removeEntry, updateEntry } from "@/lib/entries";
import { MOODS } from "@/lib/moods";
import { sanitizeEntryHtml } from "@/lib/sanitize";
import { parseTags } from "@/lib/tags";
import { addCategory, listCategories } from "@/lib/user-categories";

export type FormState = { error?: string; notice?: string };

const NAME_RE = /^[\w.\- ]{2,32}$/;
const MOOD_VALUES = new Set<string>(MOODS.map((m) => m.value));

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

/* --------------------------------------------------------------- profile */

export async function saveProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!NAME_RE.test(name)) {
    return { error: "Name: 2–32 characters, letters, numbers, spaces, . _ - only." };
  }

  const picked = formData.get("avatar");
  const file = picked instanceof File && picked.size > 0 ? picked : null;

  let avatar = user.avatar_url;
  if (file) {
    const upload = await uploadAvatar(user.id, file);
    if ("error" in upload) return { error: upload.error };
    avatar = upload.url;
  } else if (formData.get("remove_avatar") === "1") {
    avatar = null;
  }

  const error = await updateProfile(name, avatar);
  if (error) return { error };

  // The old file is unlinked only once the account has stopped pointing at it,
  // so a failure between the two leaves a stray file rather than a broken img.
  if (user.avatar_url && user.avatar_url !== avatar) {
    await removeAvatar(user.id, user.avatar_url);
  }

  revalidatePath("/journal", "layout");
  return { notice: "Profile updated." };
}

export async function saveEmail(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const email = String(formData.get("email") ?? "").trim();

  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (email.toLowerCase() === user.email.toLowerCase()) {
    return { error: "That is already your email address." };
  }

  const error = await changeEmail(email);
  if (error) return { error };

  return {
    notice: `Almost there — open the link we sent to ${email} to finish the change.`,
  };
}

export async function savePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current) return { error: "Enter your current password." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };
  if (password === current) return { error: "That is already your password." };

  const error = await changePassword(current, password);
  if (error) return { error };

  return { notice: "Password changed." };
}

/* ------------------------------------------------------------ categories */

export type CategoryState = { error?: string; category?: CategoryOption };

/**
 * Adds one of the writer's own categories. Called straight from the editor
 * rather than through a form, since it sits inside the entry form and forms
 * do not nest; the new option is handed back so the editor can select it.
 */
export async function createCategory(
  rawLabel: string,
  rawEmoji: string,
): Promise<CategoryState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const label = String(rawLabel ?? "").trim().slice(0, MAX_CATEGORY_LABEL_LENGTH);
  const value = categoryValue(label);
  if (!value) {
    return { error: "A category needs a name with at least one letter or number." };
  }

  const result = await addCategory(user.id, {
    value,
    label,
    emoji: categoryEmoji(String(rawEmoji ?? "").slice(0, 32)),
  });
  if ("error" in result) return result;

  revalidatePath("/journal", "layout");
  return { category: result.category };
}

/* --------------------------------------------------------------- entries */

async function readEntryForm(userId: string, formData: FormData) {
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

  // Built-in or the user's own; the lookup is skipped when no category was
  // picked, which is most saves.
  const category =
    rawCategory &&
    (await listCategories(userId)).some((option) => option.value === rawCategory)
      ? rawCategory
      : null;

  return {
    title,
    body,
    bodyHtml,
    mood: MOOD_VALUES.has(rawMood) ? rawMood : null,
    category,
    tags,
    entryDate: /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : new Date().toISOString().slice(0, 10),
  };
}

export async function saveEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const input = await readEntryForm(user.id, formData);
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
