"use client";

import { useActionState, useRef, useEffect } from "react";
import { createCategory } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategory, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-3">
      <div className="sm:col-span-2">
        <Label htmlFor="name">Nueva categoría</Label>
        <Input id="name" name="name" required placeholder="Ej. Educación" />
      </div>
      <div className="flex flex-col justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Agregar categoría"}
        </Button>
      </div>
      {state?.error && (
        <p className="col-span-full text-sm text-danger">{state.error}</p>
      )}
    </form>
  );
}
