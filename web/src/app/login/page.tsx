"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-lg font-semibold">Control de Cheques</h1>
        <p className="mb-6 text-sm text-foreground-muted">
          Inicia sesión para continuar
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo</Label>
            <Input id="email" name="email" type="email" required autoFocus />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required />
          </div>

          {state?.error && (
            <p className="text-sm text-danger">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Ingresando…" : "Iniciar sesión"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-foreground-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/sign-up" className="text-accent hover:underline">
            Regístrate
          </Link>
        </p>
      </Card>
    </div>
  );
}
