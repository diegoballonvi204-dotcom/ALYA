"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, ShieldCheck, X } from "lucide-react";
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Sapphire Aura Glow Effect */}
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 p-1 shadow-md">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0F172A] text-blue-400">
              <Sparkles className="w-9 h-9" />
            </div>
          </div>

          <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
            ¡Es un Match Bilateral!
          </span>

          <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#0F172A] font-serif">
            Interés Mutuo Confirmado
          </h3>

          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            El profesional <strong className="text-[#0F172A]">{lawyerName}</strong> también ha
            mostrado interés en atender tu caso. Se ha habilitado la sala de conversación segura.
          </p>

          <div className="my-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-bold text-[#0F172A]">{lawyerName}</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{lawyerBar}</p>
            {lawyerTitle && (
              <p className="text-xs text-slate-600 mt-2 line-clamp-1">{lawyerTitle}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Link
              href={conversationId ? `/chat/${conversationId}` : `/cases/${caseId}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] py-3 text-sm font-bold text-white transition-all shadow-md shadow-slate-900/10"
            >
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Abrir Chat Seguro con el Abogado
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
            >
              Continuar revisando abogados
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
