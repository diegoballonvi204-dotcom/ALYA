"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ShieldCheck, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lawyerName: string;
  lawyerBar: string;
  lawyerTitle?: string;
  conversationId?: string | null;
  caseId: string;
}

export default function MatchModal({
  isOpen,
  onClose,
  lawyerName,
  lawyerBar,
  lawyerTitle,
  conversationId,
  caseId,
}: MatchModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101828]/60 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E6EAF0] bg-white p-7 text-center shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-[#667085] hover:bg-slate-100 hover:text-[#101828] transition-colors cursor-pointer"
            aria-label="Cerrar ventana de conexión"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success Icon Badge */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5E9] text-[#198754] shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block rounded-full bg-blue-50 border border-blue-200/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
            Conexión Profesional Confirmada (Match)
          </span>

          <h3 id="match-modal-title" className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 font-sans">
            ¡Interés Mutuo Confirmado!
          </h3>

          <p className="mt-2 text-xs text-slate-500 leading-relaxed font-sans">
            Ambas partes han mostrado interés directo. Se ha activado la <strong>sala de coordinación rápida y chat cifrado</strong> con reserva de comunicaciones bajo <strong>secreto profesional y Ley N.° 29733</strong>.
          </p>

          <div className="my-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left shadow-2xs space-y-1.5 font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">{lawyerName}</span>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                CAL Hábil
              </span>
            </div>
            <p className="text-[11px] text-slate-500">{lawyerBar}</p>
            {lawyerTitle && (
              <p className="text-xs text-slate-700 line-clamp-1">{lawyerTitle}</p>
            )}
            <div className="pt-2 border-t border-[#E6EAF0] flex items-center gap-1.5 text-[10px] text-[#667085]">
              <span>🔒 Cifrado simétrico AES-256</span>
              <span>•</span>
              <span>Canal temporal seguro</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <Link
              href={conversationId ? `/chat/${conversationId}` : `/cases/${caseId}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] py-3 text-sm font-bold text-white transition-all shadow-md cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>Entrar a Coordinación Rápida & Chat Cifrado</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-[#E6EAF0] bg-white py-2.5 text-xs font-semibold text-[#667085] hover:bg-[#F7F8FC] hover:text-[#101828] transition-colors cursor-pointer"
            >
              Continuar revisando abogados
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
