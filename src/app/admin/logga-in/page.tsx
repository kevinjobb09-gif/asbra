import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Logga in (admin)", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-extrabold">Logga in som admin</h1>
      <p className="mt-2 text-muted">Du får en inloggningslänk till din e-post. Inget lösenord behövs.</p>
      <LoginForm />
    </div>
  );
}
