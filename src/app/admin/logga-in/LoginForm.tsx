"use client";

import { useActionState } from "react";
import { sendAdminLink, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendAdminLink, { sent: false });

  if (state.sent) {
    return (
      <p className="mt-6 rounded-2xl bg-primary-soft p-4">
        Om adressen har admin-behörighet har vi skickat en länk. Öppna den i <strong>samma webbläsare</strong>.
      </p>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-3">
      <label className="block">
        <span className="text-sm font-semibold">E-post</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-3"
        />
      </label>
      {state.error && <p className="text-sm text-wrong">{state.error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-full bg-primary px-5 py-3 font-bold text-white disabled:opacity-60"
      >
        {pending ? "Skickar …" : "Skicka inloggningslänk"}
      </button>
    </form>
  );
}
