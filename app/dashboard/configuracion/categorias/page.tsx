import { CategoriesClient } from "@/components/dashboard/categories-client";

export default function CategoriasPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Categorías y etiquetas</h2>
      <p className="text-zinc-400">Adaptá las categorías de tu negocio. Estas etiquetas alimentan inbox, automatizaciones, campañas y reportes.</p>
      <CategoriesClient />
    </section>
  );
}
