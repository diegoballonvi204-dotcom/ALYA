"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Scale,
  Plus,
  Trash2,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { createFeeAgreementAction } from "@/actions/agreements.actions";

interface CreateFeeAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle: string;
  conversationId: string;
  onAgreementCreated?: () => void;
}

export function CreateFeeAgreementModal({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  conversationId,
  onAgreementCreated,
}: CreateFeeAgreementModalProps) {
  const [title, setTitle] = useState(`Patrocinio Legal: ${caseTitle}`);
  const [scopeDescription, setScopeDescription] = useState("");
  const [fixedFee, setFixedFee] = useState<number | "">(1200);
  const [successFee, setSuccessFee] = useState<number | "">("");
  const [stages, setStages] = useState<Array<{ title: string; price: number }>>([
    { title: "Etapa Inicial y Estudio de Expediente", price: 400 },
    { title: "Redacción y Presentación de Escritos / Audiencias", price: 800 },
  ]);
  const [expensesTerms, setExpensesTerms] = useState(
    "Los aranceles judiciales, tasas del Poder Judicial, peritajes y cédulas de notificación serán cubiertos íntegramente por el cliente conforme al Art. 1764 del Código Civil."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddStage = () => {
    setStages([...stages, { title: "", price: 0 }]);
  };

  const handleRemoveStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const handleStageChange = (
    index: number,
    field: "title" | "price",
    value: string | number
  ) => {
    const updated = [...stages];
    if (field === "price") {
      updated[index].price = Number(value) || 0;
    } else {
      updated[index].title = String(value);
    }
    setStages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Ingresa el título o materia del convenio de patrocinio.");
      return;
    }
    if (!scopeDescription.trim() || scopeDescription.trim().length < 20) {
      setErrorMsg("Describe con mayor detalle el alcance de los servicios profesionales (mínimo 20 caracteres).");
      return;
    }
    if (fixedFee === "" || Number(fixedFee) <= 0) {
      setErrorMsg("Ingresa un monto de honorario fijo válido en Soles.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await createFeeAgreementAction({
      caseId,
      conversationId,
      title: title.trim(),
      scopeDescription: scopeDescription.trim(),
      fixedFee: Number(fixedFee),
      successFeePercentage: successFee !== "" ? Number(successFee) : null,
      stages: stages.filter((s) => s.title.trim().length > 0),
      expensesTerms: expensesTerms.trim(),
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      if (onAgreementCreated) onAgreementCreated();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative z-10 w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 text-[#0F172A] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <header className="px-6 py-5 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif">
                  Emitir Hoja de Encargo / Convenio de Honorarios
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Conforme al Art. 1764 del Código Civil Peruano (Locación de Servicios)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Form Scrollable Body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-7 space-y-5 flex-1 font-sans">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Título de la materia */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                Título del Patrocinio o Materia
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Patrocinio en Proceso de Despido Arbitrario e Indemnización"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Alcance del Servicio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                Alcance y Obligaciones del Abogado
              </label>
              <textarea
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                rows={3}
                placeholder="Describe las acciones legales a emprender: redacción de demandas, asistencia a audiencias, interposición de recursos y asesoramiento permanente durante la instancia..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
              />
            </div>

            {/* Honorario Fijo y Cuota Litis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  Honorario Fijo Total (Soles PEN)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={fixedFee}
                    onChange={(e) => setFixedFee(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  Cuota Litis / Éxito (Opcional %)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={successFee}
                    onChange={(e) => setSuccessFee(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Ej. 15%"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Etapas / Hitos Procesales */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  Etapas o Hitos de Pago (Opcional)
                </label>
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="text-xs text-[#2563EB] hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Hito</span>
                </button>
              </div>

              <div className="space-y-2">
                {stages.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={stage.title}
                      onChange={(e) => handleStageChange(idx, "title", e.target.value)}
                      placeholder={`Hito ${idx + 1}: Ej. Presentación de Demanda`}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                    />
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        S/
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={stage.price}
                        onChange={(e) => handleStageChange(idx, "price", e.target.value)}
                        className="w-full pl-7 pr-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    {stages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Eliminar hito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Términos de Gastos y Aranceles */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                Gastos Procesales y Aranceles Judiciales
              </label>
              <textarea
                value={expensesTerms}
                onChange={(e) => setExpensesTerms(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 focus:outline-hidden focus:border-blue-500 leading-relaxed font-sans"
              />
            </div>

            {/* Trust Footer Notice */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-2.5 text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <p className="leading-relaxed font-sans text-[11px]">
                Al emitir esta propuesta, el cliente recibirá una notificación en este chat para revisar los términos y firmar con su DNI e IP bajo la <strong>Ley N.° 27269 de Firmas Digitales</strong>.
              </p>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Emitiendo Hoja de Encargo...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Enviar Convenio al Cliente</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
