"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { paymentSchema } from "@/lib/validations";
import type { Database } from "@/lib/supabase/types";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

function validateAttachment(file: File | null): string | null {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_SIZE) return "La imagen no debe superar 8MB";
  if (!ALLOWED_TYPES.includes(file.type)) return "Formato de imagen no soportado";
  return null;
}

async function uploadAttachment(
  supabase: SupabaseClient<Database>,
  userId: string,
  paymentId: string,
  file: File,
  type: "check_photo" | "receipt_photo",
) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${paymentId}/${type}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-attachments")
    .upload(path, file, { contentType: file.type });

  if (uploadError) return;

  await supabase.from("payment_attachments").insert({
    payment_id: paymentId,
    user_id: userId,
    attachment_type: type,
    storage_path: path,
  });
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

  const checkPhoto = formData.get("checkPhoto");
  const receiptPhoto = formData.get("receiptPhoto");
  const checkPhotoFile = checkPhoto instanceof File ? checkPhoto : null;
  const receiptPhotoFile = receiptPhoto instanceof File ? receiptPhoto : null;

  const fileError =
    validateAttachment(checkPhotoFile) ?? validateAttachment(receiptPhotoFile);
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

  if (checkPhotoFile && checkPhotoFile.size > 0) {
    await uploadAttachment(supabase, user.id, payment.id, checkPhotoFile, "check_photo");
  }
  if (receiptPhotoFile && receiptPhotoFile.size > 0) {
    await uploadAttachment(supabase, user.id, payment.id, receiptPhotoFile, "receipt_photo");
  }

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

  const checkPhoto = formData.get("checkPhoto");
  const receiptPhoto = formData.get("receiptPhoto");
  const checkPhotoFile = checkPhoto instanceof File ? checkPhoto : null;
  const receiptPhotoFile = receiptPhoto instanceof File ? receiptPhoto : null;

  const fileError =
    validateAttachment(checkPhotoFile) ?? validateAttachment(receiptPhotoFile);
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

  if (checkPhotoFile && checkPhotoFile.size > 0) {
    await uploadAttachment(supabase, user.id, id, checkPhotoFile, "check_photo");
  }
  if (receiptPhotoFile && receiptPhotoFile.size > 0) {
    await uploadAttachment(supabase, user.id, id, receiptPhotoFile, "receipt_photo");
  }

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
