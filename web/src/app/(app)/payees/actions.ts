"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { payeeSchema } from "@/lib/validations";

export async function createPayee(_prevState: unknown, formData: FormData) {
  const parsed = payeeSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const { error } = await supabase.from("payees").insert({
    user_id: user.id,
    name: parsed.data.name,
    notes: parsed.data.notes || null,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe un beneficiario con ese nombre" : "No se pudo crear",
    };
  }

  revalidatePath("/payees");
  return { success: true };
}

export async function deletePayee(_prevState: unknown, formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Solicitud inválida" };

  const supabase = await createClient();
  const { error } = await supabase.from("payees").delete().eq("id", id);
  revalidatePath("/payees");
  if (error) {
    return { error: "No se pudo eliminar el beneficiario." };
  }
  return { success: true };
}
