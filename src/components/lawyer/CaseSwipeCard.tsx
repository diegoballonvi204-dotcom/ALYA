"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import {
  MapPin,
  Lock,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  Clock,
  Shield,
  Video,
  Building,
} from "lucide-react";

export interface LawyerCaseItem {
  id: string;
  title: string;
  description: string;
  city: string;
  modality: string;
  urgency: string;
  is_confidential: boolean;
  created_at?: string;
  specialties?: {
    name: string;
  } | null;
}

interface CaseSwipeCardProps {
  caseItem: LawyerCaseItem;
  matchInfo?: {
    id: string;
    score: number;
    user_interest: boolean;
    lawyer_interest: boolean;
    status: string;
    conversation_id?: string | null;
  } | null;
  isFront: boolean;
  onSwipe: (direction: "left" | "right") => void;
  onOpenAiBrief?: () => void;
  isRadarVip?: boolean;
}

export default function CaseSwipeCard({
  caseItem,
  matchInfo,
  isFront,
  onSwipe,
  onOpenAiBrief,
  isRadarVip = false,
}: CaseSwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-10, 10]);
  const interestOpacity = useTransform(x, [40, 110], [0, 1]);
  const passOpacity = useTransform(x, [-110, -40], [1, 0]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  // Mapeo de etapa procesal y color según urgencia
  const urgencyConfig = (() => {
    switch (caseItem.urgency) {
      case "immediate":
        return {
          label: "🚨 Flagrancia / Detención Urgente",
          color: "bg-red-50 border-red-200 text-red-700",
          badge: "bg-red-600 text-white",
        };
      case "high":
        return {
          label: "🔍 Investigación Preliminar",
          color: "bg-amber-50 border-amber-200 text-amber-800",
          badge: "bg-amber-600 text-white",
        };
      case "medium":
        return {
          label: "⚖️ Etapa Intermedia / Acusación",
          color: "bg-blue-50 border-blue-200 text-blue-800",
          badge: "bg-[#3157D5] text-white",
        };
      default:
        return {
          label: "🏛️ Juicio Oral / Consulta General",
          color: "bg-slate-50 border-slate-200 text-slate-700",
          badge: "bg-slate-600 text-white",
        };
    }
  })();

  const specialtyName = caseItem.specialties?.name || "Derecho Penal";

  return (
    <motion.div
      style={{
        x: isFront ? x : 0,
        rotate: isFront ? rotate : 0,
      }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={`absolute inset-0 select-none overflow-hidden rounded-3xl border border-[#E6EAF0] bg-white shadow-xl transition-shadow ${
        isFront ? "cursor-grab active:cursor-grabbing hover:shadow-2xl" : "pointer-events-none"
      }`}
    >
      {/* Swipe Feedback Stamp: POSTULAR (Visible on drag right) */}
      {isFront && (
        <motion.div
          style={{ opacity: interestOpacity }}
          className="pointer-events-none absolute top-6 left-6 z-30 rotate-[-12deg] rounded-2xl border-3 border-[#198754] bg-[#101828]/95 px-4 py-2 font-bold tracking-wider text-emerald-300 uppercase shadow-lg text-sm font-mono flex items-center gap-1.5"
        >
          <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
          <span>Aceptar / Postular</span>
        </motion.div>
      )}

      {/* Swipe Feedback Stamp: DESCARTAR (Visible on drag left) */}
      {isFront && (
        <motion.div
          style={{ opacity: passOpacity }}
          className="pointer-events-none absolute top-6 right-6 z-30 rotate-[12deg] rounded-2xl border-3 border-slate-400 bg-slate-900/95 px-4 py-2 font-bold tracking-wider text-slate-200 uppercase shadow-lg text-sm font-mono flex items-center gap-1.5"
        >
          <X className="w-5 h-5 text-slate-300 stroke-[3]" />
          <span>Descartar</span>
        </motion.div>
      )}

      {/* Card Body */}
      <div className="flex h-full flex-col justify-between p-5 sm:p-6 overflow-y-auto">
        <div>
          {/* Top Row: Urgencia Procesal & Ley 29733 */}
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#E6EAF0]">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold font-mono ${urgencyConfig.color}`}>
              {urgencyConfig.label}
            </span>

            {isRadarVip ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-bold font-mono animate-pulse">
                ⚡ Radar Élite
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#667085] font-mono">
                <Clock className="w-3 h-3" />
                <span>Activo hoy</span>
              </span>
            )}
          </div>

          {/* Ficha Ejecutiva: Núcleo del Problema */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-[#EEF2FF] border border-[#D1DEFC] px-2.5 py-0.5 text-[11px] font-bold text-[#3157D5] font-mono">
                {specialtyName}
              </span>

              {matchInfo?.score && (
                <span className="text-[11px] font-mono font-bold text-[#3157D5]">
                  {Math.round(matchInfo.score)}% coincidencia
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#101828] font-serif line-clamp-1">
              {caseItem.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#667085] pt-0.5">
              <span className="flex items-center gap-1 font-medium text-[#202938]">
                <MapPin className="w-3.5 h-3.5 text-[#3157D5]" />
                Jurisdicción: {caseItem.city}
              </span>
              <span className="flex items-center gap-1 text-[#202938]">
                {caseItem.modality === "virtual" ? (
                  <>
                    <Video className="w-3.5 h-3.5 text-[#3157D5]" />
                    <span>Atención Virtual</span>
                  </>
                ) : (
                  <>
                    <Building className="w-3.5 h-3.5 text-[#3157D5]" />
                    <span>Despacho Presencial</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Síntesis Fáctica del Caso */}
          <div className="mt-3 rounded-2xl border border-[#E6EAF0] bg-[#F7F8FC] p-3.5 text-xs text-[#202938] leading-relaxed">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#667085] font-mono mb-1">
              Hechos Procesales Expuestos:
            </span>
            <p className="line-clamp-4 text-xs text-[#334155]">
              {caseItem.description}
            </p>
          </div>

          {/* Cumplimiento Ley N.° 29733: Datos protegidos */}
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-[#F0F4FE] border border-[#D1DEFC]/60 p-2 text-[10px] text-[#3157D5]">
            <Lock className="w-3.5 h-3.5 shrink-0 text-[#3157D5]" />
            <span className="leading-tight">
              <strong>Ley N.° 29733:</strong> Identidad del justiciable enmascarada. El canal de contacto directo se desbloqueará al confirmarse el match bilateral.
            </span>
          </div>

          {/* Asistente Legal IA Briefing */}
          {onOpenAiBrief && (
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={onOpenAiBrief}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3157D5] hover:underline cursor-pointer py-0.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#3157D5]" />
                <span>Ver Informe de Viabilidad Dogmática IA</span>
              </button>
            </div>
          )}
        </div>

        {/* Acciones de Swipe / Decisión */}
        <div className="mt-3.5 pt-3 border-t border-[#E6EAF0] grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSwipe("left")}
            aria-label="Descartar caso"
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#E6EAF0] bg-white py-2.5 px-3 text-xs font-semibold text-[#667085] hover:bg-slate-100 hover:text-[#101828] active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Descartar</span>
          </button>

          <button
            type="button"
            onClick={() => onSwipe("right")}
            aria-label="Postular interés por este caso"
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#101828] hover:bg-[#1E293B] py-2.5 px-3 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3] text-emerald-400" />
            <span>Postular Interés</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
