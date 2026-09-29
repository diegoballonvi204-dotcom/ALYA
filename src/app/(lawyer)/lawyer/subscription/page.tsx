import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyLawyerSubscriptionAction, getSubscriptionPlansAction } from "@/actions/subscription.actions";
import LawyerTierBadge from "@/components/lawyer/LawyerTierBadge";
import {
  Zap,
  Crown,
  ShieldCheck,
  Check,
  Clock,
  Sparkles,
  Calendar,
  CreditCard,
  QrCode,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default async function LawyerSubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/lawyer/subscription");
  }

  // 1. Obtener perfil de abogado
  const { data: lawyer } = await supabase
    .from("lawyer_profiles")
    .select("*, profiles(*)")
    .eq("user_id", user.id)
    .single();

  if (!lawyer) {
    redirect("/onboarding/lawyer");
  }

  // 2. Obtener suscripción y catálogo de planes
  const [subRes, plansRes] = await Promise.all([
    getMyLawyerSubscriptionAction(),
    getSubscriptionPlansAction(),
  ]);

  const subscription = subRes.subscription;
  const defaultStarterPlan = {
    id: "starter",
    tier: "starter" as const,
    name: "Plan Básico Colegiado",
    description: "Plan de inicio para abogados verificados con cuota mensual básica.",
    price_pen: 0,
    billing_period: "free" as const,
    match_quota: 3,
    storage_limit_mb: 100,
    has_ai_assistant: false,
    has_whatsapp_alerts: false,
    has_radar_priority: false,
    boost_multiplier: 1.0,
    max_team_members: 1,
    gateway_plan_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  const currentPlan = subRes.plan || defaultStarterPlan;
  const daysRemaining = subRes.daysRemaining ?? 30;
  const matchesUsed = subscription?.matches_used_this_period ?? 0;
  const maxQuota = currentPlan.match_quota ?? 3;
  const quotaPercentage = Math.min(100, Math.round((matchesUsed / maxQuota) * 100));

  return (
    <div className="w-full max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-10">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-[#0F172A] font-serif">
              Membresía y Facturación
            </h1>
            <LawyerTierBadge tier={currentPlan.tier} size="md" />
          </div>
          <p className="text-sm text-slate-500">
            Administra tu plan profesional, cuota de postulaciones a casos y comprobantes fiscales.
          </p>
        </div>

        <Link
          href="/lawyer/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs shrink-0 self-start md:self-auto"
        >
          Volver al Dashboard
        </Link>
      </div>

      {/* Banner de Estado de Suscripción */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tarjeta de Plan Actual */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Plan Vigente
            </span>
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">{currentPlan.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {subscription?.status === "trialing"
                    ? "Período de prueba gratuito activo"
                    : currentPlan.price_pen === 0
                    ? "Acceso básico para colegiados"
                    : `Facturación ${currentPlan.billing_period === "annual" ? "anual" : "mensual"}`}
                </p>
              </div>
              <span className="text-2xl font-extrabold text-[#0F172A] font-serif">
                S/ {currentPlan.price_pen}
              </span>
            </div>

            <div className="pt-2 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span>Estado de cuenta:</span>
                <span className="font-bold text-emerald-600 capitalize">
                  {subscription?.status === "trialing" ? "Prueba PRO (100% Bonificado)" : "Activo"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Días restantes de ciclo:</span>
                <span className="font-bold text-[#0F172A] font-mono">{daysRemaining} días</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta de Cuota de Matches */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Cuota de Contactos (Mes Actual)
            </span>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-[#0F172A] font-serif">
                {matchesUsed} <span className="text-lg font-normal text-slate-400">/ {maxQuota === 9999 ? "∞" : maxQuota}</span>
              </div>
              <span className="text-xs font-bold font-mono text-blue-600">
                {maxQuota === 9999 ? "Ilimitado" : `${maxQuota - matchesUsed} disponibles`}
              </span>
            </div>

            {/* Barra de Progreso */}
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    quotaPercentage >= 100
                      ? "bg-rose-500"
                      : quotaPercentage >= 75
                      ? "bg-amber-500"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${Math.min(100, quotaPercentage)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {quotaPercentage >= 100
                  ? "Has alcanzado el tope mensual. Actualiza tu plan para seguir postulando a casos."
                  : "La cuota se renueva automáticamente con cada ciclo de facturación."}
              </p>
            </div>
          </div>
        </div>

        {/* Tarjeta de Ventajas Activas */}
        <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-blue-50/70 via-white to-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Beneficios Desbloqueados
            </span>
            <ul className="text-xs text-slate-700 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Boost de visibilidad <strong>{currentPlan.boost_multiplier}x</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bóveda documental: <strong>{currentPlan.storage_limit_mb >= 1024 ? `${currentPlan.storage_limit_mb / 1024} GB` : `${currentPlan.storage_limit_mb} MB`}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Asistente IA: <strong>{currentPlan.has_ai_assistant ? "Habilitado" : "Básico"}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Alertas WhatsApp: <strong>{currentPlan.has_whatsapp_alerts ? "Inmediatas" : "Inactivo"}</strong></span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Planes Disponibles para Upgrade */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] font-serif">
            Escala tu Plan Profesional
          </h2>
          <p className="text-sm text-slate-500">
            Aumenta tu volumen de casos, automatiza respuestas y posiciona tu firma en las primeras recomendaciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan Starter */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-xs font-bold text-slate-700">
                Plan Colegiado
              </span>
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">Básico</h3>
                <p className="text-xs text-slate-500">Para iniciar o mantener presencia profesional</p>
              </div>
              <div className="text-3xl font-extrabold text-[#0F172A] font-serif">
                S/ 0 <span className="text-xs text-slate-400 font-normal">/ gratis</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2.5 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-slate-400" />
                  <span>3 postulaciones / matches al mes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-slate-400" />
                  <span>Perfil colegiado verificado</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-slate-400" />
                  <span>Chat seguro con el cliente</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              {currentPlan.tier === "starter" ? (
                <span className="w-full inline-block text-center rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-500">
                  Plan Actual
                </span>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-400"
                >
                  Plan de Inicio
                </button>
              )}
            </div>
          </div>

          {/* Plan PRO */}
          <div className="relative rounded-3xl border-2 border-blue-600 bg-linear-to-b from-blue-50/50 via-white to-white p-6 sm:p-8 flex flex-col justify-between shadow-md">
            <div className="absolute -top-3.5 right-6 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Más Popular
            </div>

            <div className="space-y-4">
              <span className="rounded-full bg-blue-100 border border-blue-200 px-3 py-0.5 text-xs font-bold text-blue-700">
                Plan Profesional
              </span>
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">ALYA Pro</h3>
                <p className="text-xs text-slate-500">Para abogados litigantes independientes</p>
              </div>
              <div className="text-3xl font-extrabold text-[#0F172A] font-serif">
                S/ 89 <span className="text-xs text-slate-400 font-normal">/ mes</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2.5 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>30 contactos al mes</strong> con clientes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>Alertas inmediatas en WhatsApp</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>Boost de visibilidad 1.5x</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>Asistente Legal IA</strong> (resumen de casos)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Insignia oficial <strong>PRO ⚡</strong></span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              {currentPlan.tier === "pro" ? (
                <span className="w-full inline-block text-center rounded-xl bg-blue-100 py-2.5 text-xs font-bold text-blue-700">
                  Plan Activo
                </span>
              ) : (
                <a
                  href="#metodos-pago"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs transition-all shadow-sm"
                >
                  <span>Suscribirme a Pro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Plan Élite */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <span className="rounded-full bg-amber-100 border border-amber-200 px-3 py-0.5 text-xs font-bold text-amber-800">
                Firma Jurídica
              </span>
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">Élite Estudio</h3>
                <p className="text-xs text-slate-500">Para bufetes, boutiques y socios</p>
              </div>
              <div className="text-3xl font-extrabold text-[#0F172A] font-serif">
                S/ 249 <span className="text-xs text-slate-400 font-normal">/ mes</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2.5 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Matches ilimitados</strong> en todo el Perú</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Radar VIP:</strong> casos urgentes 15m antes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Multi-cuenta:</strong> hasta 5 abogados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>CRM Kanban completo</strong> + métricas ROI</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Bóveda documental de <strong>50 GB</strong></span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              {currentPlan.tier === "elite" ? (
                <span className="w-full inline-block text-center rounded-xl bg-amber-100 py-2.5 text-xs font-bold text-amber-800">
                  Plan Activo
                </span>
              ) : (
                <a
                  href="#metodos-pago"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-[#0F172A] font-bold py-2.5 text-xs transition-all shadow-xs"
                >
                  <span>Elegir Plan Élite</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Métodos de Pago y Facturación SUNAT */}
      <div id="metodos-pago" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
        <div>
          <h3 className="text-xl font-bold text-[#0F172A] font-serif">
            Métodos de Pago y Comprobantes SUNAT
          </h3>
          <p className="text-xs text-slate-500">
            Aceptamos tarjetas de crédito/débito en Soles y transferencias directas con Boleta o Factura electrónica deducible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opción 1: Tarjeta */}
          <div className="rounded-2xl border border-slate-200 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-blue-50 text-blue-700 p-2.5">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Tarjeta de Crédito o Débito</h4>
                <p className="text-xs text-slate-500">Visa, Mastercard, Diners y Amex (Mercado Pago)</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cobro recurrente mensual o anual automatizado. Facturación electrónica inmediata a tu correo electrónico.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                🔒 Procesamiento Seguro PCI-DSS Nivel 1
              </span>
            </div>
          </div>

          {/* Opción 2: Yape / BCP */}
          <div className="rounded-2xl border border-slate-200 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-purple-50 text-purple-700 p-2.5">
                <QrCode className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Yape, Plin o Transferencia BCP</h4>
                <p className="text-xs text-slate-500">Ideal para planes semestrales y anuales con descuento</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transfiere directamente a la cuenta corriente institucional de ALYA Perú y adjunta tu comprobante para activación prioritaria en menos de 2 horas.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700">
                📲 Soporte y Activación Rápida por WhatsApp
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
