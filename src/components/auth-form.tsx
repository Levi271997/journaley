"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { login, register, type FormState } from "@/app/actions";

const EMPTY: FormState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn w-full bg-accent py-2.5 text-paper hover:opacity-90"
    >
      {pending ? "One moment…" : label}
    </button>
  );
}

export function AuthForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginAction] = useActionState(login, EMPTY);
  const [registerState, registerAction] = useActionState(register, EMPTY);

  // Controlled fields: React clears an uncontrolled form once its action
  // settles, which would wipe everything typed whenever the form comes back
  // with an error.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const isLogin = mode === "login";
  const state = isLogin ? loginState : registerState;

  // A failed submit replaces whatever the confirmation link complained about.
  const error = state.error ?? initialError;

  function switchMode() {
    setMode(isLogin ? "register" : "login");
    setPassword("");
    setConfirm("");
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mb-3 text-4xl">📔</div>
        <h1 className="font-serif text-3xl">
          {isLogin ? "Welcome back" : "Start your journal"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {isLogin
            ? "Sign in to open your journal."
            : "Your email and a password you will remember."}
        </p>
      </div>

      <form
        key={mode}
        action={isLogin ? loginAction : registerAction}
        className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm"
      >
        {!isLogin && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              Your name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={32}
              autoComplete="nickname"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field"
            />
            <p className="mt-1.5 text-xs text-muted">What the journal greets you by.</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            spellCheck={false}
            autoComplete="email"
            autoFocus={isLogin}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field"
          />
          {!isLogin && (
            <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>
          )}
        </div>

        {!isLogin && (
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="field"
            />
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}

        {state.notice && (
          <p
            role="status"
            className="rounded-lg bg-accent-soft px-3 py-2 text-sm"
          >
            {state.notice}
          </p>
        )}

        <SubmitButton label={isLogin ? "Sign in" : "Create account"} />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isLogin ? "No account yet?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={switchMode}
          className="font-medium text-accent underline underline-offset-4 hover:opacity-80"
        >
          {isLogin ? "Create one" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
