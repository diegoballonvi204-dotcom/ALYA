import { Metadata } from "next";
import { getPublicLawyersAction, getSpecialtiesCatalogAction } from "@/actions/directory.actions";
import { LawyerDirectoryView } from "@/components/directory/LawyerDirectoryView";
import { ShieldCheck, Scale, Award, Sparkles } from "lucide-react";

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
      {/* 1. Hero Header */}
      <section className="bg-white border-b border-slate-200/90 py-12 lg:py-16">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-semibold mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Verificación Oficial CAL / CAA • Ley N.° 29733</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F172A] font-serif leading-tight">
              Directorio de Abogados Colegiados y Verificados en el Perú
            </h1>

            <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed font-sans">
              Explora profesionales del derecho acreditados ante los Colegios de Abogados.
              Compara especialidades, experiencia forense, tarifas transparentes y agenda consultas con custodia garantizada.
            </p>

            <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Matrícula Profesional Auditada
              </span>
              <span className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                Art. 1764 Código Civil
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Videoconsulta de 1 Clic
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Directorio Interactivo */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-10">
        <LawyerDirectoryView
          initialLawyers={lawyersRes.lawyers || []}
          specialties={specsRes.specialties || []}
        />
      </main>
    </div>
  );
}
