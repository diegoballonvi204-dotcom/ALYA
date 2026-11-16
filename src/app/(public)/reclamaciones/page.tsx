import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { ComplaintsBookForm } from "@/components/legal/ComplaintsBookForm";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones Virtual | ALYA LegalTech Perú",
  description:
    "Libro de Reclamaciones Virtual conforme al Código de Protección y Defensa del Consumidor (Ley N.° 29571 y D.S. N.° 011-2011-PCM).",
};

export default function LibroReclamacionesPage() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-12 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>
        <span className="text-xs font-mono text-slate-500">
          Ley N.° 29571 • D.S. N.° 011-2011-PCM
        </span>
      </div>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 font-mono">
            <BookOpen className="w-3.5 h-3.5" />
            Protección al Consumidor INDECOPI
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-serif">
            Libro de Reclamaciones Virtual
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            ALYA LegalTech Perú • Atención de reclamos y quejas en un plazo máximo de 15 días hábiles improrrogables.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block font-mono">
            Establecimiento Digital
          </span>
          <span className="text-sm font-bold text-slate-900">ALYA Perú</span>
        </div>
      </header>

      <ComplaintsBookForm />
    </div>
  );
}

