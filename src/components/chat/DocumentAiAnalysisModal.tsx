"use client";

import React from "react";
import {
  X,
  Sparkles,
  ShieldAlert,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CriticalDeadline {
  id: string;
  title: string;
  deadlineDate: string;
  daysLeft: number;
  legalArticle: string;
  isPeremptory: boolean;
  urgencyLevel: "critical" | "warning" | "normal";
}

interface DocumentAnalysis {
  summary?: string;
  mainClaims?: string;
  legalBasis?: string;
  proceduralRisk?: "bajo" | "medio" | "alto";
  recommendedActions?: string[];
}

interface DocumentAiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  category?: string;
  analysis: DocumentAnalysis | null;
  deadlines: CriticalDeadline[];
  analyzedAt?: string | null;
}

export function DocumentAiAnalysisModal({
  isOpen,
  onClose,
  fileName,
  category = "demanda",
  analysis,
  deadlines = [],
  analyzedAt,
}: DocumentAiAnalysisModalProps) {
  if (!isOpen) return null;

  const risk = analysis?.proceduralRisk || "medio";

  const getRiskBadge = () => {
    switch (risk) {
      case "alto":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            Riesgo Procesal Alto
          </span>
        );
      case "medio":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Riesgo Procesal Moderado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Riesgo Procesal Bajo
          </span>
        );
    }
  };

  const formattedDate = analyzedAt
    ? new Date(analyzedAt).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recién procesado";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 text-[#0F172A]"
        >
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100 flex items-start justify-between bg-white">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] font-mono">
                    ALYA Legal AI Engine • Análisis Forense
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formattedDate}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-[#0F172A] leading-snug">
                  {fileName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider font-mono">
                    {category.replace("_", " ")}
                  </span>
                  {getRiskBadge()}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* 1. Cronograma de Plazos Perentorios */}
            {deadlines.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>Plazos Procesales Perentorios & Vencimientos</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {deadlines.map((dl) => {
                    const isCritical = dl.urgencyLevel === "critical" || dl.daysLeft <= 2;
                    const isWarning = dl.urgencyLevel === "warning" || (dl.daysLeft > 2 && dl.daysLeft <= 5);

                    return (
                      <div
                        key={dl.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCritical
                            ? "bg-rose-50/70 border-rose-200 text-rose-950"
                            : isWarning
                            ? "bg-amber-50/70 border-amber-200 text-amber-950"
                            : "bg-blue-50/60 border-blue-200 text-blue-950"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono ${
                                  isCritical
                                    ? "bg-rose-600 text-white"
                                    : isWarning
                                    ? "bg-amber-600 text-white"
                                    : "bg-blue-600 text-white"
                                }`}
                              >
                                {isCritical ? "Crítico / Flagrancia" : isWarning ? "Urgente" : "En Plazo"}
                              </span>
                              <h4 className="text-sm font-bold">{dl.title}</h4>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              Base Legal: <strong className="text-slate-800">{dl.legalArticle}</strong>
                            </p>
                          </div>

                          <div className="sm:text-right shrink-0">
                            <div className="text-lg font-black font-mono">
                              {dl.daysLeft} {dl.daysLeft === 1 ? "día" : "días"}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Vence:{" "}
                              {new Date(dl.deadlineDate).toLocaleDateString("es-PE", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Resumen Ejecutivo del Documento */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                <span>Síntesis Ejecutiva Procesal</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {analysis?.summary || "El documento ha sido clasificado dentro de los actuados procesales del expediente."}
              </p>
            </div>

            {/* 3. Petitorio & Puntos Controvertidos */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                <Scale className="w-4 h-4 text-slate-700" />
                <span>Petitorio & Pretensión Jurídica</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {analysis?.mainClaims || "Acto procesal tendiente a la prosecución de la causa o tutela judicial efectiva."}
              </p>
              {analysis?.legalBasis && (
                <div className="pt-2 border-t border-slate-100 mt-2 text-xs text-slate-500">
                  <strong>Fundamentación normativa aplicable:</strong> {analysis.legalBasis}
                </div>
              )}
            </div>

            {/* 4. Estrategia & Acciones Tácticas Recomendadas */}
            {analysis?.recommendedActions && analysis.recommendedActions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Acciones Tácticas Sugeridas para el Letrado</span>
                </div>

                <div className="space-y-2">
                  {analysis.recommendedActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-950"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span className="text-center sm:text-left">
              Análisis generado con algoritmos procesales de acuerdo al Código Procesal Civil y Penal del Perú.
            </span>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold transition-colors shadow-xs"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
