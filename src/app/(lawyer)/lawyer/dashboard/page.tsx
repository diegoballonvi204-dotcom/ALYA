import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Briefcase, Star, MapPin, CheckCircle, Clock, Zap, Lock, UploadCloud, Mail, AlertTriangle } from "lucide-react";
import CompatibleCaseCard from "@/components/lawyer/CompatibleCaseCard";
import LawyerCompatibleCasesContainer from "@/components/lawyer/LawyerCompatibleCasesContainer";
import LawyerTierBadge from "@/components/lawyer/LawyerTierBadge";
import SubscriptionExpiryBanner from "@/components/lawyer/SubscriptionExpiryBanner";
import UrgentFlagrancyBanner from "@/components/lawyer/UrgentFlagrancyBanner";
import LawyerActivationCodeForm from "@/components/lawyer/LawyerActivationCodeForm";
import { getMyLawyerSubscriptionAction } from "@/actions/subscription.actions";

export default async function LawyerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Obtener perfil de abogado
  const { data: lawyer } = await supabase
    .from("lawyer_profiles")
    .select("*, profiles(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!lawyer) {
    redirect("/onboarding/lawyer");
  }

  // 1.1 Obtener estado documental de verificación
  const { data: verification } = await supabase
    .from("verifications")
    .select("identity_status, bar_status, documents_metadata, is_code_verified")
    .eq("lawyer_id", lawyer.id)
    .maybeSingle();

  const docsMeta = (verification?.documents_metadata as any) || {};
  const hasUploadedDocs = Boolean(docsMeta.dni_front && docsMeta.bar_card);
  const isApproved = lawyer.verification_status === "verified";
  const isActivated = lawyer.is_activated === true || verification?.is_code_verified === true;
  const canAccessCases = isApproved && isActivated;

  // 1.2 Obtener suscripción del abogado
  const subRes = await getMyLawyerSubscriptionAction();
  const currentPlan = subRes.plan || {
    tier: "starter" as const,
    name: "Básico",
    match_quota: 3,
    has_radar_priority: false,
    has_ai_assistant: false,
  };
  const matchesUsed = subRes.subscription?.matches_used_this_period ?? 0;
  const maxQuota = currentPlan.match_quota ?? 3;
  const hasRadarPriority = currentPlan.has_radar_priority ?? false;

  // 2. Obtener especialidades del abogado
  const { data: lawyerSpecialties } = await supabase
    .from("lawyer_specialties")
    .select("*, specialties(*)")
    .eq("lawyer_id", lawyer.id);

  // 3. Obtener matches persistidos del abogado SOLO SI ESTÁ APROBADO Y ACTIVADO
  let rawCases: Array<{
    caseItem: any;
    matchInfo?: any;
  }> = [];

  if (canAccessCases) {
    const { data: matches } = await supabase
      .from("matches")
      .select(`
        id,
        score,
        user_interest,
        lawyer_interest,
        status,
        conversations (id),
        cases!inner (
          id,
          title,
          description,
          city,
          modality,
          urgency,
          is_confidential,
          created_at,
          status,
          specialties:specialties!cases_specialty_id_fkey (name)
        )
      `)
      .eq("lawyer_id", lawyer.id)
      .neq("status", "discarded")
      .order("score", { ascending: false })
      .limit(12);

    if (matches && matches.length > 0) {
      rawCases = matches.map((m: any) => ({
        caseItem: m.cases,
        matchInfo: {
          id: m.id,
          score: m.score,
          user_interest: m.user_interest,
          lawyer_interest: m.lawyer_interest,
          status: m.status,
          conversation_id: (m.conversations as any)?.id || (m.conversations as any)?.[0]?.id || null,
        },
      }));
    } else {
      const specialtyIds = lawyerSpecialties?.map((ls) => ls.specialty_id) || [];
      const { data: openCases } = await supabase
        .from("cases")
        .select("*, specialties:specialties!cases_specialty_id_fkey(name)")
        .in("specialty_id", specialtyIds.length > 0 ? specialtyIds : [0])
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(10);

      if (openCases) {
        rawCases = openCases.map((c) => ({
          caseItem: c,
          matchInfo: null,
        }));
      }
    }
  }

  // 5. Aplicar lógica de Radar VIP (15 minutos de exclusividad para Élite)
  const isWithin15Min = (createdAtStr?: string) => {
    if (!createdAtStr) return false;
    const diffMinutes = (Date.now() - new Date(createdAtStr).getTime()) / (1000 * 60);
    return diffMinutes >= 0 && diffMinutes < 15;
  };

  const displayCases = rawCases
    .filter((item) => {
      const isUrgent = item.caseItem.urgency === "immediate" || item.caseItem.urgency === "high";
      const isExclusiveTime = isWithin15Min(item.caseItem.created_at);

      // Si es urgente y está dentro de los 15 minutos: solo planes Élite con has_radar_priority
      if (isUrgent && isExclusiveTime && !hasRadarPriority) {
        return false;
      }
      return true;
    })
    .map((item) => {
      const isUrgent = item.caseItem.urgency === "immediate" || item.caseItem.urgency === "high";
      const isExclusiveTime = isWithin15Min(item.caseItem.created_at);
      return {
        ...item,
        isRadarVip: hasRadarPriority && isUrgent && isExclusiveTime,
      };
    });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-8">
      {/* Alerta Preventiva de Vencimiento de Membresía / Gracia */}
      <SubscriptionExpiryBanner
        status={subRes.subscription?.status || "active"}
        daysRemaining={subRes.daysRemaining ?? 30}
        planName={currentPlan.name}
        tier={currentPlan.tier}
      />

      {/* Alerta de Guardia de Flagrancia & Casos Inmediatos (Ventana 48h) - PRIORIDAD 1 */}
      <UrgentFlagrancyBanner />

      {/* Notificaciones del Sistema / Onboarding */}
      {params.onboarding === "complete" && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-xs">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>
            ¡Tu perfil profesional ha sido configurado con éxito! Nuestro equipo revisará tus credenciales colegiadas para habilitar la insignia de verificación completa.
          </span>
        </div>
      )}

      {/* WORKSPACE PRINCIPAL EN 2 COLUMNAS: CASOS COMPATIBLES (SWIPE) O PANTALLA DE BLOQUEO/ACTIVACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA PRINCIPAL (8 COLS): CASOS JURÍDICOS O PANTALLA DE ACTIVACIÓN */}
        <div className="lg:col-span-8 space-y-6">
          {!canAccessCases ? (
            isApproved && !isActivated ? (
              <LawyerActivationCodeForm lawyerEmail={user.email || ""} />
            ) : !hasUploadedDocs ? (
              <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-slate-50 p-7 sm:p-10 shadow-lg space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-0.5 text-xs font-bold uppercase font-mono">
                      Paso Obligatorio
                    </span>
                    <h3 className="text-xl font-bold text-[#0F172A] font-serif mt-1">
                      Carga Documental Requerida para Ver Clientes
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Para garantizar la seguridad de los usuarios y cumplir con la normativa legal, <strong>los abogados registrados deben adjuntar su documentación oficial (DNI y Carné de Colegiatura)</strong> y ser aprobados por la administración antes de acceder a los casos de clientes o configurar su perfil.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1">
                    <p className="font-bold text-slate-800">1. Adjuntar Documentos</p>
                    <p className="text-slate-500">DNI (ambos lados), Carné de Colegiatura y Constancia de Habilitación.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1">
                    <p className="font-bold text-slate-800">2. Aprobación y Código</p>
                    <p className="text-slate-500">Recibirás la confirmación y un código de verificación en tu correo para activar tu cuenta.</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/lawyer/verification"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Subir mi Documentación Oficial Ahora</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-slate-50 p-7 sm:p-10 shadow-lg space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="rounded-full bg-blue-100 text-blue-800 px-3 py-0.5 text-xs font-bold uppercase font-mono">
                      Documentos en Revisión
                    </span>
                    <h3 className="text-xl font-bold text-[#0F172A] font-serif mt-1">
                      Validación Administrativa en Curso
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tus documentos han sido remitidos con éxito. Nuestro equipo de auditoría está verificando tu habilitación y matrícula ante el Colegio de Abogados.
                </p>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Confirmación y Código por Correo</span>
                  </p>
                  <p className="text-slate-600">
                    En cuanto tu expediente sea aprobado, te enviaremos un correo a <strong>{user.email}</strong> con la confirmación de aprobación y tu <strong>código de verificación de 6 dígitos</strong> para activar tu cuenta y desbloquear el acceso a casos.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/lawyer/verification"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-all"
                  >
                    <span>Ver Estado de Mis Documentos</span>
                  </Link>
                </div>
              </div>
            )
          ) : (
            <LawyerCompatibleCasesContainer
              initialCases={displayCases}
              hasRadarPriority={hasRadarPriority}
            />
          )}
        </div>

        {/* COLUMNA LATERAL (4 COLS): IDENTIDAD PROFESIONAL, CUPOS Y ESPECIALIDADES */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Card de Identidad Profesional */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#101828] to-[#1E3A8A] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                  {lawyer.profiles?.first_name?.[0]}
                  {lawyer.profiles?.last_name?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <LawyerTierBadge tier={currentPlan.tier} size="sm" />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-[#0F172A] font-serif leading-snug">
                    {lawyer.profiles?.first_name} {lawyer.profiles?.last_name}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {lawyer.bar_association} • CAL {lawyer.bar_number}
                  </p>
                </div>
              </div>
            </div>

            {/* Métricas Clave del Abogado */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-center gap-1 text-xs font-bold text-blue-600 font-mono">
                  <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                  {lawyer.rating_average.toFixed(1)}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {lawyer.total_reviews} reseñas
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-800 font-mono">
                  {lawyer.years_experience} años
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Experiencia
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-emerald-700 font-mono">
                  {lawyer.consultation_price ? `S/. ${lawyer.consultation_price}` : "Acordar"}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Consulta
                </span>
              </div>
            </div>

            {/* Bio Resumida */}
            {lawyer.bio && (
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {lawyer.bio}
              </p>
            )}

            {/* Consumo de Membresía / Cuota de Matches */}
            <div className="rounded-2xl bg-blue-50/70 border border-blue-200/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  Cupo de Membresía
                </span>
                <span className="font-mono font-bold text-blue-700">
                  {matchesUsed} / {maxQuota === 9999 ? "∞" : maxQuota}
                </span>
              </div>
              <div className="w-full bg-blue-200/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#3157D5] h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${maxQuota === 9999 ? 10 : Math.min(100, (matchesUsed / maxQuota) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-blue-800/80 font-mono">
                  Plan {currentPlan.name}
                </span>
                <Link
                  href="/lawyer/subscription"
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline"
                >
                  Gestionar plan →
                </Link>
              </div>
            </div>

            {/* Botón Configurar Perfil */}
            {canAccessCases ? (
              <Link
                href="/lawyer/profile"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 py-2.5 px-4 text-xs font-bold text-slate-700 shadow-xs transition-colors"
              >
                <span>Configurar mi perfil profesional</span>
              </Link>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Configuración bloqueada hasta aprobación</span>
              </div>
            )}
          </div>

          {/* Card de Especialidades de Práctica */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Especialidades de Práctica
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {lawyerSpecialties?.length || 0} registradas
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {lawyerSpecialties && lawyerSpecialties.length > 0 ? (
                lawyerSpecialties.map((ls: any) => (
                  <span
                    key={ls.id}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium ${
                      ls.is_primary
                        ? "border-blue-200 bg-blue-50 text-blue-800 font-semibold"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {ls.specialties?.name} ({ls.experience_years}a)
                    {ls.is_primary && " ⭐"}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No has registrado especialidades aún.
                </p>
              )}
            </div>
          </div>

          {/* Radar Legal Activo Micro-card */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs text-slate-600 flex items-start gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-1 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-slate-800">Radar Legal Activo:</strong> Recibes alertas prioritarias cuando justiciables publiquen casos en tus especialidades registradas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
