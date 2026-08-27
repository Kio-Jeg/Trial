import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PrintButton } from "@/components/print-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/validations";

export default async function PaymentReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payments")
    .select(
      "*, payees(name), categories(name), bank_accounts(bank_name, account_alias, account_number_last4)",
    )
    .eq("id", id)
    .single();

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

  const checkPhotos = attachmentsWithUrls.filter((a) => a.attachment_type === "check_photo");
  const receiptPhotos = attachmentsWithUrls.filter((a) => a.attachment_type === "receipt_photo");

  const referenceLabel = payment.payment_method === "check" ? "N° de cheque" : "Referencia";
  const referenceValue = payment.payment_method === "check"
    ? payment.check_number
    : payment.transfer_reference;

  const fields: [string, string][] = [
    ["Método de pago", paymentMethodLabels[payment.payment_method]],
    [referenceLabel, referenceValue ?? "—"],
    ["Monto", formatCurrency(payment.amount, payment.currency)],
    ["Fecha del pago", formatDate(payment.payment_date)],
    ["Estado", paymentStatusLabels[payment.status]],
    ["Beneficiario", payment.payees?.name ?? "—"],
    ["Categoría", payment.categories?.name ?? "—"],
    [
      "Cuenta bancaria",
      payment.bank_accounts
        ? `${payment.bank_accounts.bank_name} — ${payment.bank_accounts.account_alias}${payment.bank_accounts.account_number_last4 ? ` (····${payment.bank_accounts.account_number_last4})` : ""}`
        : "—",
    ],
    ["Descripción", payment.description ?? "—"],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 bg-background text-foreground print:bg-white print:text-black">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold">Reporte de pago</h1>
        <PrintButton />
      </div>

      <Card className="print:border-0 print:p-0 print:shadow-none">
        <h2 className="mb-1 text-lg font-semibold">Reporte de pago</h2>
        <p className="mb-4 text-xs text-foreground-muted print:text-neutral-500">
          Generado el {new Intl.DateTimeFormat("es-SV", { dateStyle: "long", timeStyle: "short" }).format(new Date())}
        </p>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {fields.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-foreground-muted print:text-neutral-500">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <ReportImageSection
        title={payment.payment_method === "check" ? "Foto(s) del cheque" : "Foto(s) de la transferencia"}
        photos={checkPhotos}
      />
      <ReportImageSection title="Foto(s) del recibo" photos={receiptPhotos} />
    </div>
  );
}

function ReportImageSection({
  title,
  photos,
}: {
  title: string;
  photos: { id: string; url?: string }[];
}) {
  return (
    <Card className="break-inside-avoid print:border-0 print:p-0 print:shadow-none">
      <h3 className="mb-3 text-sm font-medium text-foreground-muted print:text-neutral-600">
        {title}
      </h3>
      {photos.length === 0 ? (
        <p className="text-sm text-foreground-muted">Sin archivos cargados.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {photos.map(
            (photo) =>
              photo.url && (
                <Image
                  key={photo.id}
                  src={photo.url}
                  alt=""
                  width={500}
                  height={375}
                  className="w-full rounded-lg border border-border object-contain print:border-neutral-300"
                  unoptimized
                />
              ),
          )}
        </div>
      )}
    </Card>
  );
}
