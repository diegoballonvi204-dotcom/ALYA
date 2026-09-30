"use client";

import { useState } from "react";
import {
  Sparkles,
  X,
  AlertTriangle,
  Clock,
  HelpCircle,
  Scale,
  Copy,
  Check,
  Zap,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { LawyerAIBriefResult } from "@/actions/ai.actions";
import SubscriptionUpgradeModal from "./SubscriptionUpgradeModal";

interface LawyerAIBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: LawyerAIBriefResult | null;
  isLocked?: boolean;
}

export default function LawyerAIBriefModal({
  isOpen,
  onClose,
  brief,
  isLocked = false,
}: LawyerAIBriefModalProps) {
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!brief) return;
    const text = `
⚖️ RESUMEN EJECUTIVO IA — ALYA PERÚ
Caso: ${brief.title}
Materia: ${brief.specialtyName} | Urgencia: ${brief.urgency.toUpperCase()} | Sede: ${brief.city} (${brief.modality})

📌 HECHOS RELEVANTES:
${brief.factualSummary.map((f, i) => `${i + 1}. ${f}`).join("\n")}

⚠️ PLAZOS Y ALERTAS PROCESALES:
${brief.proceduralAlerts.map((a) => `• ${a}`).join("\n")}

❓ PREGUNTAS CLAVE PARA LA ENTREVISTA:
${brief.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

💡 ESTRATEGIA SUGERIDA:
${brief.recommendedStrategy}

📚 NORMAS APLICABLES:
${brief.applicableNorms.join(" | ")}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xl overflow-hidden my-6">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-1/4 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isLocked || !brief ? (
          /* Estado Bloqueado para Plan Básico */
          <div className="text-center py-6 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center shadow-xs">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase px-3 py-1">
                <Sparkles className="w-3 h-3" />
                Exclusivo Plan Profesional y Élite
              </span>
              <h3 className="text-2xl font-bold text-[#0F172A] font-serif">
                Asistente Legal IA de Expedientes
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Obtén resúmenes ejecutivos inmediatos, detección de plazos de caducidad y guías de preguntas estratégicas para cada caso antes de contactar al cliente.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                <Zap className="w-4 h-4 text-blue-600 fill-current" />
                <span>¿Qué desbloqueas con ALYA Pro?</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-600 pl-6 list-disc">
                <li>Síntesis fáctica automática en 3 viñetas.</li>
                <li>Alertas de plazos de prescripción procesal según ley peruana.</li>
                <li>4 preguntas clave recomendadas para tu primera entrevista.</li>
                <li>Estrategia procesal preliminar sugerida.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md"
              >
                <span>Desbloquear con Plan Pro (S/ 89/mes)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* Estado Desbloqueado: Briefing Legal IA */
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Resumen Legal Asistido por IA</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs mr-8"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Brief</span>
                    </>
                  )}
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] font-serif">
                {brief.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                <span className="font-bold text-blue-700">{brief.specialtyName}</span>
                <span>•</span>
                <span>{brief.city}</span>
                <span>•</span>
                <span className="capitalize">{brief.modality}</span>
                <span>•</span>
                <span className="font-mono uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Urgencia {brief.urgency}
                </span>
              </div>
            </div>

            {/* 1. Síntesis Fáctica */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                Síntesis Fáctica y Hechos Relevantes
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {brief.factualSummary.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Plazos Procesales y Alertas de Caducidad */}
            {brief.proceduralAlerts.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Plazos Procesales y Alertas de Caducidad (Perú)
                </h3>
                <ul className="space-y-1 text-xs text-amber-950">
                  {brief.proceduralAlerts.map((alert, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-amber-700">⚠️</span>
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3. Preguntas Clave para la Primera Entrevista */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Preguntas Sugeridas para la Primera Entrevista
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {brief.keyQuestions.map((q, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-2">
                    <span className="font-mono font-bold text-blue-600 text-[11px] shrink-0">{idx + 1}.</span>
                    <span className="text-[11px] leading-relaxed">{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Estrategia Procesal y Normas Aplicables */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Estrategia Procesal Preliminar Sugerida
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {brief.recommendedStrategy}
              </p>
              <div className="pt-2 border-t border-blue-100 flex flex-wrap gap-1.5">
                {brief.applicableNorms.map((norm, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-white border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800 font-mono"
                  >
                    {norm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Upgrade de respaldo si está bloqueado */}
        <SubscriptionUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason="FEATURE_LOCKED"
        />
      </div>
    </div>
  );
}
