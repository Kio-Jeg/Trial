import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { NewPayeeForm } from "./new-payee-form";
import { deletePayee } from "./actions";

export default async function PayeesPage() {
  const supabase = await createClient();
  const { data: payees } = await supabase
    .from("payees")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Beneficiarios</h1>
        <p className="text-sm text-foreground-muted">
          Personas o entidades a quienes emites cheques o transferencias.
        </p>
      </div>

      <Card>
        <NewPayeeForm />
      </Card>

      <div className="space-y-3">
        {payees?.length ? (
          payees.map((payee) => (
            <Card key={payee.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{payee.name}</p>
                {payee.notes && (
                  <p className="text-sm text-foreground-muted">{payee.notes}</p>
                )}
              </div>
              <DeleteButton
                id={payee.id}
                action={deletePayee}
                confirmMessage="¿Eliminar este beneficiario? Los pagos existentes quedarán sin beneficiario asignado."
              />
            </Card>
          ))
        ) : (
          <p className="text-sm text-foreground-muted">Aún no tienes beneficiarios registrados.</p>
        )}
      </div>
    </div>
  );
}
