"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "../login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signup, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-lg font-semibold">Crear cuenta</h1>
        <p className="mb-6 text-sm text-foreground-muted">
          Regístrate para empezar a llevar tu control de cheques
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo</Label>
            <Input id="email" name="email" type="email" required autoFocus />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          {state?.success && (
            <p className="text-sm text-success">{state.success}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creando cuenta…" : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-foreground-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
