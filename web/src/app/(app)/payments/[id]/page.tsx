import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
        <div className="flex items-center gap-2">
          <Link href={`/payments/${payment.id}/report`}>
            <Button type="button" variant="secondary">
              Generar reporte
            </Button>
          </Link>
          <DeleteButton
            id={payment.id}
            action={deletePayment}
            confirmMessage="¿Eliminar este pago y sus adjuntos? Esta acción no se puede deshacer."
          />
        </div>
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

      <Card>
        <h2 className="mb-3 text-sm font-medium text-foreground-muted">Adjuntos</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <AttachmentGroup
            title={
              payment.payment_method === "check"
                ? "Fotos del cheque"
                : "Fotos de la transferencia"
            }
            attachments={attachmentsWithUrls.filter((a) => a.attachment_type === "check_photo")}
            paymentId={payment.id}
          />
          <AttachmentGroup
            title="Fotos del recibo"
            attachments={attachmentsWithUrls.filter((a) => a.attachment_type === "receipt_photo")}
            paymentId={payment.id}
          />
        </div>
      </Card>
    </div>
  );
}

function AttachmentGroup({
  title,
  attachments,
  paymentId,
}: {
  title: string;
  attachments: { id: string; url?: string; storage_path: string }[];
  paymentId: string;
}) {
  const hasFiles = attachments.length > 0;

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium">
        {hasFiles ? (
          <span className="text-success">✓ {title} ({attachments.length})</span>
        ) : (
          <span className="text-foreground-muted">○ {title} — sin archivos</span>
        )}
      </p>
      {hasFiles && (
        <div className="flex flex-wrap gap-3">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="space-y-1">
              {attachment.url && (
                <a href={attachment.url} target="_blank" rel="noreferrer">
                  <Image
                    src={attachment.url}
                    alt=""
                    width={140}
                    height={140}
                    className="h-28 w-28 rounded-lg border border-border object-cover"
                    unoptimized
                  />
                </a>
              )}
              <form action={deleteAttachment}>
                <input type="hidden" name="attachmentId" value={attachment.id} />
                <input type="hidden" name="storagePath" value={attachment.storage_path} />
                <input type="hidden" name="paymentId" value={paymentId} />
                <button type="submit" className="text-xs text-danger hover:underline">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
