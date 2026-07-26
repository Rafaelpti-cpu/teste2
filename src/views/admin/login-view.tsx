"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { login } from "@/lib/admin/client";

/** Only reachable once an access exists; before that the area is open. */
export const LoginView = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar.");
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-lvh place-items-center bg-background px-6">
      <form
        onSubmit={submit}
        className="flex w-full max-w-[22rem] flex-col gap-5 rounded-panel border border-border-subtle bg-surface-raised p-8"
      >
        <h1 className="font-display text-2xl font-light text-foreground">
          Área administrativa
        </h1>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm text-foreground">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-control border border-border-subtle bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-action-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm text-foreground">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-control border border-border-subtle bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-action-primary"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-foreground-accent">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-pill bg-action-primary px-6 py-3 text-sm font-medium text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-hover disabled:opacity-50"
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
};
