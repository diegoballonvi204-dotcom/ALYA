"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  ShieldCheck,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { AICaseAssistant } from "../forms/AICaseAssistant";

export interface CaseDraft {
  title: string;
  description: string;
  specialtyId: number;
  specialtyName: string;
  subspecialtyId?: number | null;
  urgency: "low" | "medium" | "high" | "immediate";
  city: string;
  modality: "virtual" | "in_person" | "hybrid";
  isConfidential: boolean;
}

interface CaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseDraft: CaseDraft;
  onSaveDraft: (draft: CaseDraft) => void;
  targetLawyerName?: string | null;
  onSendDirectInquiry?: (draft: CaseDraft) => Promise<void>;
  specialtiesList: Array<{ id: number; name: string }>;
}

export default function CaseDetailModal({
  isOpen,
  onClose,
  caseDraft,
  onSaveDraft,
  targetLawyerName,
  onSendDirectInquiry,
  specialtiesList,
}: CaseDetailModalProps) {
  const [title, setTitle] = useState(caseDraft.title);
  const [description, setDescription] = useState(caseDraft.description);
  const [specialtyId, setSpecialtyId] = useState(caseDraft.specialtyId || 1);
  const [urgency, setUrgency] = useState(caseDraft.urgency || "medium");
  const [city, setCity] = useState(caseDraft.city || "Lima");
  const [modality, setModality] = useState(caseDraft.modality || "virtual");
  const [isConfidential, setIsConfidential] = useState(caseDraft.isConfidential ?? true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveOnly = () => {
    if (!title.trim() || title.length < 5) {
      setErrorMsg("Ingresa un título de al menos 5 caracteres para tu consulta.");
      return;
    }
    if (!description.trim() || description.length < 15) {
      setErrorMsg("Describe brevemente lo ocurrido (al menos 15 caracteres) para que el abogado lo entienda.");
      return;
    }

    const selectedSpecName =
      specialtiesList.find((s) => s.id === specialtyId)?.name || caseDraft.specialtyName;

    onSaveDraft({
      title,
      description,
      specialtyId,
      specialtyName: selectedSpecName,
      urgency,
      city,
      modality,
      isConfidential,
    });
    onClose();
  };

  const handleSendAndMatch = async () => {
    if (!title.trim() || title.length < 5) {
      setErrorMsg("Ingresa un título de al menos 5 caracteres para tu consulta.");
      return;
    }
    if (!description.trim() || description.length < 15) {
      setErrorMsg("Describe brevemente lo ocurrido (al menos 15 caracteres) para que el abogado lo entienda.");
      return;
    }

    const selectedSpecName =
      specialtiesList.find((s) => s.id === specialtyId)?.name || caseDraft.specialtyName;

    const draftToSend: CaseDraft = {
      title,
      description,
      specialtyId,
      specialtyName: selectedSpecName,
      urgency,
      city,
      modality,
      isConfidential,
    };

    onSaveDraft(draftToSend);

    if (onSendDirectInquiry) {
      setIsSending(true);
      setErrorMsg(null);
      try {
        await onSendDirectInquiry(draftToSend);
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error enviando la consulta";
        setErrorMsg(msg);
      } finally {
        setIsSending(false);
      }
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#101828]/60 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-detail-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-xl max-h-[92vh] overflow-hidden rounded-3xl border border-[#E6EAF0] bg-white shadow-2xl flex flex-col my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E6EAF0] px-6 py-4 bg-[#F7F8FC]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3157D5]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#3157D5] font-mono">
                {targetLawyerName
                  ? `Información de tu caso para ${targetLawyerName}`
                  : "Detallar información de tu consulta"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[#667085] hover:bg-slate-200 hover:text-[#101828] transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-6 space-y-5 flex-1">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Privacy note */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#D1DEFC] bg-[#F0F4FE] p-3.5 text-xs text-[#202938]">
              <Lock className="w-4 h-4 shrink-0 text-[#3157D5] mt-0.5" />
              <p className="text-[11px] text-[#667085] leading-relaxed">
                Tus datos de identidad directa están protegidos por la Ley N.° 29733. El abogado sólo verá la información que escribas aquí para evaluar tu caso.
              </p>
            </div>

            {/* Title field */}
            <div>
              <label className="block text-xs font-bold text-[#101828] mb-1.5">
                Título o resumen de tu situación *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Despido laboral intempestivo / Juicio de alimentos"
                className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-4 py-2.5 text-xs text-[#101828] placeholder:text-slate-400 focus:bg-white focus:border-[#3157D5] focus:outline-none transition-all font-medium"
              />
            </div>

            {/* Description field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#101828]">
                  Detalles para que el abogado revise tu caso *
                </label>
                <span className="text-[10px] font-mono text-[#667085]">
                  {description.length} caracteres
                </span>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica qué pasó, fechas clave o qué buscas lograr (evita datos bancarios o números de DNI en esta etapa)..."
                className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] p-3 text-xs text-[#101828] placeholder:text-slate-400 focus:bg-white focus:border-[#3157D5] focus:outline-none transition-all leading-relaxed"
              />
            </div>

            {/* AI Assistant */}
            <AICaseAssistant
              title={title}
              description={description}
              city={city}
              onApplySuggestion={({ specialtyId: sId, urgency: urg }) => {
                if (sId) setSpecialtyId(sId);
                if (urg) setUrgency(urg === "urgent" ? "immediate" : urg);
              }}
            />

            {/* Specialty and Modality quick selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                  Materia Legal
                </label>
                <select
                  value={specialtyId}
                  onChange={(e) => setSpecialtyId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-3 py-2 text-xs text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none font-medium"
                >
                  {specialtiesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                  Modalidad Preferida
                </label>
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value as any)}
                  className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-3 py-2 text-xs text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none font-medium"
                >
                  <option value="virtual">Virtual (Videollamada)</option>
                  <option value="in_person">Presencial (Despacho)</option>
                  <option value="hybrid">Híbrida (Ambas)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="border-t border-[#E6EAF0] bg-[#F7F8FC] px-6 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E6EAF0] bg-white px-4 py-2.5 text-xs font-semibold text-[#667085] hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>

            {targetLawyerName ? (
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendAndMatch}
                className="inline-flex items-center gap-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Enviar consulta y conectar con {targetLawyerName}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveOnly}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Guardar detalles de mi caso</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
