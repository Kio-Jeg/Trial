import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PaymentForm } from "../payment-form";

export default async function NewPaymentPage() {
  const supabase = await createClient();
  const [{ data: accounts }, { data: payees }, { data: categories }] = await Promise.all([
    supabase.from("bank_accounts").select("id, bank_name, account_alias").eq("is_active", true),
    supabase.from("payees").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (!accounts?.length) {
    return (
      <Card className="max-w-md">
        <p className="text-sm text-foreground-muted">
          Primero necesitas registrar una{" "}
          <Link href="/accounts" className="text-accent hover:underline">
            cuenta bancaria
          </Link>{" "}
          antes de crear un pago.
        </p>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Registrar pago</h1>
        <p className="text-sm text-foreground-muted">
          Registra un cheque emitido o una transferencia bancaria.
        </p>
      </div>

      <Card>
        <PaymentForm
          accounts={accounts.map((a) => ({
            id: a.id,
            label: `${a.bank_name} — ${a.account_alias}`,
          }))}
          payees={(payees ?? []).map((p) => ({ id: p.id, label: p.name }))}
          categories={(categories ?? []).map((c) => ({ id: c.id, label: c.name }))}
        />
      </Card>
    </div>
  );
}
