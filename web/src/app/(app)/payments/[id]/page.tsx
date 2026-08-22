import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { PaymentForm } from "../payment-form";
import { deleteAttachment, deletePayment } from "../actions";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: payment }, { data: accounts }, { data: payees }, { data: categories }] =
    await Promise.all([
      supabase.from("payments").select("*").eq("id", id).single(),
      supabase.from("bank_accounts").select("id, bank_name, account_alias"),
      supabase.from("payees").select("id, name").order("name"),
      supabase.from("categories").select("id, name").order("name"),
    ]);

  if (!payment) notFound();

  const { data: attachments } = await supabase
    .from("payment_attachments")
    .select("*")
    .eq("payment_id", id);

  const attachmentsWithUrls = await Promise.all(
    (attachments ?? []).map(async (attachment) => {
      const { data } = await supabase.storage
        .from("payment-attachments")
        .createSignedUrl(attachment.storage_path, 60 * 10);
      return { ...attachment, url: data?.signedUrl };
    }),
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Editar pago</h1>
        <DeleteButton
          id={payment.id}
          action={deletePayment}
          confirmMessage="¿Eliminar este pago y sus adjuntos? Esta acción no se puede deshacer."
        />
      </div>

      <Card>
        <PaymentForm
          paymentId={payment.id}
          accounts={(accounts ?? []).map((a) => ({
            id: a.id,
            label: `${a.bank_name} — ${a.account_alias}`,
          }))}
          payees={(payees ?? []).map((p) => ({ id: p.id, label: p.name }))}
          categories={(categories ?? []).map((c) => ({ id: c.id, label: c.name }))}
          defaultValues={{
            bankAccountId: payment.bank_account_id,
            payeeId: payment.payee_id,
            categoryId: payment.category_id,
            paymentMethod: payment.payment_method,
            checkNumber: payment.check_number,
            transferReference: payment.transfer_reference,
            amount: payment.amount,
            paymentDate: payment.payment_date,
            status: payment.status,
            description: payment.description,
          }}
        />
      </Card>

      {attachmentsWithUrls.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-medium text-foreground-muted">Adjuntos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {attachmentsWithUrls.map((attachment) => (
              <div key={attachment.id} className="space-y-2">
                <p className="text-xs text-foreground-muted">
                  {attachment.attachment_type === "check_photo"
                    ? "Foto del cheque"
                    : "Foto del recibo"}
                </p>
                {attachment.url && (
                  <a href={attachment.url} target="_blank" rel="noreferrer">
                    <Image
                      src={attachment.url}
                      alt=""
                      width={400}
                      height={300}
                      className="rounded-lg border border-border object-cover"
                      unoptimized
                    />
                  </a>
                )}
                <form action={deleteAttachment}>
                  <input type="hidden" name="attachmentId" value={attachment.id} />
                  <input type="hidden" name="storagePath" value={attachment.storage_path} />
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <button type="submit" className="text-xs text-danger hover:underline">
                    Eliminar adjunto
                  </button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
