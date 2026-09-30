import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Briefcase, Star, MapPin, CheckCircle, Clock, Zap } from "lucide-react";
import CompatibleCaseCard from "@/components/lawyer/CompatibleCaseCard";
import LawyerTierBadge from "@/components/lawyer/LawyerTierBadge";
import SubscriptionExpiryBanner from "@/components/lawyer/SubscriptionExpiryBanner";
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

  // 1.1 Obtener suscripción del abogado
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

  // 3. Obtener matches persistidos del abogado (con created_at de casos)
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
        specialties (name)
      )
    `)
    .eq("lawyer_id", lawyer.id)
    .neq("status", "discarded")
    .order("score", { ascending: false })
    .limit(12);

  // 4. Si no hay matches directos, buscar casos abiertos afines a sus especialidades
  let rawCases: Array<{
    caseItem: any;
    matchInfo?: any;
  }> = [];

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
      .select("*, specialties(name)")
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
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-8">
      {/* Alerta Preventiva de Vencimiento de Membresía / Gracia */}
      <SubscriptionExpiryBanner
        status={subRes.subscription?.status || "active"}
        daysRemaining={subRes.daysRemaining ?? 30}
        planName={currentPlan.name}
        tier={currentPlan.tier}
      />
      {/* Onboarding Complete Success Toast */}
      {params.onboarding === "complete" && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>
            ¡Tu perfil profesional ha sido configurado con éxito! Nuestro equipo revisará tus credenciales colegiadas para habilitar la insignia de verificación completa.
          </span>
        </div>
      )}

      {/* Verification Notice Banner */}
      {lawyer.verification_status === "pending" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 shrink-0 text-blue-600" />
            <span>
              <strong>Verificación en Proceso:</strong> Tu matrícula ({lawyer.bar_number} - {lawyer.bar_association}) está en cola de revisión para validar tu habilitación en el Colegio de Abogados.
            </span>
          </div>
          <span className="rounded-full bg-blue-100 border border-blue-200 px-3 py-0.5 font-bold uppercase text-[10px] text-blue-800">
            En Revisión
          </span>
        </div>
      )}

      {/* Lawyer Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <LawyerTierBadge tier={currentPlan.tier} size="sm" />
            <span className="text-xs text-slate-500 font-mono">
              {lawyer.bar_association} • Matrícula: {lawyer.bar_number}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif">
            {lawyer.profiles?.first_name} {lawyer.profiles?.last_name}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl line-clamp-2">
            {lawyer.bio}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-mono text-blue-600 font-bold">
              <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
              {lawyer.rating_average.toFixed(1)} ({lawyer.total_reviews} valoraciones)
            </span>
            <span>•</span>
            <span>{lawyer.years_experience} años de experiencia</span>
            <span>•</span>
            <span>Tarifa consulta: {lawyer.consultation_price ? `S/. ${lawyer.consultation_price}` : "A convenir"}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/lawyer/subscription"
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-blue-600" />
            <span>Membresía: {matchesUsed}/{maxQuota === 9999 ? "∞" : maxQuota}</span>
          </Link>
          <Link
            href="/lawyer/profile"
            className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#0F172A] transition-colors shadow-sm"
          >
            Editar mi perfil
          </Link>
        </div>
      </div>

      {/* Especialidades Registradas */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 font-mono">
          Tus Especialidades de Práctica
        </h3>
        <div className="flex flex-wrap gap-2">
          {lawyerSpecialties?.map((ls: any) => (
            <span
              key={ls.id}
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold ${
                ls.is_primary
                  ? "border-blue-200 bg-blue-50 text-blue-800"
                  : "border-slate-200 bg-white text-slate-700 shadow-xs"
              }`}
            >
              {ls.specialties?.name} ({ls.experience_years} años)
              {ls.is_primary && " ⭐"}
            </span>
          ))}
        </div>
      </div>

      {/* Casos Compatibles Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] font-serif">
              Casos Jurídicos Compatibles
            </h2>
            <p className="text-xs text-slate-500">
              Personas que buscan asesoría afín a tus especialidades registradas.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 font-bold">
            {displayCases.length} disponibles
          </span>
        </div>

        {displayCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayCases.map((item) => (
              <CompatibleCaseCard
                key={item.caseItem.id}
                caseItem={item.caseItem}
                matchInfo={item.matchInfo}
                isRadarVip={item.isRadarVip}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-base font-bold text-[#0F172A] font-serif">
              No hay casos nuevos en tus áreas en este momento
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Te notificaremos en cuanto un usuario publique un problema legal afín a tu especialidad.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
