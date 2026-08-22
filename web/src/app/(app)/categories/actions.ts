"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations";

export async function createCategory(_prevState: unknown, formData: FormData) {
  const parsed = categorySchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: parsed.data.name,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe una categoría con ese nombre" : "No se pudo crear",
    };
  }

  revalidatePath("/categories");
  return { success: true };
}

export async function deleteCategory(_prevState: unknown, formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Solicitud inválida" };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/categories");
  if (error) {
    return { error: "No se pudo eliminar la categoría." };
  }
  return { success: true };
}
