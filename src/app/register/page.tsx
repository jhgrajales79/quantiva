"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="mb-1 text-xl font-semibold text-neutral-50">
          Crear cuenta
        </h1>
        <p className="mb-6 text-sm text-neutral-400">
          Empieza a monitorear mercados y valorar tus inversiones.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400">
              Correo
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-400">
              Contraseña (mínimo 8 caracteres)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
