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
  const [preview, setPreview] = useState<string | null>(null);

  // Revokes the previous object URL whenever a new one is set, and on unmount.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        name={name}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          setPreview(file ? URL.createObjectURL(file) : null);
        }}
        className="w-full text-sm text-foreground-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:opacity-80"
      />
      <p className="mt-1 text-xs text-foreground-muted">
        En tu celular puedes tomar la foto directamente con la cámara.
      </p>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a remote asset
        <img
          src={preview}
          alt=""
          className="mt-2 h-32 w-32 rounded-lg border border-border object-cover"
        />
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
        <PhotoField id="checkPhoto" name="checkPhoto" label="Foto del cheque (evidencia)" />
        <PhotoField id="receiptPhoto" name="receiptPhoto" label="Foto del recibo" />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Registrar pago"}
      </Button>
    </form>
  );
}
