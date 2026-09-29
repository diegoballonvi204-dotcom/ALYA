import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import VerificationDecisionModal from "@/components/admin/VerificationDecisionModal";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Phone,
  Calendar,
} from "lucide-react";

export default async function VerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/admin/verifications/${id}`);
  }

  // 1. Obtener registro de verificación completo
  const { data: verification } = await supabase
    .from("verifications")
    .select(`
      id,
      identity_status,
      bar_status,
      documents_metadata,
      rejection_reason,
      created_at,
      updated_at,
      lawyer_profiles!inner (
        id,
        user_id,
        bar_number,
        bar_association,
        professional_title,
        years_experience,
        verification_status,
        profiles (
          first_name,
          last_name,
          city,
          phone
        )
      )
    `)
    .eq("id", id)
    .single();

  if (!verification) {
    notFound();
  }

  const lawyer = verification.lawyer_profiles;
  const profile = lawyer.profiles;
  const docs = (verification.documents_metadata as any) || {};

  // 2. Generar Signed URLs seguras para cada documento
  const signedUrls: Record<string, string | null> = {};
  for (const [key, path] of Object.entries(docs)) {
    if (typeof path === "string" && path.length > 0) {
      const { data } = await supabase.storage
        .from("verification-documents")
        .createSignedUrl(path, 3600);
      signedUrls[key] = data?.signedUrl || null;
    }
  }

  // Link de búsqueda oficial CAL
  const calLookupUrl = `https://portal.cal.org.pe/consultas/abogados-colegiados`;

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/verifications"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la bandeja de verificaciones
        </Link>

        <span className="text-xs text-slate-500 font-mono">
          Expediente ID: {verification.id.slice(0, 8)}
        </span>
      </div>

      {/* Lawyer Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-bold text-blue-700 font-mono">
              {lawyer.bar_number}
            </span>
            <span className="text-xs text-slate-500 font-semibold">{lawyer.bar_association}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif">
            {profile.first_name} {profile.last_name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600">
            {lawyer.professional_title} • {lawyer.years_experience} años de experiencia auditada
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {profile.city}
            </span>
            {profile.phone && (
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {profile.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Ingreso: {new Date(verification.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Decision Toolbar */}
        <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Estado actual:</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase border ${
                verification.bar_status === "verified"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : verification.bar_status === "observed"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {verification.bar_status}
            </span>
          </div>

          <VerificationDecisionModal
            verificationId={verification.id}
            lawyerName={`${profile.first_name} ${profile.last_name}`}
            barNumber={`${lawyer.bar_association} ${lawyer.bar_number}`}
            currentStatus={verification.bar_status}
          />
        </div>
      </div>

      {/* Official College Cross-check Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Validación en Padrón Oficial:</strong> Coteja la matrícula{" "}
            <strong className="text-blue-900 font-mono">{lawyer.bar_number}</strong> para
            confirmar su condición de <em>"Activo y Habilitado"</em>.
          </span>
        </div>
        <a
          href={calLookupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-4 py-2 text-xs font-bold text-white transition-colors shrink-0 shadow-sm"
        >
          Consultar Padrón CAL ↗
        </a>
      </div>

      {/* Observation Notice if any */}
      {verification.rejection_reason && (
        <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4 text-xs text-slate-800">
          <strong>Observación vigente:</strong> {verification.rejection_reason}
        </div>
      )}

      {/* Document Inspection Gallery */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#0F172A] font-serif">Documentos de Colegiatura e Identidad</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DNI Frontal */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">1. DNI — Anverso (Frontal)</span>
              {signedUrls.dni_front && (
                <a
                  href={signedUrls.dni_front}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#2563EB] hover:underline font-bold inline-flex items-center gap-1"
                >
                  Abrir alta resolución <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {signedUrls.dni_front ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src={signedUrls.dni_front}
                  alt="DNI Anverso"
                  className="max-h-72 w-auto object-contain rounded"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                Documento no cargado
              </div>
            )}
          </div>

          {/* DNI Posterior */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">2. DNI — Reverso (Posterior)</span>
              {signedUrls.dni_back && (
                <a
                  href={signedUrls.dni_back}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#2563EB] hover:underline font-bold inline-flex items-center gap-1"
                >
                  Abrir alta resolución <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {signedUrls.dni_back ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src={signedUrls.dni_back}
                  alt="DNI Reverso"
                  className="max-h-72 w-auto object-contain rounded"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                Documento no cargado
              </div>
            )}
          </div>

          {/* Carné de Colegiatura */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">
                3. Carné de Colegiatura Oficial (CAL / CAC)
              </span>
              {signedUrls.bar_card && (
                <a
                  href={signedUrls.bar_card}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#2563EB] hover:underline font-bold inline-flex items-center gap-1"
                >
                  Abrir alta resolución <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {signedUrls.bar_card ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src={signedUrls.bar_card}
                  alt="Carné de Colegiatura"
                  className="max-h-72 w-auto object-contain rounded"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                Documento no cargado
              </div>
            )}
          </div>

          {/* Constancia de Habilitación */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">
                4. Constancia de Habilitación (Opcional)
              </span>
              {signedUrls.habilitation_cert && (
                <a
                  href={signedUrls.habilitation_cert}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#2563EB] hover:underline font-bold inline-flex items-center gap-1"
                >
                  Abrir alta resolución <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {signedUrls.habilitation_cert ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src={signedUrls.habilitation_cert}
                  alt="Constancia de Habilitación"
                  className="max-h-72 w-auto object-contain rounded"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                No adjuntada por el profesional
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
