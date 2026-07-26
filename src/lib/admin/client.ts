/**
 * Browser-side calls to `/api/admin/*`.
 *
 * Thin wrappers over `apiFetch` so the admin components never hand-roll a
 * fetch, never see the `{ data }` envelope, and stay same-origin.
 *
 * 📖 Docs: obsidian/backend/admin-area.md
 */

import { apiFetch } from "@/lib/api-client";
import type { ProductInputPayload, ProductPatchPayload } from "@/lib/catalog/schema";
import type { Product } from "@/types/catalog";

export const listProducts = () => apiFetch<Product[]>("/api/admin/products");

export const createProduct = (input: ProductInputPayload) =>
  apiFetch<Product>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateProduct = (id: string, patch: ProductPatchPayload) =>
  apiFetch<Product>(`/api/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

export const deleteProduct = (id: string) =>
  apiFetch<{ removed: boolean }>(`/api/admin/products/${id}`, {
    method: "DELETE",
  });

export const login = (password: string) =>
  apiFetch<{ authenticated: boolean }>("/api/admin/session", {
    method: "POST",
    body: JSON.stringify({ password }),
  });

export const logout = () =>
  apiFetch<{ authenticated: boolean }>("/api/admin/session", {
    method: "DELETE",
  });

/**
 * Uploads a photo and returns its URL.
 *
 * Not `apiFetch`: that helper forces `content-type: application/json`, which
 * would strip the multipart boundary the browser needs to set itself.
 */
export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/admin/upload", { method: "POST", body });
  const payload = (await response.json().catch(() => null)) as
    | { data: { url: string } }
    | { error: { message: string } }
    | null;

  if (!response.ok || !payload || "error" in payload) {
    throw new Error(
      payload && "error" in payload
        ? payload.error.message
        : "Não foi possível enviar a foto.",
    );
  }
  return payload.data.url;
}
