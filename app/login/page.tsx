"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/admin";

  const [email, setEmail] = useState("admin@fresitte.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setSubmitting(false);

    if (!result) {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
      return;
    }

    if (result.error) {
      setError("Correo o contraseña inválidos.");
      return;
    }

    router.push(result.url ?? callbackUrl);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/90 shadow-2xl shadow-primary/20">
        <CardHeader className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Fresitte Admin</p>
          <CardTitle className="font-heading text-4xl text-foreground">Bienvenida</CardTitle>
          <CardDescription>
            Solo personal autorizado puede ingresar. Usa las credenciales asignadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-1 text-sm font-semibold text-muted-foreground">
              Correo
              <div className="flex items-center gap-3 rounded-full border border-primary/20 bg-white/80 px-3">
                <Mail className="h-4 w-4 text-primary" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="border-none bg-transparent px-0 focus-visible:ring-0"
                  required
                />
              </div>
            </label>
            <label className="space-y-1 text-sm font-semibold text-muted-foreground">
              Contraseña
              <div className="flex items-center gap-3 rounded-full border border-primary/20 bg-white/80 px-3">
                <Lock className="h-4 w-4 text-primary" />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="border-none bg-transparent px-0 focus-visible:ring-0"
                  required
                />
              </div>
            </label>
            {error ? <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p> : null}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/40"
            >
              {submitting ? "Validando…" : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
