"use client";

import { useState } from "react";
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  X,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface SubscriptionUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: "QUOTA_EXCEEDED" | "FEATURE_LOCKED" | "MANUAL";
  currentUsage?: number;
  maxQuota?: number;
}

export default function SubscriptionUpgradeModal({
  isOpen,
  onClose,
  reason = "QUOTA_EXCEEDED",
  currentUsage = 3,
  maxQuota = 3,
}: SubscriptionUpgradeModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xl overflow-hidden my-8">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-1/4 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header del Modal */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-bold text-blue-700">
            <Zap className="w-3.5 h-3.5 text-blue-600 fill-current" />
            <span>Membresías Profesionales ALYA</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif">
            {reason === "QUOTA_EXCEEDED"
              ? "Has alcanzado tu límite mensual de contactos"
              : "Desbloquea todo el potencial de ALYA Perú"}
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed">
            {reason === "QUOTA_EXCEEDED" ? (
              <span>
                Has completado las <strong>{currentUsage} de {maxQuota} postulaciones gratuitas</strong> de este mes.
                Actualiza a <strong>ALYA Pro</strong> para acceder a 30 postulaciones, alertas inmediatas por WhatsApp y el Asistente Legal IA.
              </span>
            ) : (
              "Elige el plan ideal para tu práctica jurídica y multiplica tus posibilidades de captar clientes calificados."
            )}
          </p>

          {/* Toggle Mensual / Anual */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <span
              className={`text-xs font-bold ${
                billingPeriod === "monthly" ? "text-[#0F172A]" : "text-slate-400"
              }`}
            >
              Mensual
            </span>
            <button
              type="button"
              onClick={() =>
                setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")
              }
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-200 transition-colors duration-200 ease-in-out focus:outline-hidden"
              style={{
                backgroundColor: billingPeriod === "annual" ? "#2563EB" : "#CBD5E1",
              }}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  billingPeriod === "annual" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-xs font-bold flex items-center gap-1 ${
                billingPeriod === "annual" ? "text-blue-600" : "text-slate-400"
              }`}
            >
              Anual
              <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                Ahorra 25%
              </span>
            </span>
          </div>
        </div>

        {/* Tarjetas de Planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Plan Profesional (Recomendado) */}
          <div className="relative rounded-3xl border-2 border-blue-600 bg-linear-to-b from-blue-50/50 via-white to-white p-6 sm:p-8 shadow-lg flex flex-col justify-between">
            <div className="absolute -top-3.5 right-6 rounded-full bg-blue-600 px-3.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Recomendado
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-blue-100 text-blue-700 p-2">
                  <Zap className="w-5 h-5 fill-current" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Plan Profesional</h3>
                  <p className="text-xs text-slate-500">Para abogados litigantes independientes</p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-serif">
                    {billingPeriod === "monthly" ? "S/ 89" : "S/ 790"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {billingPeriod === "monthly" ? "/ mes" : "/ año"}
                  </span>
                </div>
                {billingPeriod === "annual" && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                    Equivale a S/ 65.80 / mes (ahorras S/ 278 al año)
                  </p>
                )}
              </div>

              <div className="space-y-2.5 pt-4 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-blue-100 p-0.5 text-blue-700">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span><strong>30 contactos/matches al mes</strong> con clientes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-blue-100 p-0.5 text-blue-700">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span><strong>Alertas inmediatas en tu WhatsApp</strong> al publicarse casos</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-blue-100 p-0.5 text-blue-700">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span><strong>Boost de visibilidad 1.5x</strong> en swipe y búsquedas</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-blue-100 p-0.5 text-blue-700">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span><strong>Asistente IA ALYA</strong> (resumen del caso y hechos clave)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-blue-100 p-0.5 text-blue-700">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Insignia oficial <strong>Abogado Verificado PRO ⚡</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-blue-100 p-0.5 text-blue-700">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Bóveda documental segura de <strong>5 GB</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href={`/lawyer/subscription?tier=pro&period=${billingPeriod}`}
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-sm transition-all shadow-md hover:shadow-lg"
              >
                <span>Activar Plan Profesional</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Plan Élite (Estudios) */}
          <div className="relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-amber-100 text-amber-700 p-2">
                  <Crown className="w-5 h-5 fill-current" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Plan Élite</h3>
                  <p className="text-xs text-slate-500">Para estudios y despachos colectivos</p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-serif">
                    {billingPeriod === "monthly" ? "S/ 249" : "S/ 2,290"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {billingPeriod === "monthly" ? "/ mes" : "/ año"}
                  </span>
                </div>
                {billingPeriod === "annual" && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                    Equivale a S/ 190.80 / mes (ahorras S/ 698 al año)
                  </p>
                )}
              </div>

              <div className="space-y-2.5 pt-4 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-slate-100 p-0.5 text-slate-800">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span><strong>Matches y contactos ilimitados</strong> en todo el Perú</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-slate-100 p-0.5 text-slate-800">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span><strong>Radar VIP:</strong> acceso 15 min antes a casos de alta cuantía</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-slate-100 p-0.5 text-slate-800">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span><strong>Multi-cuenta de bufete:</strong> hasta 5 asociados incluidos</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-slate-100 p-0.5 text-slate-800">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span><strong>CRM Jurídico Kanban</strong> con métricas de conversión y ROI</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-slate-100 p-0.5 text-slate-800">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span><strong>Boost de visibilidad 2.5x</strong> (Top Placement)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-slate-100 p-0.5 text-slate-800">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Bóveda documental segura de <strong>50 GB</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href={`/lawyer/subscription?tier=elite&period=${billingPeriod}`}
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-[#0F172A] font-bold py-3 text-sm transition-all shadow-xs"
              >
                <span>Elegir Plan Élite</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer con Garantía */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Factura o Boleta con RUC deducible. Cancela o cambia de plan en cualquier momento.</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-4"
          >
            Continuar con Plan Gratuito
          </button>
        </div>
      </div>
    </div>
  );
}
