import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VerificationForm from "@/components/lawyer/VerificationForm";
import { ShieldCheck, FileCheck, Clock, AlertCircle, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

export default async function LawyerVerificationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/lawyer/verification");
  }

  // 1. Obtener perfil de abogado
  const { data: lawyer } = await supabase
    .from("lawyer_profiles")
    .select(`
      id,
      bar_association,
      bar_number,
      verification_status,
      profiles (
        first_name,
        last_name
      )
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!lawyer) {
    redirect("/onboarding/lawyer");
  }

  // 2. Obtener registro de verificación si existe
  const { data: verification } = await supabase
    .from("verifications")
    .select("documents_metadata, rejection_reason")
    .eq("lawyer_id", lawyer.id)
    .maybeSingle();

  const status = lawyer.verification_status;
  const docsMetadata = (verification?.documents_metadata as any) || {};

  return (
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/lawyer/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
          Volver a mi consola
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 shadow-xs">
          <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
          Almacenamiento Cifrado Ley N.° 29733
        </span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#2563EB] uppercase font-mono">
            Verificación Profesional
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {lawyer.bar_association} • CAL {lawyer.bar_number}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mt-1.5 font-serif">
          Validación de Colegiatura e Identidad
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Valida tu habilitación activa ante tu Colegio de Abogados para obtener la insignia
          oficial de profesional verificado y ser recomendado a clientes con casos afines.
        </p>
      </div>

      {/* Verification Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`rounded-2xl border p-5 transition-all shadow-xs ${
            docsMetadata.dni_front
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold mb-1 font-mono">
            <FileCheck className="w-4 h-4 text-[#2563EB]" />
            <span>1. Carga Documental</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {docsMetadata.dni_front
              ? "Expediente adjuntado con éxito."
              : "Adjunta DNI y Carné de Colegiatura."}
          </p>
        </div>

        <div
          className={`rounded-2xl border p-5 transition-all shadow-xs ${
            status === "in_review"
              ? "border-blue-300 bg-blue-50/70 text-blue-950 ring-1 ring-blue-300"
              : status === "verified"
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold mb-1 font-mono">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span>2. Validación en Padrón</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {status === "in_review"
              ? "En revisión por nuestro equipo de moderación."
              : status === "verified"
              ? "Cotejado con padrón oficial."
              : "En espera de documentos."}
          </p>
        </div>

        <div
          className={`rounded-2xl border p-5 transition-all shadow-xs ${
            status === "verified"
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold mb-1 font-mono">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span>3. Habilitación Oficial</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {status === "verified"
              ? "Insignia oficial activa en el directorio."
              : "Pendiente de dictamen final."}
          </p>
        </div>
      </div>

      {/* Main Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <h2 className="text-base font-bold text-[#0F172A] mb-1 font-serif">
          Expediente Documental de Colegiatura
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Los archivos son almacenados en buckets privados y solo son accesibles por personal
          autorizado bajo la Ley N.° 29733 de Protección de Datos Personales.
        </p>

        <VerificationForm
          lawyerId={lawyer.id}
          userId={user.id}
          existingDocs={docsMetadata}
          status={status}
          rejectionReason={verification?.rejection_reason}
        />
      </div>
    </div>
  );
}
