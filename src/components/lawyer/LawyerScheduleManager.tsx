"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  Clock,
  Video,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Save,
} from "lucide-react";
import {
  saveLawyerScheduleAction,
  updateConsultationStatusAction,
} from "@/actions/schedule.actions";

const DAYS_OF_WEEK = [
  { day: 1, name: "Lunes" },
  { day: 2, name: "Martes" },
  { day: 3, name: "Miércoles" },
  { day: 4, name: "Jueves" },
  { day: 5, name: "Viernes" },
  { day: 6, name: "Sábado" },
  { day: 0, name: "Domingo" },
];

interface ScheduleItem {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

interface ConsultationItem {
  id: string;
  case_id: string;
  case_title: string;
  client_name: string;
  scheduled_at: string;
  duration_minutes: number;
  modality: "virtual" | "in_person";
  agreed_price: number;
  status: "requested" | "confirmed" | "rescheduled" | "completed" | "cancelled";
  meeting_link: string | null;
  meeting_address: string | null;
  notes: string | null;
}

interface LawyerScheduleManagerProps {
  initialSchedules: ScheduleItem[];
  consultations: ConsultationItem[];
}

export function LawyerScheduleManager({
  initialSchedules,
  consultations: initialConsultations,
}: LawyerScheduleManagerProps) {
  // Inicializar estado de 7 días
  const [schedules, setSchedules] = useState(() => {
    return DAYS_OF_WEEK.map(({ day }) => {
      const existing = initialSchedules.find((s) => s.day_of_week === day);
      return (
        existing || {
          day_of_week: day,
          start_time: "09:00",
          end_time: "18:00",
          slot_duration_minutes: 45,
          is_active: day >= 1 && day <= 5, // L-V activo por defecto
        }
      );
    });
  });

  const [consultations, setConsultations] = useState(initialConsultations);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Modal para confirmar cita con link
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    consultationId: string | null;
    meetingLink: string;
  }>({ isOpen: false, consultationId: null, meetingLink: "" });

  const [isActionPending, startTransition] = useTransition();

  const handleToggleDay = (dayIndex: number) => {
    setSchedules((prev) =>
      prev.map((s, idx) =>
        idx === dayIndex ? { ...s, is_active: !s.is_active } : s
      )
    );
  };

  const handleTimeChange = (
    dayIndex: number,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((s, idx) => (idx === dayIndex ? { ...s, [field]: value } : s))
    );
  };

  const handleSaveSchedules = async () => {
    setIsSavingSchedule(true);
    setScheduleSuccess(false);
    setScheduleError(null);

    const payload = schedules.map((s) => ({
      dayOfWeek: s.day_of_week,
      startTime: s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time,
      endTime: s.end_time.length === 5 ? `${s.end_time}:00` : s.end_time,
      slotDurationMinutes: s.slot_duration_minutes,
      isActive: s.is_active,
    }));

    const res = await saveLawyerScheduleAction(payload);
    setIsSavingSchedule(false);

    if (res.error) {
      setScheduleError(res.error);
    } else {
      setScheduleSuccess(true);
      setTimeout(() => setScheduleSuccess(false), 3000);
    }
  };

  const handleStatusUpdate = async (
    consultationId: string,
    status: "confirmed" | "completed" | "cancelled",
    meetingLink?: string
  ) => {
    startTransition(async () => {
      const res = await updateConsultationStatusAction({
        consultationId,
        status,
        meetingLink: meetingLink || null,
      });

      if (res.success) {
        setConsultations((prev) =>
          prev.map((c) =>
            c.id === consultationId
              ? {
                  ...c,
                  status,
                  meeting_link: meetingLink !== undefined ? meetingLink : c.meeting_link,
                }
              : c
          )
        );
        setConfirmModal({ isOpen: false, consultationId: null, meetingLink: "" });
      } else {
        alert(res.error || "Error al actualizar cita");
      }
    });
  };

  return (
    <div className="space-y-10">
      {/* 1. SECCIÓN: Horario Semanal de Atención */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#2563EB]" />
              <span>Disponibilidad Semanal de Consultas</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configura los días y turnos en que estás habilitado para atender
              consultas virtuales o presenciales.
            </p>
          </div>

          <button
            onClick={handleSaveSchedules}
            disabled={isSavingSchedule}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all shrink-0"
          >
            {isSavingSchedule ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Guardar Disponibilidad</span>
          </button>
        </div>

        {scheduleSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>¡Tus horarios han sido actualizados con éxito en la plataforma!</span>
          </div>
        )}

        {scheduleError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{scheduleError}</span>
          </div>
        )}

        {/* Grid de días */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {DAYS_OF_WEEK.map(({ day, name }, idx) => {
            const sched = schedules[idx];
            return (
              <div
                key={day}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  sched.is_active
                    ? "bg-blue-50/40 border-blue-200 shadow-xs"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#0F172A]">
                      {name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleDay(idx)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        sched.is_active ? "bg-[#2563EB]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          sched.is_active ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {sched.is_active ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">
                          Inicio
                        </span>
                        <input
                          type="time"
                          value={sched.start_time.substring(0, 5)}
                          onChange={(e) =>
                            handleTimeChange(idx, "start_time", e.target.value)
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[#0F172A] text-xs focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">
                          Fin
                        </span>
                        <input
                          type="time"
                          value={sched.end_time.substring(0, 5)}
                          onChange={(e) =>
                            handleTimeChange(idx, "end_time", e.target.value)
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[#0F172A] text-xs focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <span className="text-[11px] text-slate-400 italic">
                        No atiende
                      </span>
                    </div>
                  )}
                </div>

                {sched.is_active && (
                  <span className="text-[10px] text-[#2563EB] font-semibold mt-3 block text-center">
                    45 min / turno
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. SECCIÓN: Bandeja de Citas Jurídicas */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
        <div className="pb-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2563EB]" />
            <span>Consultas Jurídicas Agendadas ({consultations.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Revisa las solicitudes de cita recibidas a través de tus matches y
            confirma los enlaces de videollamada.
          </p>
        </div>

        {consultations.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-300" />
            <p className="text-xs text-slate-700 font-medium">
              No tienes solicitudes de consulta registradas por el momento.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Cuando un cliente agende una cita desde el chat del caso, aparecerá
              aquí para tu confirmación.
            </p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-slate-100">
            {consultations.map((c) => {
              const dt = new Date(c.scheduled_at);
              const dateFormatted = dt.toLocaleDateString("es-PE", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const timeFormatted = dt.toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={c.id}
                  className="py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#2563EB] shrink-0">
                      {c.modality === "virtual" ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <Building className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#0F172A]">
                          {c.client_name}
                        </span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-[#2563EB] font-semibold truncate max-w-xs">
                          {c.case_title}
                        </span>

                        {/* Status badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            c.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : c.status === "requested"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : c.status === "completed"
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {c.status === "confirmed"
                            ? "Confirmada"
                            : c.status === "requested"
                            ? "Pendiente"
                            : c.status === "completed"
                            ? "Concluida"
                            : "Cancelada"}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span className="font-semibold text-slate-700">
                          {dateFormatted} a las {timeFormatted}
                        </span>
                        <span>•</span>
                        <span>{c.duration_minutes} minutos</span>
                        <span>•</span>
                        <span className="text-[#0F172A] font-bold">
                          S/ {c.agreed_price.toFixed(2)}
                        </span>
                      </p>

                      {c.notes && (
                        <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          &ldquo;{c.notes}&rdquo;
                        </p>
                      )}

                      {c.meeting_link && (
                        <div className="mt-2 flex items-center gap-2">
                          <a
                            href={c.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:underline font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Enlace de Reunión Virtual</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {c.status === "requested" && (
                      <>
                        <button
                          disabled={isActionPending}
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              consultationId: c.id,
                              meetingLink:
                                c.modality === "virtual"
                                    ? "https://meet.google.com/new"
                                  : "",
                            })
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors"
                        >
                          Confirmar Cita
                        </button>
                        <button
                          disabled={isActionPending}
                          onClick={() => handleStatusUpdate(c.id, "cancelled")}
                          className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-700 hover:bg-rose-50 text-xs transition-colors font-medium"
                        >
                          Rechazar
                        </button>
                      </>
                    )}

                    {c.status === "confirmed" && (
                      <button
                        disabled={isActionPending}
                        onClick={() => handleStatusUpdate(c.id, "completed")}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors"
                      >
                        Marcar Concluida
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Confirmación con Enlace */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 text-[#0F172A] shadow-2xl">
            <h3 className="text-base font-bold text-[#0F172A] mb-1">
              Confirmar Cita Legal
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ingresa el enlace de Google Meet o Zoom para la videollamada. Se
              notificará al cliente automáticamente.
            </p>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Enlace de Videollamada
              </label>
              <input
                type="url"
                value={confirmModal.meetingLink}
                onChange={(e) =>
                  setConfirmModal((prev) => ({
                    ...prev,
                    meetingLink: e.target.value,
                  }))
                }
                placeholder="https://meet.google.com/xyz-abcd-efg"
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-[#0F172A] focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmModal({
                    isOpen: false,
                    consultationId: null,
                    meetingLink: "",
                  })
                }
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => {
                  if (confirmModal.consultationId) {
                    handleStatusUpdate(
                      confirmModal.consultationId,
                      "confirmed",
                      confirmModal.meetingLink
                    );
                  }
                }}
                className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
              >
                Confirmar y Notificar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
