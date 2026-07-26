import type { Metadata } from "next";

/**
 * The admin is never indexed and never cached — it always renders against the
 * live catalogue. `robots.ts` disallows it too; this is the belt to that
 * suspenders, for crawlers that ignore robots.txt.
 *
 * The access check is **not** here: this layout also wraps `/admin/entrar`, and
 * redirecting from it would loop. Protected views call `requireAdmin()`
 * themselves — see `lib/admin/auth.ts`.
 */
export const metadata: Metadata = {
  title: "Admin · Renova Closet",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
