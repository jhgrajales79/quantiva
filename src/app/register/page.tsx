"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineChart } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo crear la cuenta.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError("Cuenta creada, pero no se pudo iniciar sesión automáticamente.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app-bg px-4">
      <Link
        href="/"
        className="mb-6 flex items-center gap-2 text-xl font-semibold text-app-fg"
      >
        <LineChart size={28} strokeWidth={2.25} className="text-brand" />
        Quantiva
      </Link>
      <Card className="w-full max-w-sm p-8">
        <h1 className="mb-1 text-xl font-semibold text-app-fg">
          Crear cuenta
        </h1>
        <p className="mb-6 text-sm text-app-fg-muted">
          Empieza a monitorear mercados y valorar tus inversiones.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-app-fg-muted">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-fg outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-app-fg-muted">
              Correo
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-fg outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-app-fg-muted">
              Contraseña (mínimo 8 caracteres)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-fg outline-none"
            />
          </div>
          {error && <p className="text-sm text-negative">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-app-fg-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand hover:underline">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
