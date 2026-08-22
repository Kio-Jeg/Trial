import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { NewCategoryForm } from "./new-category-form";
import { deleteCategory } from "./actions";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Categorías</h1>
        <p className="text-sm text-foreground-muted">
          Clasifica tus pagos. Puedes agregar tantas como necesites.
        </p>
      </div>

      <Card>
        <NewCategoryForm />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories?.length ? (
          categories.map((category) => (
            <Card key={category.id} className="flex items-center justify-between">
              <p className="font-medium">{category.name}</p>
              <DeleteButton
                id={category.id}
                action={deleteCategory}
                confirmMessage="¿Eliminar esta categoría? Los pagos existentes quedarán sin categoría."
              />
            </Card>
          ))
        ) : (
          <p className="text-sm text-foreground-muted">Aún no tienes categorías.</p>
        )}
      </div>
    </div>
  );
}
