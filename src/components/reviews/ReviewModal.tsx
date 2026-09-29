"use client";

import { useState } from "react";
import {
  X,
  Star,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Clock,
  BookOpen,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitReviewAction } from "@/actions/reviews.actions";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string;
  lawyerId: string;
  caseId: string;
  lawyerName: string;
  onReviewSubmitted?: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  consultationId,
  lawyerId,
  caseId,
  lawyerName,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [commScore, setCommScore] = useState(5);
  const [punctScore, setPunctScore] = useState(5);
  const [clarityScore, setClarityScore] = useState(5);
  const [attentionScore, setAttentionScore] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const average = Number(
    ((commScore + punctScore + clarityScore + attentionScore) / 4.0).toFixed(1)
  );

  const getRatingLabel = (avg: number) => {
    if (avg >= 4.8) return "Excelente";
    if (avg >= 4.0) return "Muy Bueno";
    if (avg >= 3.0) return "Bueno";
    if (avg >= 2.0) return "Regular";
    return "Deficiente";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await submitReviewAction({
      consultationId,
      lawyerId,
      caseId,
      communicationScore: commScore,
      punctualityScore: punctScore,
      clarityScore,
      attentionScore,
      comment: comment.trim() || null,
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onReviewSubmitted) onReviewSubmitted();
      }, 1800);
    }
  };

  const renderStars = (
    currentScore: number,
    setScore: (score: number) => void
  ) => {
    return (
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setScore(star)}
            className="p-1 hover:scale-115 transition-transform"
          >
            <Star
              className={`w-5 h-5 ${
                star <= currentScore
                  ? "fill-blue-600 text-blue-600"
                  : "text-slate-300 hover:text-slate-400"
              }`}
            />
          </button>
        ))}
        <span className="text-xs font-bold text-slate-700 ml-1.5">
          {currentScore}/5
        </span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 text-[#0F172A] shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] font-mono">
                  Evaluación de Consulta Legal
                </span>
                <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                  Calificar la Atención de {lawyerName}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-[#0F172A]">
                  ¡Gracias por tu Valoración!
                </h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Tu reseña ha sido publicada y ayuda a mantener el estándar de
                  excelencia profesional en ALYA Perú.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Promedio Global en Tiempo Real */}
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">
                      Promedio resultante:
                    </span>
                    <span className="text-xl font-bold text-[#0F172A] flex items-center gap-1.5 mt-0.5">
                      <Star className="w-5 h-5 fill-blue-600 text-blue-600" />
                      {average} / 5.0
                    </span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    {getRatingLabel(average)}
                  </span>
                </div>

                {/* 4 Factores de Evaluación */}
                <div className="space-y-3">
                  {/* Factor 1: Comunicación */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        Comunicación
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Escucha activa y facilidad de contacto
                      </p>
                    </div>
                    {renderStars(commScore, setCommScore)}
                  </div>

                  {/* Factor 2: Puntualidad */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        Puntualidad
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Cumplimiento del horario acordado
                      </p>
                    </div>
                    {renderStars(punctScore, setPunctScore)}
                  </div>

                  {/* Factor 3: Claridad Jurídica */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        Claridad Jurídica
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Explicación comprensible de opciones legales
                      </p>
                    </div>
                    {renderStars(clarityScore, setClarityScore)}
                  </div>

                  {/* Factor 4: Trato Profesional */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        Trato Profesional
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Empatía, respeto y secreto profesional
                      </p>
                    </div>
                    {renderStars(attentionScore, setAttentionScore)}
                  </div>
                </div>

                {/* Comentario Cualitativo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tu Opinión o Testimonio (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Cuéntale a otros usuarios tu experiencia con el especialista legal..."
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      "Publicar Valoración"
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
