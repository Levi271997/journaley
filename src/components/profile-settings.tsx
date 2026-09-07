"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveEmail, savePassword, saveProfile, type FormState } from "@/app/actions";
import {
  AVATAR_ACCEPT,
  MAX_AVATAR_BYTES,
  MAX_AVATAR_LABEL,
} from "@/lib/avatar-formats";
import type { User } from "@/lib/db";
import { Avatar } from "./avatar";

const EMPTY: FormState = {};

function SubmitButton({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn bg-accent text-paper hover:opacity-90"
    >
      {pending ? busy : label}
    </button>
  );
}

/** The one place a section's outcome is announced, so all three read alike. */
function Feedback({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
      >
        {state.error}
      </p>
    );
  }

  if (state.notice) {
    return (
      <p role="status" className="rounded-lg bg-accent-soft px-3 py-2 text-sm">
        {state.notice}
      </p>
    );
  }

  return null;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8">
      <h2 className="font-serif text-xl">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs tracking-wide text-muted uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ image */

function AvatarPicker({ user }: { user: User }) {
  const fileRef = useRef<HTMLInputElement>(null);

  // What the picture will be once saved: the account's current one, a local
  // preview of the file just chosen, or nothing if it is being removed.
  const [preview, setPreview] = useState<string | null>(user.avatar_url);
  const [removing, setRemoving] = useState(false);
  const [tooBig, setTooBig] = useState(false);

  // An object URL is a handle on a blob the page holds open; revoking the
  // previous one keeps choosing five pictures in a row from leaking five.
  const objectUrl = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  function show(url: string | null) {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = url;
    setPreview(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar src={preview} name={user.username} size={72} />

      <div className="space-y-2">
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept={AVATAR_ACCEPT}
          aria-label="Profile picture"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            // Checked here as well as on the server, so an oversized file is
            // refused before it is uploaded rather than after.
            if (file.size > MAX_AVATAR_BYTES) {
              setTooBig(true);
              event.target.value = "";
              return;
            }

            setTooBig(false);
            setRemoving(false);
            show(URL.createObjectURL(file));
          }}
          className="block w-full text-sm text-muted
                     file:mr-3 file:rounded-lg file:border file:border-line
                     file:bg-paper file:px-3 file:py-1.5 file:text-sm file:text-ink
                     hover:file:bg-accent-soft"
        />

        <p className="text-xs text-muted">
          PNG, JPEG, WebP or GIF, up to {MAX_AVATAR_LABEL}.
        </p>

        {tooBig && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            That image is larger than {MAX_AVATAR_LABEL}.
          </p>
        )}

        {preview && (
          <button
            type="button"
            onClick={() => {
              show(null);
              setRemoving(true);
              setTooBig(false);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="text-xs text-accent underline underline-offset-2 hover:opacity-80"
          >
            Remove picture
          </button>
        )}
      </div>

      {/* Removing is a choice, not the absence of one: without this the server
          could not tell "no new file" from "take the picture away". */}
      {removing && <input type="hidden" name="remove_avatar" value="1" />}
    </div>
  );
}

/* --------------------------------------------------------------- sections */

export function ProfileSettings({ user }: { user: User }) {
  const [profile, profileAction] = useActionState(saveProfile, EMPTY);
  const [email, emailAction] = useActionState(saveEmail, EMPTY);
  const [password, passwordAction] = useActionState(savePassword, EMPTY);

  return (
    <div className="space-y-6">
      <Section
        title="Profile"
        description="The name and picture the journal greets you by."
      >
        <form action={profileAction} className="space-y-5">
          {/* Keyed on the saved picture so a completed save starts the picker
              again from what the account now holds. */}
          <AvatarPicker key={user.avatar_url ?? "none"} user={user} />

          <Field label="Display name">
            <input
              type="text"
              name="name"
              required
              maxLength={32}
              defaultValue={user.username}
              className="field max-w-sm"
            />
          </Field>

          <Feedback state={profile} />
          <SubmitButton label="Save profile" busy="Saving…" />
        </form>
      </Section>

      <Section
        title="Email"
        description="Signing in uses this address. A change takes effect once you open the link we send to the new one."
      >
        <form action={emailAction} className="space-y-5">
          <Field label="Email address">
            <input
              type="email"
              name="email"
              required
              defaultValue={user.email}
              className="field max-w-sm"
            />
          </Field>

          <Feedback state={email} />
          <SubmitButton label="Change email" busy="Sending…" />
        </form>
      </Section>

      <Section
        title="Password"
        description="At least 8 characters. Your current one is needed to set a new one."
      >
        <form action={passwordAction} className="space-y-5">
          <Field label="Current password">
            <input
              type="password"
              name="current"
              required
              autoComplete="current-password"
              className="field max-w-sm"
            />
          </Field>

          <Field label="New password">
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field max-w-sm"
            />
          </Field>

          <Field label="Repeat new password">
            <input
              type="password"
              name="confirm"
              required
              minLength={8}
              autoComplete="new-password"
              className="field max-w-sm"
            />
          </Field>

          <Feedback state={password} />
          <SubmitButton label="Change password" busy="Saving…" />
        </form>
      </Section>
    </div>
  );
}
