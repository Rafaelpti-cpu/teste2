import { redirect } from "next/navigation";

import { hasAdminSession, isAdminLocked } from "@/lib/admin/auth";
import { LoginView } from "@/views/admin/login-view";

export default async function AdminLoginPage() {
  // Nothing to log into when the area is open, or when already signed in.
  if (!isAdminLocked() || (await hasAdminSession())) redirect("/admin");
  return <LoginView />;
}
