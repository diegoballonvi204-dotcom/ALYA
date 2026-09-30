"use client";

import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight, Zap, RefreshCw } from "lucide-react";

interface SubscriptionExpiryBannerProps {
  status: string;
  daysRemaining: number;
  planName: string;
  tier: string;
}

export default function SubscriptionExpiryBanner({
  status,
  daysRemaining,
  planName,
  tier,
}: SubscriptionExpiryBannerProps) {
  // 1. Caso Past Due (Periodo de gracia)
  if (status === "past_due") {
    return (
      <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4 sm:p-5 text-rose-950 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900 font-serif">
              Membresía en Periodo de Gracia por Pago Pendiente
            </h4>
            <p className="text-xs text-rose-700 leading-relaxed mt-0.5">
              Tu renovación de membresía no pudo procesarse. Dispones de <strong>3 días de gracia</strong> antes de que tu cuenta sea ajustada al Plan Básico y se suspendan el Asistente IA y los contactos mensuales.
            </p>
          </div>
        </div>

        <Link
          href="/lawyer/subscription#metodos-pago"
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Regularizar Pago</span>
        </Link>
      </div>
    );
  }

  // 2. Caso Trialing por vencer (5 días o menos)
  if (status === "trialing" && daysRemaining <= 5) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5 text-amber-950 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5 sm:mt-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 font-serif">
              Tu Período de Prueba PRO concluye en {daysRemaining === 0 ? "menos de 24 horas" : `${daysRemaining} día(s)`}
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
              Asegura tu suscripción profesional para no perder el <strong>Asistente Legal IA</strong>, el <strong>Radar VIP de casos urgentes</strong> y tus <strong>30 postulaciones mensuales</strong>.
            </p>
          </div>
        </div>

        <Link
          href="/lawyer/subscription"
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-amber-200" />
          <span>Asegurar Plan Pro (S/ 89)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // 3. Caso Active por vencer (3 días o menos para planes pagos)
  if (status === "active" && tier !== "starter" && daysRemaining <= 3) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-blue-950 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-900">
            <strong>Próxima renovación de ciclo:</strong> Tu {planName} se renovará en {daysRemaining === 0 ? "menos de 24 horas" : `${daysRemaining} días`}. Revisa tus comprobantes o métodos de pago en tu panel de membresía.
          </p>
        </div>

        <Link
          href="/lawyer/subscription"
          className="text-xs font-bold text-blue-700 hover:text-blue-900 underline shrink-0"
        >
          Ver Membresía →
        </Link>
      </div>
    );
  }

  return null;
}
