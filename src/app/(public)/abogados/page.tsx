import { Metadata } from "next";
import { getPublicLawyersAction, getSpecialtiesCatalogAction } from "@/actions/directory.actions";
import { LawyerDirectoryView } from "@/components/directory/LawyerDirectoryView";

export const metadata: Metadata = {
  title: "Directorio de Abogados Colegiados en el Perú | ALYA LegalTech",
  description:
    "Encuentra y consulta abogados colegiados y verificados (CAL/CAA) en Lima, Arequipa y todo el Perú. Asesoría jurídica transparente con custodia de honorarios y videoconsultas protegidas.",
  openGraph: {
    title: "Directorio Oficial de Abogados Colegiados | ALYA Perú",
    description:
      "Perfiles verificados de abogados con número de colegiatura, especialidades, tarifas transparentes y reseñas auditadas.",
    type: "website",
    locale: "es_PE",
  },
};

export default async function PublicLawyersDirectoryPage() {
  const [lawyersRes, specsRes] = await Promise.all([
    getPublicLawyersAction({ limit: 50 }),
    getSpecialtiesCatalogAction(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Directorio Interactivo */}
      <main className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 py-6">
        <LawyerDirectoryView
          initialLawyers={lawyersRes.lawyers || []}
          specialties={specsRes.specialties || []}
        />
      </main>
    </div>
  );
}
