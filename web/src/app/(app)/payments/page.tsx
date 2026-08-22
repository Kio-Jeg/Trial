import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  paymentMethodLabels,
  paymentStatusLabels,
  paymentStatuses,
  type PaymentStatus,
} from "@/lib/validations";

function isPaymentStatus(value: string): value is PaymentStatus {
  return (paymentStatuses as readonly string[]).includes(value);
}

type SearchParams = {
  status?: string;
  categoryId?: string;
  bankAccountId?: string;
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status, categoryId, bankAccountId } = await searchParams;
  const supabase = await createClient();

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase.from("bank_accounts").select("id, bank_name, account_alias"),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  let query = supabase
    .from("payments")
    .select(
      "id, amount, payment_date, payment_method, check_number, transfer_reference, status, description, payees(name), categories(name), bank_accounts(bank_name, account_alias)",
    )
    .order("payment_date", { ascending: false });

  if (status && isPaymentStatus(status)) query = query.eq("status", status);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (bankAccountId) query = query.eq("bank_account_id", bankAccountId);

  const { data: payments } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pagos</h1>
          <p className="text-sm text-foreground-muted">
            Cheques y transferencias registrados.
          </p>
        </div>
        <Link href="/payments/new">
          <Button>Nuevo pago</Button>
        </Link>
      </div>

      <Card>
        <form method="get" className="grid gap-3 sm:grid-cols-4">
          <Select name="status" defaultValue={status ?? ""}>
            <option value="">Todos los estados</option>
            {paymentStatuses.map((s) => (
              <option key={s} value={s}>
                {paymentStatusLabels[s]}
              </option>
            ))}
          </Select>
          <Select name="categoryId" defaultValue={categoryId ?? ""}>
            <option value="">Todas las categorías</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select name="bankAccountId" defaultValue={bankAccountId ?? ""}>
            <option value="">Todas las cuentas</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.bank_name} — {a.account_alias}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" className="flex-1">
              Filtrar
            </Button>
            <Link href="/payments">
              <Button type="button" variant="ghost">
                Limpiar
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {payments?.length ? (
          payments.map((p) => (
            <Link key={p.id} href={`/payments/${p.id}`}>
              <Card className="flex items-center justify-between hover:border-accent">
                <div>
                  <p className="font-medium">
                    {formatCurrency(p.amount)} · {paymentMethodLabels[p.payment_method]}{" "}
                    {p.check_number ? `#${p.check_number}` : p.transfer_reference}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    {formatDate(p.payment_date)}
                    {p.payees?.name ? ` · ${p.payees.name}` : ""}
                    {p.categories?.name ? ` · ${p.categories.name}` : ""}
                    {" · "}
                    {p.bank_accounts?.bank_name} {p.bank_accounts?.account_alias}
                  </p>
                  {p.description && (
                    <p className="text-sm text-foreground-muted">{p.description}</p>
                  )}
                </div>
                <StatusBadge status={p.status} />
              </Card>
            </Link>
          ))
        ) : (
          <p className="text-sm text-foreground-muted">No hay pagos que coincidan con el filtro.</p>
        )}
      </div>
    </div>
  );
}
