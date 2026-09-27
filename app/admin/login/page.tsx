import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function Login() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <div className="admin-brand" style={{ padding: 0 }}>
          <span className="admin-brand-mark">LA</span>
          Les Autres
        </div>
        <div>
          <h1>Inloggen</h1>
          <p className="admin-note">Ga verder naar het beheer van je shop.</p>
        </div>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="admin-alert">
            Admin is nog niet actief. Zet <code>ADMIN_PASSWORD</code> in de
            environment variables van Vercel en deploy opnieuw.
          </p>
        )}
      </div>
    </main>
  );
}
