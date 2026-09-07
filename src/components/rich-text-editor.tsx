"use client";

import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";

const TOOL_CLASS =
  "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm " +
  "transition-colors hover:bg-accent-soft disabled:opacity-40";

function Tool({
  editor,
  label,
  title,
  isActive,
  onRun,
  disabled,
}: {
  editor: Editor;
  label: React.ReactNode;
  title: string;
  isActive?: boolean;
  onRun: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      disabled={disabled}
      // The editor loses focus the moment a toolbar button takes it, which
      // would collapse the selection the button is meant to act on.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        onRun();
        editor.commands.focus();
      }}
      className={`${TOOL_CLASS} ${isActive ? "bg-accent-soft text-accent" : "text-muted"}`}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({
  initialHtml,
  placeholder,
  onChange,
}: {
  initialHtml: string;
  placeholder: string;
  onChange: (html: string, text: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml,
    // Tiptap must not render during the server pass, or the client's first
    // paint disagrees with the markup React sent.
    immediatelyRender: false,
    // Keeps the toolbar's active states honest as the caret moves.
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        // Stretching to fill the scroll area at lg keeps the whole pane
        // clickable, so a tap below the last paragraph still lands the caret.
        class: "entry-content min-h-72 focus:outline-none lg:flex-1",
        "aria-label": "Entry text",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML(), instance.getText());
    },
  });

  if (!editor) {
    // Matches the editor's own height so the panel does not jump on hydration.
    return <div className="min-h-72 flex-1" aria-hidden />;
  }

  const chain = () => editor.chain().focus();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-0.5 border-b border-line pb-2">
        <Tool
          editor={editor}
          title="Bold"
          label={<span className="font-bold">B</span>}
          isActive={editor.isActive("bold")}
          onRun={() => chain().toggleBold().run()}
        />
        <Tool
          editor={editor}
          title="Italic"
          label={<span className="font-serif italic">I</span>}
          isActive={editor.isActive("italic")}
          onRun={() => chain().toggleItalic().run()}
        />
        <Tool
          editor={editor}
          title="Strikethrough"
          label={<span className="line-through">S</span>}
          isActive={editor.isActive("strike")}
          onRun={() => chain().toggleStrike().run()}
        />

        <span className="mx-1 h-5 w-px bg-line" aria-hidden />

        <Tool
          editor={editor}
          title="Heading"
          label="H"
          isActive={editor.isActive("heading", { level: 2 })}
          onRun={() => chain().toggleHeading({ level: 2 }).run()}
        />
        <Tool
          editor={editor}
          title="Bulleted list"
          label="•"
          isActive={editor.isActive("bulletList")}
          onRun={() => chain().toggleBulletList().run()}
        />
        <Tool
          editor={editor}
          title="Numbered list"
          label="1."
          isActive={editor.isActive("orderedList")}
          onRun={() => chain().toggleOrderedList().run()}
        />
        <Tool
          editor={editor}
          title="Quote"
          label="❝"
          isActive={editor.isActive("blockquote")}
          onRun={() => chain().toggleBlockquote().run()}
        />

        <span className="mx-1 h-5 w-px bg-line" aria-hidden />

        <Tool
          editor={editor}
          title="Undo"
          label="↺"
          disabled={!editor.can().undo()}
          onRun={() => chain().undo().run()}
        />
        <Tool
          editor={editor}
          title="Redo"
          label="↻"
          disabled={!editor.can().redo()}
          onRun={() => chain().redo().run()}
        />
      </div>

      {/* The scroll container: the toolbar above it stays in place while the
          prose moves. */}
      <div className="relative min-h-0 flex-1 overflow-y-auto lg:flex lg:flex-col">
        {editor.isEmpty && (
          <p className="entry-content pointer-events-none absolute inset-0 text-muted/60">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} className="lg:flex lg:flex-1 lg:flex-col" />
      </div>
    </div>
  );
}
