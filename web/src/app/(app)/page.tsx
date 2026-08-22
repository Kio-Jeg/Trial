import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { paymentMethodLabels } from "@/lib/validations";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, amount, status, payment_date, payment_method, check_number, transfer_reference, payees(name)",
    )
    .order("payment_date", { ascending: false });

  const all = payments ?? [];
  const pendingTotal = all
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const now = new Date();
  const monthTotal = all
    .filter((p) => {
      const d = new Date(`${p.payment_date}T00:00:00`);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const voidedCount = all.filter((p) => p.status === "voided").length;
  const returnedCount = all.filter((p) => p.status === "returned").length;

  const recent = all.slice(0, 8);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Resumen</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-foreground-muted">Pendiente por cobrar/aplicar</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(pendingTotal)}</p>
        </Card>
        <Card>
          <p className="text-sm text-foreground-muted">Total este mes</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(monthTotal)}</p>
        </Card>
        <Card>
          <p className="text-sm text-foreground-muted">Anulados / devueltos</p>
          <p className="mt-1 text-2xl font-semibold">
            {voidedCount + returnedCount}
          </p>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Últimos movimientos</h2>
          <Link href="/payments" className="text-sm text-accent hover:underline">
            Ver todos
          </Link>
        </div>

        <div className="space-y-3">
          {recent.length ? (
            recent.map((p) => (
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
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <p className="text-sm text-foreground-muted">
                Aún no tienes pagos registrados.{" "}
                <Link href="/payments/new" className="text-accent hover:underline">
                  Registra el primero
                </Link>
                .
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
