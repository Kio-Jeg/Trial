import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { NewAccountForm } from "./new-account-form";
import { deleteBankAccount, toggleBankAccountActive } from "./actions";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("bank_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Cuentas bancarias</h1>
        <p className="text-sm text-foreground-muted">
          Administra las cuentas desde las que emites cheques o transferencias.
        </p>
      </div>

      <Card>
        <NewAccountForm />
      </Card>

      <div className="space-y-3">
        {accounts?.length ? (
          accounts.map((account) => (
            <Card key={account.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {account.bank_name} — {account.account_alias}
                  {!account.is_active && (
                    <span className="ml-2 text-xs text-foreground-muted">(archivada)</span>
                  )}
                </p>
                {account.account_number_last4 && (
                  <p className="text-sm text-foreground-muted">
                    ****{account.account_number_last4} · {account.currency}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <form action={toggleBankAccountActive}>
                  <input type="hidden" name="id" value={account.id} />
                  <input type="hidden" name="isActive" value={String(account.is_active)} />
                  <Button type="submit" variant="secondary">
                    {account.is_active ? "Archivar" : "Activar"}
                  </Button>
                </form>
                <DeleteButton
                  id={account.id}
                  action={deleteBankAccount}
                  confirmMessage="¿Eliminar esta cuenta bancaria?"
                />
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-foreground-muted">Aún no tienes cuentas registradas.</p>
        )}
      </div>
    </div>
  );
}
