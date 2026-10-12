"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Check,
  Tag,
  HelpCircle,
} from "lucide-react";
import {
  classifyCaseWithAIAction,
  type AIClassificationResult,
} from "@/actions/ai.actions";

interface AICaseAssistantProps {
  title: string;
  description: string;
  city?: string;
  onApplySuggestion: (suggestion: {
    specialtyId: number;
    subspecialtyId: number | null;
    urgency: "low" | "medium" | "high" | "urgent";
  }) => void;
}

export function AICaseAssistant({
  title,
  description,
  city,
  onApplySuggestion,
}: AICaseAssistantProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIClassificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const handleAnalyze = async () => {
    if (!description || description.trim().length < 15) {
      setErrorMsg("Escribe al menos 15 caracteres en la descripción para que el asistente pueda orientarte.");
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);
    setApplied(false);

    try {
      const res = await classifyCaseWithAIAction({
        title: title || "Consulta Legal",
        description,
        city,
      });

      if (res.error || !res.result) {
        setErrorMsg(res.error || "No se pudo clasificar el caso en este momento.");
      } else {
        setResult(res.result);
      }
    } catch (err: any) {
      setErrorMsg("Error de conexión al orientar el caso.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!result || !result.specialtyId) return;
    onApplySuggestion({
      specialtyId: result.specialtyId,
      subspecialtyId: result.subspecialtyId,
      urgency: result.urgency,
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return {
          label: "Urgencia Inmediata",
          color: "bg-[#101828] text-white border-slate-700",
        };
      case "high":
        return {
          label: "Urgencia Apremiante",
          color: "bg-[#F0F4FE] text-[#3157D5] border-[#D1DEFC]",
        };
      case "low":
        return {
          label: "Preventiva / Consulta",
          color: "bg-[#E8F5E9] text-[#198754] border-[#198754]/25",
        };
      default:
        return {
          label: "Estándar",
          color: "bg-slate-100 text-[#202938] border-slate-200",
        };
    }
  };

  return (
    <div className="rounded-2xl border border-[#D1DEFC] bg-[#F0F4FE]/70 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#101828] flex items-center justify-center text-blue-400 shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#3157D5] font-mono">
              Orientación Inteligente de Materia Legal
            </h4>
            <p className="text-xs text-[#667085]">
              ¿Dudas sobre a qué área legal pertenece tu caso? El asistente puede sugerir la rama jurídica adecuada.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={analyzing}
          onClick={handleAnalyze}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#101828] hover:bg-[#1E293B] text-white font-bold text-xs shadow-md shadow-slate-900/10 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>Analizando situación...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Orientar mi consulta</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs text-[#202938] bg-white border border-[#E6EAF0] p-3 rounded-xl font-medium">
          {errorMsg}
        </p>
      )}

      {/* Suggested Classification Card */}
      {result && (
        <div className="p-4.5 rounded-2xl bg-white border border-[#E6EAF0] shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#101828] font-serif">
                Materia sugerida: {result.specialtyName}
              </span>
              {result.subspecialtyName && (
                <span className="text-xs text-[#3157D5] font-semibold font-mono">
                  › {result.subspecialtyName}
                </span>
              )}
            </div>

            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#198754] border border-[#198754]/20 font-mono">
              {Math.round(result.confidence * 100)}% de coincidencia temática
            </span>
          </div>

          <div className="flex items-start gap-2 text-xs">
            <span
              className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase shrink-0 font-mono ${
                getUrgencyBadge(result.urgency).color
              }`}
            >
              {getUrgencyBadge(result.urgency).label}
            </span>
            <span className="text-xs text-[#667085] leading-relaxed">
              {result.urgencyReason}
            </span>
          </div>

          {result.legalEntities.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-[#667085] font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#3157D5]" /> Temas detectados:
              </span>
              {result.legalEntities.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-[#F7F8FC] text-[10px] text-[#202938] border border-[#E6EAF0] font-mono"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Action to Apply */}
          <div className="pt-3 border-t border-[#E6EAF0] flex items-center justify-end">
            <button
              type="button"
              onClick={handleApply}
              disabled={applied || !result.specialtyId}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                applied
                  ? "bg-[#198754] text-white shadow-xs"
                  : "bg-[#3157D5] hover:bg-[#2547BD] text-white shadow-xs"
              }`}
            >
              {applied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Datos aplicados al formulario!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Aplicar sugerencia</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
