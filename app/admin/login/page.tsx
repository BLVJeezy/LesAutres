import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function Login() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="admin-login">
      <h1>LES AUTRES — ADMIN</h1>
      {adminConfigured() ? (
        <LoginForm />
      ) : (
        <p className="admin-alert">
          Admin is nog niet actief. Zet <code>ADMIN_PASSWORD</code> in de
          environment variables van Vercel en deploy opnieuw.
        </p>
      )}
    </main>
  );
}
