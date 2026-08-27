"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { paymentSchema } from "@/lib/validations";
import type { Database } from "@/lib/supabase/types";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

function getFiles(formData: FormData, field: string): File[] {
  return formData
    .getAll(field)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function validateAttachments(files: File[]): string | null {
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) return "Cada imagen debe pesar máximo 8MB";
    if (!ALLOWED_TYPES.includes(file.type)) return "Formato de imagen no soportado";
  }
  return null;
}

async function uploadAttachments(
  supabase: SupabaseClient<Database>,
  userId: string,
  paymentId: string,
  files: File[],
  type: "check_photo" | "receipt_photo",
) {
  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${paymentId}/${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-attachments")
      .upload(path, file, { contentType: file.type });

    if (uploadError) continue;

    await supabase.from("payment_attachments").insert({
      payment_id: paymentId,
      user_id: userId,
      attachment_type: type,
      storage_path: path,
    });
  }
}

function parsePaymentForm(formData: FormData) {
  return paymentSchema.safeParse({
    paymentMethod: formData.get("paymentMethod"),
    bankAccountId: formData.get("bankAccountId"),
    payeeId: formData.get("payeeId") || "",
    categoryId: formData.get("categoryId") || "",
    checkNumber: formData.get("checkNumber") || "",
    transferReference: formData.get("transferReference") || "",
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
    status: formData.get("status"),
    description: formData.get("description") || "",
  });
}

export async function createPayment(_prevState: unknown, formData: FormData) {
  const parsed = parsePaymentForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const checkPhotoFiles = getFiles(formData, "checkPhoto");
  const receiptPhotoFiles = getFiles(formData, "receiptPhoto");

  const fileError =
    validateAttachments(checkPhotoFiles) ?? validateAttachments(receiptPhotoFiles);
  if (fileError) return { error: fileError };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      bank_account_id: parsed.data.bankAccountId,
      payee_id: parsed.data.payeeId || null,
      category_id: parsed.data.categoryId || null,
      payment_method: parsed.data.paymentMethod,
      check_number: parsed.data.paymentMethod === "check" ? parsed.data.checkNumber : null,
      transfer_reference:
        parsed.data.paymentMethod === "bank_transfer" ? parsed.data.transferReference : null,
      amount: parsed.data.amount,
      payment_date: parsed.data.paymentDate,
      status: parsed.data.status,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();

  if (error || !payment) return { error: "No se pudo crear el pago" };

  await uploadAttachments(supabase, user.id, payment.id, checkPhotoFiles, "check_photo");
  await uploadAttachments(supabase, user.id, payment.id, receiptPhotoFiles, "receipt_photo");

  revalidatePath("/payments");
  redirect(`/payments/${payment.id}`);
}

export async function updatePayment(_prevState: unknown, formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Solicitud inválida" };

  const parsed = parsePaymentForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const checkPhotoFiles = getFiles(formData, "checkPhoto");
  const receiptPhotoFiles = getFiles(formData, "receiptPhoto");

  const fileError =
    validateAttachments(checkPhotoFiles) ?? validateAttachments(receiptPhotoFiles);
  if (fileError) return { error: fileError };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const { error } = await supabase
    .from("payments")
    .update({
      bank_account_id: parsed.data.bankAccountId,
      payee_id: parsed.data.payeeId || null,
      category_id: parsed.data.categoryId || null,
      payment_method: parsed.data.paymentMethod,
      check_number: parsed.data.paymentMethod === "check" ? parsed.data.checkNumber : null,
      transfer_reference:
        parsed.data.paymentMethod === "bank_transfer" ? parsed.data.transferReference : null,
      amount: parsed.data.amount,
      payment_date: parsed.data.paymentDate,
      status: parsed.data.status,
      description: parsed.data.description || null,
    })
    .eq("id", id);

  if (error) return { error: "No se pudo actualizar el pago" };

  await uploadAttachments(supabase, user.id, id, checkPhotoFiles, "check_photo");
  await uploadAttachments(supabase, user.id, id, receiptPhotoFiles, "receipt_photo");

  revalidatePath("/payments");
  revalidatePath(`/payments/${id}`);
  redirect(`/payments/${id}`);
}

export async function deletePayment(_prevState: unknown, formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Solicitud inválida" };

  const supabase = await createClient();

  const { data: attachments } = await supabase
    .from("payment_attachments")
    .select("storage_path")
    .eq("payment_id", id);

  if (attachments?.length) {
    await supabase.storage
      .from("payment-attachments")
      .remove(attachments.map((a) => a.storage_path));
  }

  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar el pago" };

  revalidatePath("/payments");
  redirect("/payments");
}

export async function deleteAttachment(formData: FormData) {
  const attachmentId = formData.get("attachmentId");
  const storagePath = formData.get("storagePath");
  const paymentId = formData.get("paymentId");
  if (typeof attachmentId !== "string" || typeof storagePath !== "string") return;

  const supabase = await createClient();
  await supabase.storage.from("payment-attachments").remove([storagePath]);
  await supabase.from("payment_attachments").delete().eq("id", attachmentId);

  if (typeof paymentId === "string") revalidatePath(`/payments/${paymentId}`);
}
