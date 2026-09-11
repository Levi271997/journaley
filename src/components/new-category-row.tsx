"use client";

import { useState, useTransition } from "react";
import { createCategory } from "@/app/actions";
import { type CategoryOption, MAX_CATEGORY_LABEL_LENGTH } from "@/lib/categories";

/**
 * An emoji box, a name box and an Add button, opened from the editor's
 * category select. It lives inside the entry form, so it is not a form of its
 * own: Enter is caught here and sent to the action, never to "Save entry".
 */
export function NewCategoryRow({
  onAdded,
  onCancel,
}: {
  onAdded: (category: CategoryOption) => void;
  onCancel: () => void;
}) {
  const [emoji, setEmoji] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (pending) return;

    startTransition(async () => {
      const result = await createCategory(label, emoji);
      if (result.category) onAdded(result.category);
      else setError(result.error ?? "Could not add the category.");
    });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="basis-full">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={emoji}
          onChange={(event) => setEmoji(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="🗂️"
          aria-label="Emoji for the new category"
          title="Emoji (optional)"
          className="field w-14 py-1.5 text-center text-sm"
        />
        <input
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          onKeyDown={onKeyDown}
          maxLength={MAX_CATEGORY_LABEL_LENGTH}
          autoFocus
          placeholder="New category name"
          aria-label="Name of the new category"
          className="field w-48 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !label.trim()}
          className="btn bg-accent py-1.5 text-paper hover:opacity-90"
        >
          {pending ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="btn border border-line py-1.5 hover:bg-accent-soft"
        >
          Cancel
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
