"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

type DeleteState = { error?: string; success?: boolean } | undefined;

export function DeleteButton({
  id,
  action,
  confirmMessage,
}: {
  id: string;
  action: (prevState: DeleteState, formData: FormData) => Promise<DeleteState>;
  confirmMessage: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
      className="inline-flex flex-col items-end gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Eliminando…" : "Eliminar"}
      </Button>
      {state?.error && (
        <p className="max-w-52 text-right text-xs text-danger">{state.error}</p>
      )}
    </form>
  );
}
