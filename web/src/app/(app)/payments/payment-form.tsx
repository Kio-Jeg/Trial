"use client";

import { useActionState, useEffect, useState } from "react";
import { createPayment, updatePayment } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  paymentMethodLabels,
  paymentMethods,
  paymentStatusLabels,
  paymentStatuses,
} from "@/lib/validations";

type Option = { id: string; label: string };

function PhotoField({ id, name, label }: { id: string; name: string; label: string }) {
  const [previews, setPreviews] = useState<{ url: string; isPdf: boolean }[]>([]);

  // Revokes the previous object URLs whenever a new selection is made, and on unmount.
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        name={name}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          setPreviews(
            files.map((file) => ({
              url: URL.createObjectURL(file),
              isPdf: file.type === "application/pdf",
            })),
          );
        }}
        className="w-full text-sm text-foreground-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:opacity-80"
      />
      <p className="mt-1 text-xs text-foreground-muted">
        Puedes seleccionar varias fotos o PDF. En tu celular puedes tomarlas directamente con la cámara.
      </p>
      {previews.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {previews.map((preview, i) =>
            preview.isPdf ? (
              <div
                key={preview.url}
                className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface-muted text-center text-xs text-foreground-muted"
              >
                <span aria-hidden>📄</span>
                PDF {i + 1}
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a remote asset
              <img
                key={preview.url}
                src={preview.url}
                alt={`Vista previa ${i + 1}`}
                className="h-24 w-24 rounded-lg border border-border object-cover"
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function PaymentForm({
  accounts,
  payees,
  categories,
  defaultValues,
  paymentId,
}: {
  accounts: Option[];
  payees: Option[];
  categories: Option[];
  defaultValues?: {
    bankAccountId: string;
    payeeId: string | null;
    categoryId: string | null;
    paymentMethod: (typeof paymentMethods)[number];
    checkNumber: string | null;
    transferReference: string | null;
    amount: number;
    paymentDate: string;
    status: (typeof paymentStatuses)[number];
    description: string | null;
  };
  paymentId?: string;
}) {
  const isEdit = Boolean(paymentId);
  const action = isEdit ? updatePayment : createPayment;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [method, setMethod] = useState<(typeof paymentMethods)[number]>(
    defaultValues?.paymentMethod ?? "check",
  );

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={paymentId} />}

      <div>
        <Label>Método de pago</Label>
        <div className="flex gap-4">
          {paymentMethods.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="paymentMethod"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
              />
              {paymentMethodLabels[m]}
            </label>
          ))}
        </div>
      </div>

      {method === "check" ? (
        <div>
          <Label htmlFor="checkNumber">Número de cheque</Label>
          <Input
            id="checkNumber"
            name="checkNumber"
            required
            defaultValue={defaultValues?.checkNumber ?? ""}
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="transferReference">Referencia de transferencia</Label>
          <Input
            id="transferReference"
            name="transferReference"
            required
            defaultValue={defaultValues?.transferReference ?? ""}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bankAccountId">Cuenta bancaria</Label>
          <Select
            id="bankAccountId"
            name="bankAccountId"
            required
            defaultValue={defaultValues?.bankAccountId ?? ""}
          >
            <option value="" disabled>
              Selecciona una cuenta
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="payeeId">Beneficiario</Label>
          <Select id="payeeId" name="payeeId" defaultValue={defaultValues?.payeeId ?? ""}>
            <option value="">Sin especificar</option>
            {payees.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="categoryId">Categoría</Label>
          <Select id="categoryId" name="categoryId" defaultValue={defaultValues?.categoryId ?? ""}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Estado</Label>
          <Select
            id="status"
            name="status"
            required
            defaultValue={defaultValues?.status ?? "pending"}
          >
            {paymentStatuses.map((s) => (
              <option key={s} value={s}>
                {paymentStatusLabels[s]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="amount">Monto (USD)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.amount ?? ""}
          />
        </div>

        <div>
          <Label htmlFor="paymentDate">Fecha</Label>
          <Input
            id="paymentDate"
            name="paymentDate"
            type="date"
            required
            defaultValue={defaultValues?.paymentDate ?? ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Ej. Mantenimiento de agosto"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PhotoField
          id="checkPhoto"
          name="checkPhoto"
          label={
            method === "check"
              ? "Foto(s) del cheque (evidencia)"
              : "Foto(s) de la transferencia (evidencia)"
          }
        />
        <PhotoField id="receiptPhoto" name="receiptPhoto" label="Foto(s) del recibo" />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Registrar pago"}
      </Button>
    </form>
  );
}
