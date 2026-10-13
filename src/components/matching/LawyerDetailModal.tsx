"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  Star,
  MapPin,
  Video,
  Building,
  Briefcase,
  Heart,
  CheckCircle2,
} from "lucide-react";
import type { MatchRecord } from "./SwipeCard";
import ExplicabilityChips from "./ExplicabilityChips";

interface LawyerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchRecord | null;
  isFavorite: boolean;
  onToggleFavorite: (lawyerId: string) => void;
  onExpressInterest?: () => void;
  isInterested?: boolean;
}

export default function LawyerDetailModal({
  isOpen,
  onClose,
  match,
  isFavorite,
  onToggleFavorite,
  onExpressInterest,
  isInterested = false,
}: LawyerDetailModalProps) {
  if (!isOpen || !match) return null;

  const lawyer = match.lawyer_profiles;
  const profile = lawyer.profiles;
  const primarySpec =
    lawyer.lawyer_specialties?.find((s) => s.is_primary)?.specialties?.name ||
    lawyer.lawyer_specialties?.[0]?.specialties?.name ||
    "Especialista Jurídico";

  const isVerified = lawyer.verification_status === "approved" || !!lawyer.bar_number;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#101828]/60 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-lawyer-name"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-[#E6EAF0] bg-white shadow-2xl flex flex-col my-auto"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[#E6EAF0] px-6 py-4 bg-[#F7F8FC]/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 font-sans">
                Perfil Profesional Verificado
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Cerrar perfil"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1 font-sans">
            {/* Top Identity Block */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-bold text-2xl shadow-sm font-sans">
                {profile.first_name?.[0] || "A"}
                {profile.last_name?.[0] || "L"}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="modal-lawyer-name" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] border border-[#198754]/20 px-2.5 py-0.5 text-xs font-bold text-[#198754]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Colegiado Habilitado
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-[#3157D5]">
                  {primarySpec} • {lawyer.professional_title}
                </p>

                <p className="text-xs text-[#667085]">
                  {lawyer.bar_association} • Colegiatura N.° {lawyer.bar_number}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#667085]">
                  <span className="flex items-center gap-1 font-semibold text-[#101828]">
                    <Star className="w-3.5 h-3.5 fill-[#101828] text-[#101828]" />
                    {lawyer.rating_average ? lawyer.rating_average.toFixed(1) : "5.0"}
                    <span className="text-[#667085] font-normal">
                      ({lawyer.total_reviews} {lawyer.total_reviews === 1 ? "reseña" : "reseñas"})
                    </span>
                  </span>
                  <span>•</span>
                  <span>{lawyer.years_experience} años de experiencia</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#3157D5]" />
                    {profile.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Honest Compatibility Explanation Box */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Índice de afinidad con tu caso
                </span>
                <span className="text-sm font-bold text-blue-700">
                  {Math.round(match.score)}% de concordancia
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Este porcentaje refleja la coincidencia objetiva entre la materia de tu consulta, la ubicación territorial, la modalidad preferida y la experiencia acreditada del abogado. <strong>No representa una probabilidad de éxito jurídico</strong>, ya que cada caso depende de sus méritos legales.
              </p>
              <div className="pt-2">
                <ExplicabilityChips
                  breakdown={match.breakdown || {}}
                  specialtyName={primarySpec}
                  city={profile.city}
                  yearsExperience={lawyer.years_experience}
                />
              </div>
            </div>

            {/* Professional Bio */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Trayectoria y Presentación
              </h3>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {lawyer.bio ||
                    "Abogado en ejercicio activo, debidamente registrado y habilitado. Brinda asesoría con enfoque ético, rigurosidad procesal y comunicación transparente con el cliente."}
                </p>
              </div>
            </div>

            {/* Modalities & Pricing Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 p-4 space-y-2 bg-white">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Modalidad de Atención
                </span>
                <div className="space-y-1.5 text-xs text-[#202938]">
                  {lawyer.virtual_attention && (
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-[#3157D5]" />
                      <span>Consultas por videollamada disponibles</span>
                    </div>
                  )}
                  {lawyer.physical_attention && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#3157D5]" />
                      <span>
                        Atención presencial en despacho
                        {lawyer.address_office ? `: ${lawyer.address_office}` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E6EAF0] p-4 space-y-2 bg-white">
                <span className="text-xs font-bold uppercase tracking-wider text-[#667085] font-mono">
                  Honorarios de Consulta
                </span>
                <div className="text-base font-bold text-[#101828]">
                  {lawyer.consultation_price ? (
                    <>
                      <span>S/. {lawyer.consultation_price}</span>
                      <span className="text-xs text-[#667085] font-normal"> / sesión inicial</span>
                    </>
                  ) : (
                    <span className="text-xs text-[#667085]">Tarifa por confirmar con el profesional</span>
                  )}
                </div>
                <p className="text-[11px] text-[#667085]">
                  La consulta inicial orienta el diagnóstico legal de tu situación sin compromiso procesal posterior.
                </p>
              </div>
            </div>

            {/* Specialties List */}
            {lawyer.lawyer_specialties && lawyer.lawyer_specialties.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#667085] font-mono">
                  Áreas de Práctica Registradas
                </span>
                <div className="flex flex-wrap gap-2">
                  {lawyer.lawyer_specialties.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6EAF0] bg-white px-3 py-1.5 text-xs font-medium text-[#202938]"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-[#3157D5]" />
                      {s.specialties?.name}
                      {s.experience_years ? ` (${s.experience_years} años)` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions Footer */}
          <div className="border-t border-[#E6EAF0] bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onToggleFavorite(lawyer.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                isFavorite
                  ? "border-[#3157D5] bg-[#EEF2FF] text-[#3157D5]"
                  : "border-[#E6EAF0] bg-white text-[#667085] hover:border-slate-300 hover:text-[#101828]"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-[#3157D5]" : ""}`} />
              <span>{isFavorite ? "En Favoritos" : "Guardar en Favoritos"}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#E6EAF0] bg-white px-4 py-2.5 text-xs font-semibold text-[#667085] hover:bg-slate-50 cursor-pointer"
              >
                Cerrar
              </button>

              {onExpressInterest && (
                <button
                  type="button"
                  disabled={isInterested}
                  onClick={() => {
                    onExpressInterest();
                    onClose();
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                    isInterested
                      ? "bg-[#198754] opacity-90 cursor-default"
                      : "bg-[#101828] hover:bg-[#1E293B]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isInterested ? "Interés Registrado" : "Me interesa contactar"}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
