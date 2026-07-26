import { z } from "zod";

import { assertAdmin, getCurrentUser } from "@/lib/admin/auth";
import { removeUser, setPassword } from "@/lib/admin/users";
import { ApiError, handle } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres.")
    .max(200),
});

export const PATCH = handle<Context>(async (req, { params }) => {
  await assertAdmin();
  const { id } = await params;
  const { password } = passwordSchema.parse(await req.json());
  await setPassword(id, password);
  // The session is signed with the old hash, so changing your own password
  // logs you out — which is the behaviour you want after a password change.
  return { updated: true };
});

export const DELETE = handle<Context>(async (_req, { params }) => {
  await assertAdmin();
  const { id } = await params;

  const current = await getCurrentUser();
  if (current?.id === id) {
    throw new ApiError(
      400,
      "self_delete",
      "Você não pode remover o próprio acesso.",
    );
  }

  await removeUser(id);
  return { removed: true };
});
