"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bankAccountSchema } from "@/lib/validations";

export async function createBankAccount(_prevState: unknown, formData: FormData) {
  const parsed = bankAccountSchema.safeParse({
    bankName: formData.get("bankName"),
    accountAlias: formData.get("accountAlias"),
    accountNumberLast4: formData.get("accountNumberLast4"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const { error } = await supabase.from("bank_accounts").insert({
    user_id: user.id,
    bank_name: parsed.data.bankName,
    account_alias: parsed.data.accountAlias,
    account_number_last4: parsed.data.accountNumberLast4 || null,
  });

  if (error) return { error: "No se pudo crear la cuenta" };

  revalidatePath("/accounts");
  return { success: true };
}

export async function toggleBankAccountActive(formData: FormData) {
  const id = formData.get("id");
  const isActive = formData.get("isActive") === "true";
  if (typeof id !== "string") return;

  const supabase = await createClient();
  await supabase
    .from("bank_accounts")
    .update({ is_active: !isActive })
    .eq("id", id);
  revalidatePath("/accounts");
}

export async function deleteBankAccount(_prevState: unknown, formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Solicitud inválida" };

  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  revalidatePath("/accounts");
  if (error) {
    return {
      error:
        "No se puede eliminar: la cuenta tiene pagos registrados. Puedes archivarla en su lugar.",
    };
  }
  return { success: true };
}
