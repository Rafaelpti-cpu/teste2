"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  changeUserPassword,
  createUser,
  deleteUser,
  type AdminUserSummary,
} from "@/lib/admin/client";

export interface UsersFormProps {
  users: AdminUserSummary[];
  /** Who is signed in — they cannot remove themselves. */
  currentId: string | null;
}

const field =
  "w-full rounded-control border border-border-subtle bg-surface-raised px-3 py-2.5 text-sm outline-none focus-visible:border-action-primary";

export const UsersForm = ({ users, currentId }: UsersFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const run = async (task: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await task();
      setNotice(done);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex max-w-[46rem] flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-light text-foreground">
          Quem tem acesso
        </h2>

        <ul className="flex flex-col">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-col gap-3 border-b border-border-subtle py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-foreground">
                  {user.name}
                  {user.id === currentId && (
                    <span className="ml-2 rounded-pill bg-surface-accent px-2 py-0.5 text-[0.625rem] text-foreground-accent">
                      você
                    </span>
                  )}
                </span>
                <span className="text-xs text-foreground-muted">{user.email}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setChanging(changing === user.id ? null : user.id);
                    setNewPassword("");
                  }}
                  className="rounded-control px-3.5 py-3 text-sm text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground disabled:opacity-50"
                >
                  Trocar senha
                </button>
                {user.id !== currentId && (
                  <button
                    type="button"
                    disabled={busy || users.length <= 1}
                    onClick={() =>
                      run(() => deleteUser(user.id), "Acesso removido.")
                    }
                    className="rounded-control px-3.5 py-3 text-sm text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground-accent disabled:opacity-50"
                  >
                    Remover
                  </button>
                )}
              </div>

              {changing === user.id && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                      await changeUserPassword(user.id, newPassword);
                      setChanging(null);
                      setNewPassword("");
                    }, user.id === currentId
                      ? "Senha trocada. Entre de novo com a senha nova."
                      : "Senha trocada.");
                  }}
                  className="flex w-full flex-wrap items-center gap-2 sm:w-auto"
                >
                  <label className="sr-only" htmlFor={`pw-${user.id}`}>
                    Nova senha para {user.name}
                  </label>
                  <input
                    id={`pw-${user.id}`}
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Nova senha"
                    className={`${field} sm:w-52`}
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-control bg-action-primary px-4 py-3 text-sm text-action-primary-foreground disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4 rounded-card border border-border-subtle p-5">
        <h2 className="font-display text-lg font-light text-foreground">
          Dar acesso a mais alguém
        </h2>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await createUser({ email, name, password });
              setEmail("");
              setName("");
              setPassword("");
            }, "Acesso criado.");
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Nome</span>
            <input
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Quem vai usar"
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-foreground">E-mail</span>
            <input
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Senha</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={field}
            />
            <span className="text-xs text-foreground-muted">
              Mínimo de 8 caracteres. Ela é guardada embaralhada — nem eu nem
              você conseguimos lê-la depois, só trocar.
            </span>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="self-start rounded-pill bg-action-primary px-6 py-3.5 text-sm font-medium text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-hover disabled:opacity-50"
          >
            Criar acesso
          </button>
        </form>
      </section>

      {error && (
        <p role="alert" className="text-sm text-foreground-accent">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-foreground-accent">
          {notice}
        </p>
      )}
    </div>
  );
};
