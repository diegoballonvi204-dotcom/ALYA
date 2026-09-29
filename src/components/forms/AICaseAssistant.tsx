"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Clock,
  Check,
  Tag,
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
      setErrorMsg("Escribe al menos 15 caracteres en la descripción para que la IA pueda clasificar tu caso.");
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);
    setApplied(false);

    const res = await classifyCaseWithAIAction({
      title: title || "Consulta Legal",
      description,
      city,
    });

    setAnalyzing(false);

    if (res.error || !res.result) {
      setErrorMsg(res.error || "No se pudo clasificar el caso.");
    } else {
      setResult(res.result);
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
          label: "Urgencia Inmediata (24-48h)",
          color: "bg-slate-200 text-slate-800 border-slate-300",
        };
      case "high":
        return {
          label: "Urgencia Alta (Plazos Activos)",
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "low":
        return {
          label: "Urgencia Baja (Preventiva)",
          color: "bg-slate-100 text-slate-700 border-slate-200",
        };
      default:
        return {
          label: "Urgencia Normal",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-slate-50 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-blue-400 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono">
              Asistente Jurídico Inteligente
            </h4>
            <p className="text-xs text-slate-600">
              ¿No sabes qué materia legal corresponde? Deja que nuestra IA analice tu relato fáctico.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={analyzing}
          onClick={handleAnalyze}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-md shadow-slate-900/10 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analizando hechos...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Analizar con IA</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs text-slate-700 bg-slate-100 border border-slate-300 p-3 rounded-xl font-medium">
          {errorMsg}
        </p>
      )}

      {/* Tarjeta de Sugerencia Resultante */}
      {result && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A] font-serif">
                Sugerencia IA: {result.specialtyName}
              </span>
              {result.subspecialtyName && (
                <span className="text-xs text-blue-600 font-semibold font-mono">
                  › {result.subspecialtyName}
                </span>
              )}
            </div>

            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              {Math.round(result.confidence * 100)}% de certeza
            </span>
          </div>

          {/* Urgencia y Justificación */}
          <div className="flex items-start gap-2 text-xs">
            <span
              className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase shrink-0 font-mono ${
                getUrgencyBadge(result.urgency).color
              }`}
            >
              {getUrgencyBadge(result.urgency).label}
            </span>
            <span className="text-xs text-slate-600 leading-tight">
              {result.urgencyReason}
            </span>
          </div>

          {/* Palabras Clave Legales */}
          {result.legalEntities.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                <Tag className="w-2.5 h-2.5 text-blue-600" /> Conceptos:
              </span>
              {result.legalEntities.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-700 border border-slate-200 font-mono"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Botón Aplicar Sugerencia */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={handleApply}
              disabled={applied || !result.specialtyId}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                applied
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              }`}
            >
              {applied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Campos Actualizados!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aplicar Clasificación al Formulario</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
