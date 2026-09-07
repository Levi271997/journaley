"use client";

import { MAX_TAGS, normalizeTag } from "@/lib/tags";

/**
 * Tags as chips. Typing a comma or pressing Enter commits whatever is in the
 * box; backspace on an empty box takes the last chip back. Every value goes
 * through normalizeTag on the way in, so what you see here is exactly what
 * gets stored.
 */
export function TagInput({
  tags,
  draft,
  onTagsChange,
  onDraftChange,
}: {
  tags: string[];
  draft: string;
  onTagsChange: (next: string[]) => void;
  onDraftChange: (next: string) => void;
}) {
  const full = tags.length >= MAX_TAGS;

  function add(raw: string) {
    const tag = normalizeTag(raw);
    if (!tag || full || tags.includes(tag)) return;
    onTagsChange([...tags, tag]);
  }

  function remove(tag: string) {
    onTagsChange(tags.filter((existing) => existing !== tag));
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line
                 bg-surface px-2 py-1.5 focus-within:outline focus-within:outline-2
                 focus-within:outline-accent"
    >
      <span aria-hidden className="pl-0.5 text-sm text-muted">
        #
      </span>

      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs"
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            aria-label={`Remove tag ${tag}`}
            className="text-muted hover:text-ink"
          >
            ×
          </button>
        </span>
      ))}

      <input
        type="text"
        value={draft}
        disabled={full}
        aria-label="Add a tag"
        placeholder={full ? `${MAX_TAGS} tags is the limit` : "Add a tag…"}
        // A pasted "walks, autumn, quiet" should land as three chips, so the
        // split happens here rather than only on Enter.
        onChange={(event) => {
          const value = event.target.value;
          if (!value.includes(",")) {
            onDraftChange(value);
            return;
          }

          const pieces = value.split(",");
          for (const piece of pieces.slice(0, -1)) add(piece);
          onDraftChange(pieces[pieces.length - 1]);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            // Otherwise this would submit the entry mid-thought.
            event.preventDefault();
            add(draft);
            onDraftChange("");
          } else if (event.key === "Backspace" && !draft && tags.length) {
            onTagsChange(tags.slice(0, -1));
          }
        }}
        // Leaving the field should keep what was typed, not drop it.
        onBlur={() => {
          add(draft);
          onDraftChange("");
        }}
        className="min-w-32 flex-1 border-0 bg-transparent p-0 text-sm
                   placeholder:text-muted/70 focus:outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
