"use client";

import { useActionState, useRef, useEffect } from "react";
import { createBankAccount } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewAccountForm() {
  const [state, formAction, pending] = useActionState(createBankAccount, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-4">
      <div>
        <Label htmlFor="bankName">Banco</Label>
        <Input id="bankName" name="bankName" required placeholder="Banco Agrícola" />
      </div>
      <div>
        <Label htmlFor="accountAlias">Alias</Label>
        <Input id="accountAlias" name="accountAlias" required placeholder="Cuenta principal" />
      </div>
      <div>
        <Label htmlFor="accountNumberLast4">Últimos 4 dígitos</Label>
        <Input id="accountNumberLast4" name="accountNumberLast4" maxLength={4} placeholder="1234" />
      </div>
      <div className="flex flex-col justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Agregar cuenta"}
        </Button>
      </div>
      {state?.error && (
        <p className="col-span-full text-sm text-danger">{state.error}</p>
      )}
    </form>
  );
}
