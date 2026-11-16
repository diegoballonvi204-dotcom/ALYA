import type { Metadata } from "next";
import Link from "next/link";
import { Scale, ArrowLeft, ShieldCheck, FileText, CreditCard, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y Condiciones | ALYA LegalTech Perú",
  description:
    "Condiciones generales de uso, custodia de honorarios, confidencialidad profesional y responsabilidades en la plataforma ALYA Perú.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-12 py-12 space-y-10">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>
        <span className="text-xs font-mono text-slate-400">Vigente: 2026 • Lima, Perú</span>
      </div>

      <header className="space-y-3 border-b border-slate-200 pb-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full font-mono">
          <Scale className="w-3.5 h-3.5" />
          Marco Contractual ALYA Perú
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-serif">
          Términos y Condiciones de Uso
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          El presente documento regula el acceso y uso de la plataforma tecnológica de intermediación y matching jurídico operada bajo la denominación <strong>ALYA LegalTech Perú</strong>.
        </p>
      </header>

      <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-[#0F172A] font-serif flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>1. Naturaleza de la Plataforma</span>
          </h2>
          <p>
            ALYA LegalTech Perú provee herramientas digitales para conectar a ciudadanos y empresas (Consultantes) con abogados independientes debidamente colegiados y habilitados en el Perú (Abogados). ALYA no constituye un estudio jurídico ni presta patrocinio legal directo; cada asesoría o patrocinio acordado genera una relación profesional directa entre el Consultante y el Abogado elegido.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-[#0F172A] font-serif flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>2. Verificación Colegiada y Normas de Conducta</span>
          </h2>
          <p>
            Los abogados registrados declaran bajo responsabilidad la veracidad de su número de colegiatura (CAL, CAA u otros colegios de abogados del Perú) y su condición de habilitación vigente. ALYA se reserva el derecho de suspender cuentas ante inexactitudes documentales, incumplimiento del Código de Ética del Abogado o quejas fundadas.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-[#0F172A] font-serif flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>3. Custodia de Honorarios (Escrow) y Pagos</span>
          </h2>
          <p>
            Para proteger a ambas partes, las consultas pagadas se canalizan bajo esquema de custodia temporal: el abogado solo puede confirmar e iniciar la consulta cuando el abono en custodia se encuentra acreditado, y la liberación de honorarios al abogado ocurre una vez concluida efectivamente la cita o conforme al convenio de honorarios aceptado.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-[#0F172A] font-serif flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <span>4. Confidencialidad, Propiedad Intelectual y Protección de Datos</span>
          </h2>
          <p>
            El tratamiento de datos personales y el ejercicio de los derechos de Acceso, Rectificación, Cancelación y Oposición se rigen por la Ley N.° 29733 y nuestra{" "}
            <Link href="/privacidad" className="text-blue-600 font-semibold hover:underline">
              Política de Privacidad
            </Link>
            . Para reclamos o quejas respecto del servicio digital prestado por la plataforma, el usuario dispone de nuestro{" "}
            <Link href="/reclamaciones" className="text-blue-600 font-semibold hover:underline">
              Libro de Reclamaciones Virtual
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

