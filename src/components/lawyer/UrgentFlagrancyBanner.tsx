"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  PhoneCall,
  Loader2,
  AlertOctagon,
} from "lucide-react";
import {
  getUrgentFlagrancyCasesAction,
  generateEmergencyWhatsAppLinkAction,
  type UrgentFlagrancyCase,
} from "@/actions/urgency-alerts.actions";

export default function UrgentFlagrancyBanner() {
  const [urgentCases, setUrgentCases] = useState<UrgentFlagrancyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUrgentCases() {
      setLoading(true);
      const res = await getUrgentFlagrancyCasesAction();
      if (res.urgentCases) {
        setUrgentCases(res.urgentCases);
      }
      setLoading(false);
    }
    loadUrgentCases();
  }, []);

  const handleOpenWhatsApp = async (caseId: string) => {
    setDispatchingId(caseId);
    try {
      const res = await generateEmergencyWhatsAppLinkAction(caseId);
      if (res.whatsappUrl) {
        window.open(res.whatsappUrl, "_blank");
      } else {
        alert(res.error || "No se pudo generar enlace de WhatsApp.");
      }
    } catch {
      alert("Error al conectar con WhatsApp de emergencia.");
    } finally {
      setDispatchingId(null);
    }
  };

  if (loading || urgentCases.length === 0) {
    return null;
  }

  // Tomamos el caso más urgente
  const primaryUrgent = urgentCases[0];

  return (
    <div className="w-full rounded-3xl border-2 border-rose-400 bg-gradient-to-r from-rose-50 via-rose-50/80 to-white p-5 sm:p-6 text-rose-950 shadow-md relative overflow-hidden">
      {/* Decorative pulse element */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-rose-200/50 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider font-mono shadow-xs animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              Guardia de Flagrancia Activa • Ventana 48h
            </span>
            <span className="text-xs text-rose-700 font-mono font-bold">
              {urgentCases.length} {urgentCases.length === 1 ? "caso crítico" : "casos críticos"} en espera
            </span>
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

            <div className="flex items-center gap-1.5 font-mono text-rose-800 font-bold">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>
                Tiempo restante de flagrancia: {primaryUrgent.hoursRemainingInFlagrancy}h
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            disabled={dispatchingId === primaryUrgent.id}
            onClick={() => handleOpenWhatsApp(primaryUrgent.id)}
            className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
