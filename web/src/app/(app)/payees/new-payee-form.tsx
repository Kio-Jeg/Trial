"use client";

import { useActionState, useRef, useEffect } from "react";
import { createPayee } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewPayeeForm() {
  const [state, formAction, pending] = useActionState(createPayee, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-3">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required placeholder="Nombre del beneficiario" />
      </div>
      <div>
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Input id="notes" name="notes" placeholder="Notas" />
      </div>
      <div className="flex flex-col justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Agregar beneficiario"}
        </Button>
      </div>
      {state?.error && (
        <p className="col-span-full text-sm text-danger">{state.error}</p>
      )}
    </form>
  );
}
