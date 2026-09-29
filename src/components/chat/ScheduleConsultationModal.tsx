"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Video,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getLawyerAvailabilitySlotsAction,
  bookConsultationAction,
} from "@/actions/schedule.actions";

interface ScheduleConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  lawyerId: string;
  lawyerName: string;
  consultationPrice: number;
  onBookingSuccess?: () => void;
}

export function ScheduleConsultationModal({
  isOpen,
  onClose,
  caseId,
  lawyerId,
  lawyerName,
  consultationPrice,
  onBookingSuccess,
}: ScheduleConsultationModalProps) {
  // Generar próximos 14 días disponibles
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("es-PE", { weekday: "short" });
    const dayNumber = d.getDate();
    const monthName = d.toLocaleDateString("es-PE", { month: "short" });
    return { dateStr, dayName, dayNumber, monthName, rawDate: d };
  });

  const [selectedDate, setSelectedDate] = useState<string>(dates[0].dateStr);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [modality, setModality] = useState<"virtual" | "in_person">("virtual");
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setErrorMsg(null);

      const res = await getLawyerAvailabilitySlotsAction(lawyerId, selectedDate);
      if (isMounted) {
        if ("message" in res && res.message && (!res.slots || res.slots.length === 0)) {
          setErrorMsg(res.message);
          setSlots([]);
        } else {
          setSlots(res.slots || []);
        }
        setLoadingSlots(false);
      }
    };

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [isOpen, lawyerId, selectedDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg("Por favor selecciona un horario disponible.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const scheduledAt = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();

    const res = await bookConsultationAction({
      lawyerId,
      caseId,
      scheduledAt,
      durationMinutes: 45,
      modality,
      agreedPrice: 150,
      notes: notes.trim() || undefined,
    });

    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccess(true);
      if (onBookingSuccess) onBookingSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    }
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 text-[#0F172A] shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] font-serif">
                    Agendar Consulta Legal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Con {lawyerName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-[#0F172A] font-serif">
                  ¡Cita Solicitada con Éxito!
                </h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Se ha enviado la solicitud al abogado y se registró en la conversación del chat.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="p-6 space-y-5">
                {/* 1. Selector de Fecha (Scroll horizontal) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                    1. Selecciona la Fecha
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300">
                    {dates.map((d) => {
                      const isSelected = selectedDate === d.dateStr;
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => setSelectedDate(d.dateStr)}
                          className={`flex-shrink-0 w-16 py-2.5 px-1.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? "bg-[#0F172A] border-slate-900 text-white font-bold shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white"
                          }`}
                        >
                          <span className="block text-[10px] uppercase font-mono">{d.dayName}</span>
                          <span className="block text-base leading-tight my-0.5 font-bold font-serif">
                            {d.dayNumber}
                          </span>
                          <span className="block text-[10px] capitalize">{d.monthName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Selector de Horarios Disponibles */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                    2. Horario Disponible (Turnos de 45 min)
                  </label>
                  {loadingSlots ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                      Consultando agenda del especialista...
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <p className="text-xs text-slate-600">
                        No hay turnos disponibles para esta fecha.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Por favor selecciona otro día en el calendario.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? "bg-[#0F172A] text-white font-bold border-slate-900 shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white"
                            }`}
                          >
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Modalidad */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                    3. Modalidad de Atención
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setModality("virtual")}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        modality === "virtual"
                          ? "bg-blue-50/80 border-[#2563EB] text-[#2563EB] font-bold shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <Video className="w-5 h-5 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold">Virtual</p>
                        <p className="text-[10px] text-slate-500">Google Meet / Zoom</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModality("in_person")}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        modality === "in_person"
                          ? "bg-blue-50/80 border-[#2563EB] text-[#2563EB] font-bold shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <Building className="w-5 h-5 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold">Presencial</p>
                        <p className="text-[10px] text-slate-500">Despacho legal</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 4. Notas opcionales */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                    4. Notas o temas a tratar (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe brevemente tus dudas clave para que el abogado prepare el caso..."
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-[#2563EB] transition-colors"
                  />
                </div>

                {/* Tarifa y Garantía */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block">Tarifa acordada:</span>
                    <span className="text-base font-bold text-[#2563EB] font-mono">
                      S/ {consultationPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Confirmación garantizada</span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-slate-700" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* CTA Submit */}
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
                    disabled={submitting || !selectedSlot}
                    className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        Confirmando...
                      </>
                    ) : (
                      "Solicitar Cita Legal"
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
