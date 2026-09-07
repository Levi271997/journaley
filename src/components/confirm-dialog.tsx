"use client";

import { useEffect, useId, useRef } from "react";

/**
 * A modal confirmation built on the native <dialog> element, so the browser
 * handles the top layer, the focus trap and Escape for us.
 *
 * Focus starts on Cancel: the point of the dialog is that the destructive
 * choice should take a deliberate second action, and a stray Enter should not
 * be that action.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // showModal() throws if the dialog is already open, and close() on a
    // closed dialog fires a stray event, so both are guarded.
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      aria-describedby={messageId}
      onCancel={(event) => {
        // Escape: close through React's state rather than letting the browser
        // close it behind the component's back.
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        // The dialog element itself fills the viewport behind the panel, so a
        // click landing on it — rather than on the panel — is a backdrop click.
        if (event.target === dialogRef.current) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line
                 bg-surface p-0 text-ink shadow-xl backdrop:bg-black/40
                 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-6">
        <h2 id={headingId} className="font-serif text-xl">
          {title}
        </h2>
        <p id={messageId} className="mt-2 text-sm text-muted">
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="btn border border-line hover:bg-accent-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
