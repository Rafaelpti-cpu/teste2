import { z } from "zod";

import { assertAdmin } from "@/lib/admin/auth";
import { createUser, listUsers, toPublic } from "@/lib/admin/users";
import { handle } from "@/lib/api";

const newUserSchema = z.object({
  email: z.email("E-mail inválido."),
  name: z.string().trim().min(1, "Informe um nome.").max(80),
  password: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres.")
    .max(200),
});

/** Never returns the hashes — `toPublic` strips them. */
export const GET = handle(async () => {
  await assertAdmin();
  return (await listUsers()).map(toPublic);
});

export const POST = handle(async (req) => {
  await assertAdmin();
  const input = newUserSchema.parse(await req.json());
  return toPublic(await createUser(input));
});
