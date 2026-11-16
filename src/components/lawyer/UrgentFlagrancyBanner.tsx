"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  getUrgentFlagrancyCasesAction,
  generateEmergencyWhatsAppLinkAction,
  type UrgentFlagrancyCase,
} from "@/actions/urgency-alerts.actions";
import { pluralize } from "@/lib/utils";

interface UrgentFlagrancyBannerProps {
  initialUrgentCases?: UrgentFlagrancyCase[];
}

export default function UrgentFlagrancyBanner({
  initialUrgentCases,
}: UrgentFlagrancyBannerProps) {
  const [urgentCases, setUrgentCases] = useState<UrgentFlagrancyCase[]>(
    initialUrgentCases || []
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(!initialUrgentCases);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    if (initialUrgentCases) {
      setUrgentCases(initialUrgentCases);
      setActiveIndex(0);
      setLoading(false);
      return;
    }

    async function loadUrgentCases() {
      setLoading(true);
      const res = await getUrgentFlagrancyCasesAction();
      if (res.urgentCases) {
        setUrgentCases(res.urgentCases);
      }
      setLoading(false);
    }
    loadUrgentCases();
  }, [initialUrgentCases]);

  const handleOpenWhatsApp = async (caseId: string) => {
    setDispatchingId(caseId);
    setErrorBanner(null);
    try {
      const res = await generateEmergencyWhatsAppLinkAction(caseId);
      if (res.whatsappUrl) {
        window.open(res.whatsappUrl, "_blank", "noopener,noreferrer");
      } else {
        setErrorBanner(res.error || "No se pudo generar enlace de WhatsApp.");
      }
    } catch {
      setErrorBanner("Error al conectar con WhatsApp de emergencia.");
    } finally {
      setDispatchingId(null);
    }
  };

  if (loading || urgentCases.length === 0) {
    return null;
  }

  const safeIndex = Math.min(activeIndex, urgentCases.length - 1);
  const primaryUrgent = urgentCases[safeIndex];
  const isExpired = primaryUrgent.hoursRemainingInFlagrancy <= 0;

  return (
    <div
      className={`w-full rounded-3xl border-2 p-5 sm:p-6 shadow-md relative overflow-hidden ${isExpired
          ? "border-amber-400 bg-gradient-to-r from-amber-50 via-amber-50/80 to-white text-amber-950"
          : "border-rose-400 bg-gradient-to-r from-rose-50 via-rose-50/80 to-white text-rose-950"
        }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-white text-[11px] font-black uppercase tracking-wider font-mono shadow-xs ${isExpired ? "bg-amber-600" : "bg-rose-600 animate-pulse"
                }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {isExpired
                ? "Alerta de Guardia • Plazo 48h Vencido"
                : "Guardia de Flagrancia Activa • Ventana 48h"}
            </span>
            <span
              className={`text-xs font-mono font-bold ${isExpired ? "text-amber-800" : "text-rose-700"
                }`}
            >
              {urgentCases.length}{" "}
              {pluralize(urgentCases.length, "caso crítico", "casos críticos")} en espera
            </span>
            {urgentCases.length > 1 && (
              <div className="inline-flex items-center gap-1 rounded-lg bg-white/80 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => (prev - 1 + urgentCases.length) % urgentCases.length)
                  }
                  aria-label="Caso crítico anterior"
                  className="hover:text-slate-900 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono">
                  {safeIndex + 1}/{urgentCases.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => (prev + 1) % urgentCases.length)}
                  aria-label="Siguiente caso crítico"
                  className="hover:text-slate-900 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold font-serif text-[#0F172A] leading-snug">
            {primaryUrgent.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-700 line-clamp-2 leading-relaxed">
            {primaryUrgent.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-1 font-semibold text-rose-900">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>
                {primaryUrgent.policeStation} ({primaryUrgent.city})
              </span>
            </div>

            <div
              className={`flex items-center gap-1.5 font-mono font-bold ${isExpired ? "text-amber-800" : "text-rose-800"
                }`}
            >
              {isExpired ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>
                {isExpired
                  ? `Ventana 48h vencida (hace ${Math.max(1, primaryUrgent.hoursElapsed - 48)}h)`
                  : `Tiempo restante de flagrancia: ${primaryUrgent.hoursRemainingInFlagrancy}h`}
              </span>
            </div>
          </div>

          {errorBanner && (
            <p className="text-xs font-semibold text-rose-700 pt-1">{errorBanner}</p>
          )}
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={dispatchingId === primaryUrgent.id}
            onClick={() => handleOpenWhatsApp(primaryUrgent.id)}
            className={`px-5 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${isExpired ? "bg-amber-600 hover:bg-amber-700" : "bg-rose-600 hover:bg-rose-700"
              }`}
          >
            {dispatchingId === primaryUrgent.id ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generando guardia...</span>
              </>
            ) : (
              <>
                <PhoneCall className="w-4 h-4 text-white" />
                <span>Atender Flagrancia por WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
