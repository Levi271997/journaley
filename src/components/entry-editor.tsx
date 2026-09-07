"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteEntry, saveEntry, type FormState } from "@/app/actions";
import type { Entry } from "@/lib/db";
import { MOODS } from "@/lib/moods";

const EMPTY: FormState = {};

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

  // Controlled fields: React clears an uncontrolled form once its action
  // settles, which would throw away a whole entry if the save came back with
  // an error.
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [mood, setMood] = useState(entry?.mood ?? "");
  const [date, setDate] = useState(entry?.entry_date ?? today);

  return (
    <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8">
      <form action={formAction} className="space-y-5">
        {entry && <input type="hidden" name="id" value={entry.id} />}

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

        <textarea
          name="body"
          rows={16}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="How was your day?"
          aria-label="Entry text"
          className="w-full resize-y border-0 bg-transparent p-0 font-serif
                     text-[1.05rem] leading-8 placeholder:text-muted/60 focus:outline-none"
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
            <button
              type="submit"
              formAction={deleteEntry}
              formNoValidate
              onClick={(event) => {
                // Deleting an entry cannot be undone, so make it deliberate.
                if (!window.confirm("Delete this entry? This cannot be undone.")) {
                  event.preventDefault();
                }
              }}
              className="btn ml-auto text-red-600 hover:bg-red-500/10 dark:text-red-400"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </article>
  );
}
