"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteEntry, saveEntry, type FormState } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import type { Entry } from "@/lib/db";
import { MOODS } from "@/lib/moods";
import { normalizeTag } from "@/lib/tags";
import { ConfirmDialog } from "./confirm-dialog";
import { RichTextEditor } from "./rich-text-editor";
import { TagInput } from "./tag-input";

const EMPTY: FormState = {};

/**
 * Entries written before the rich editor hold plain text. Their newlines
 * become paragraphs so they open as the prose they were, not one run-on block.
 */
function htmlFromPlainText(text: string) {
  if (!text.trim()) return "";

  return text
    .split(/\n{2,}|\n/)
    .filter((line) => line.trim())
    .map(
      (line) =>
        `<p>${line
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</p>`,
    )
    .join("");
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn bg-accent text-paper hover:opacity-90"
    >
      {pending ? "Saving…" : "Save entry"}
    </button>
  );
}

export function EntryEditor({
  entry,
  justSaved = false,
}: {
  entry?: Entry;
  justSaved?: boolean;
}) {
  const [state, formAction] = useActionState(saveEntry, EMPTY);
  const today = new Date().toISOString().slice(0, 10);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const deleteSubmitRef = useRef<HTMLButtonElement>(null);

  // Controlled fields: React clears an uncontrolled form once its action
  // settles, which would throw away a whole entry if the save came back with
  // an error.
  const [title, setTitle] = useState(entry?.title ?? "");
  const [mood, setMood] = useState(entry?.mood ?? "");
  const [category, setCategory] = useState(entry?.category ?? "");
  const [date, setDate] = useState(entry?.entry_date ?? today);

  // The draft is whatever has been typed but not yet turned into a chip. It
  // rides along in the hidden field so saving mid-word never loses a tag.
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const tagField = [...tags, normalizeTag(tagDraft)].filter(Boolean).join(",");

  // The editor keeps both shapes: HTML is what gets stored and reopened, and
  // the plain text is what search and the sidebar previews read.
  const initialHtml = entry?.body_html || htmlFromPlainText(entry?.body ?? "");
  const [html, setHtml] = useState(initialHtml);
  const [text, setText] = useState(entry?.body ?? "");

  return (
    // The date row, title, tags and buttons stay put; only the entry text
    // scrolls, so the save button never walks off the bottom of a long day.
    <article
      className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8
                 lg:flex lg:h-full lg:flex-col lg:overflow-hidden"
    >
      <form
        ref={formRef}
        action={formAction}
        className="space-y-5 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
      >
        {entry && <input type="hidden" name="id" value={entry.id} />}
        <input type="hidden" name="body_html" value={html} />
        <input type="hidden" name="body" value={text} />
        <input type="hidden" name="tags" value={tagField} />

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            name="entry_date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-label="Entry date"
            className="field w-auto py-1.5 text-sm"
          />

          <select
            name="mood"
            value={mood}
            onChange={(event) => setMood(event.target.value)}
            aria-label="Mood"
            className="field w-auto py-1.5 text-sm"
          >
            <option value="">Mood…</option>
            {MOODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.emoji} {option.label}
              </option>
            ))}
          </select>

          <select
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Category"
            className="field w-auto py-1.5 text-sm"
          >
            <option value="">Category…</option>
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.emoji} {option.label}
              </option>
            ))}
          </select>

          {justSaved && (
            <span className="text-sm text-muted" role="status">
              Saved
            </span>
          )}
        </div>

        <input
          type="text"
          name="title"
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          aria-label="Title"
          className="w-full border-0 bg-transparent p-0 font-serif text-2xl
                     placeholder:text-muted/60 focus:outline-none sm:text-3xl"
        />

        <RichTextEditor
          initialHtml={initialHtml}
          placeholder="How was your day?"
          onChange={(nextHtml, nextText) => {
            setHtml(nextHtml);
            setText(nextText);
          }}
        />

        <TagInput
          tags={tags}
          draft={tagDraft}
          onTagsChange={setTags}
          onDraftChange={setTagDraft}
        />

        {state.error && (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <SaveButton />
          {entry && (
            <>
              {/* The real submitter, kept out of the tab order and triggered by
                  the dialog. It carries formAction so this one submit deletes
                  rather than saves. */}
              <button
                ref={deleteSubmitRef}
                type="submit"
                formAction={deleteEntry}
                formNoValidate
                tabIndex={-1}
                aria-hidden
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="btn ml-auto text-red-600 hover:bg-red-500/10 dark:text-red-400"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this entry?"
        message={`“${entry?.title || "Untitled"}” will be gone for good. This cannot be undone.`}
        confirmLabel="Delete entry"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          formRef.current?.requestSubmit(deleteSubmitRef.current);
        }}
      />
    </article>
  );
}
