"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import {
  Star,
  MapPin,
  ShieldCheck,
  Video,
  Building,
  Heart,
  X,
  Check,
  ExternalLink,
} from "lucide-react";
import ExplicabilityChips from "./ExplicabilityChips";

export interface MatchRecord {
  id: string; // match id
  case_id: string;
  lawyer_id: string;
  score: number;
  breakdown: Record<string, unknown>;
  status: string;
  user_interest: boolean;
  lawyer_interest: boolean;
  lawyer_profiles: {
    id: string;
    user_id: string;
    bar_association: string;
    bar_number: string;
    professional_title: string;
    years_experience: number;
    bio: string | null;
    consultation_price: number | null;
    virtual_attention: boolean;
    physical_attention: boolean;
    address_office: string | null;
    rating_average: number;
    total_reviews: number;
    verification_status: string;
    profiles: {
      first_name: string;
      last_name: string;
      city: string;
      avatar_url: string | null;
    };
    lawyer_specialties: Array<{
      is_primary: boolean;
      experience_years: number;
      specialties: {
        id: number;
        name: string;
        slug: string;
      };
    }>;
  };
}

interface SwipeCardProps {
  match: MatchRecord;
  isFront: boolean;
  onSwipe: (direction: "left" | "right") => void;
  onToggleFavorite: (lawyerId: string) => void;
  isFavorite: boolean;
  onOpenDetail?: (match: MatchRecord) => void;
}

export default function SwipeCard({
  match,
  isFront,
  onSwipe,
  onToggleFavorite,
  isFavorite,
  onOpenDetail,
}: SwipeCardProps) {
  const [favoriteFeedback, setFavoriteFeedback] = useState<string | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-10, 10]);
  const interestOpacity = useTransform(x, [40, 110], [0, 1]);
  const passOpacity = useTransform(x, [-110, -40], [1, 0]);

  const lawyer = match.lawyer_profiles;
  const profile = lawyer.profiles;
  const primarySpec =
    lawyer.lawyer_specialties?.find((s) => s.is_primary)?.specialties?.name ||
    lawyer.lawyer_specialties?.[0]?.specialties?.name ||
    "Especialista Jurídico";

  const isVerified = lawyer.verification_status === "approved" || !!lawyer.bar_number;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  const handleFavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(lawyer.id);
    const msg = isFavorite ? "Eliminado de favoritos" : "Guardado en favoritos";
    setFavoriteFeedback(msg);
    setTimeout(() => setFavoriteFeedback(null), 2000);
  };

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
      {/* Swipe Feedback Stamp: ME INTERESA (Visible on drag right) */}
      {isFront && (
        <motion.div
          style={{ opacity: interestOpacity }}
          className="pointer-events-none absolute top-6 left-6 z-30 rotate-[-12deg] rounded-2xl border-3 border-[#3157D5] bg-[#101828]/95 px-4 py-2 font-bold tracking-wider text-[#EEF2FF] uppercase shadow-lg text-sm font-mono flex items-center gap-1.5"
        >
          <Check className="w-5 h-5 text-blue-400 stroke-[3]" />
          <span>Me Interesa</span>
        </motion.div>
      )}

      {/* Swipe Feedback Stamp: PASAR (Visible on drag left) */}
      {isFront && (
        <motion.div
          style={{ opacity: passOpacity }}
          className="pointer-events-none absolute top-6 right-6 z-30 rotate-[12deg] rounded-2xl border-3 border-slate-400 bg-slate-900/95 px-4 py-2 font-bold tracking-wider text-slate-200 uppercase shadow-lg text-sm font-mono flex items-center gap-1.5"
        >
          <X className="w-5 h-5 text-slate-300 stroke-[3]" />
          <span>Pasar</span>
        </motion.div>
      )}

      {/* Card Body */}
      <div className="flex h-full flex-col justify-between p-5 sm:p-7 overflow-y-auto">
        {/* Top Header Row: Verification & Affiliation */}
        <div>
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E6EAF0]">
            <div className="flex items-center gap-2 min-w-0">
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] border border-[#198754]/25 px-2.5 py-0.5 text-[11px] font-bold text-[#198754] font-mono shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Colegiatura Oficial
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-[#667085] font-mono shrink-0">
                  En verificación
                </span>
              )}
              <span className="text-[11px] text-[#667085] truncate">
                {lawyer.bar_association} • Reg. {lawyer.bar_number}
              </span>
            </div>

            {/* Score Pill */}
            <div
              className="inline-flex items-center gap-1 rounded-full bg-[#F0F4FE] border border-[#D1DEFC] px-3 py-1 text-xs font-bold font-mono text-[#3157D5] shrink-0"
              title="Porcentaje de coincidencia de especialidad, zona y disponibilidad con tu caso"
            >
              <span>{Math.round(match.score)}%</span>
              <span className="text-[10px] font-medium text-[#667085]">afín</span>
            </div>
          </div>

          {/* Lawyer Identity & Photo/Avatar */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#101828] text-white font-bold text-xl shadow-xs font-serif ring-1 ring-slate-800">
              {profile.first_name?.[0] || "A"}
              {profile.last_name?.[0] || "L"}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#101828] truncate font-serif">
                {profile.first_name} {profile.last_name}
              </h2>

              <p className="text-xs font-semibold text-[#3157D5] truncate mt-0.5">
                {primarySpec}
              </p>

              <p className="text-[11px] text-[#667085] truncate mt-0.5">
                {lawyer.professional_title}
              </p>

              {/* Trust Metrics Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#667085]">
                <span className="flex items-center gap-1 font-semibold text-[#101828]">
                  <Star className="w-3.5 h-3.5 fill-[#101828] text-[#101828]" />
                  {lawyer.rating_average ? lawyer.rating_average.toFixed(1) : "5.0"}
                  <span className="text-[10px] text-[#667085] font-normal">
                    ({lawyer.total_reviews})
                  </span>
                </span>
                <span>•</span>
                <span>{lawyer.years_experience} años exp.</span>
                <span>•</span>
                <span className="font-semibold text-[#101828]">
                  {lawyer.consultation_price
                    ? `S/. ${lawyer.consultation_price}`
                    : "Tarifa a convenir"}
                </span>
              </div>
            </div>
          </div>

          {/* Location & Modality */}
          <div className="flex flex-wrap items-center gap-3 pt-3 text-xs text-[#667085]">
            <span className="flex items-center gap-1 font-medium text-[#202938]">
              <MapPin className="w-3.5 h-3.5 text-[#3157D5]" />
              {profile.city}
            </span>
            {lawyer.virtual_attention && (
              <span className="flex items-center gap-1 text-[#202938]">
                <Video className="w-3.5 h-3.5 text-[#3157D5]" />
                Virtual
              </span>
            )}
            {lawyer.physical_attention && (
              <span className="flex items-center gap-1 text-[#202938]">
                <Building className="w-3.5 h-3.5 text-[#3157D5]" />
                Despacho presencial
              </span>
            )}
          </div>

          {/* Why this profile matches your case (Explicability) */}
          <div className="mt-3.5 pt-3 border-t border-[#E6EAF0] space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] font-mono">
              Coincidencia con tu caso:
            </span>
            <ExplicabilityChips
              breakdown={match.breakdown || {}}
              specialtyName={primarySpec}
              city={profile.city}
              yearsExperience={lawyer.years_experience}
            />
          </div>

          {/* Bio Preview */}
          <div className="mt-3 rounded-2xl border border-[#E6EAF0] bg-[#F7F8FC] p-3 text-xs text-[#202938] leading-relaxed line-clamp-2">
            {lawyer.bio ||
              "Abogado habilitado con experiencia en asesoría preventiva y litigios. Orientado a ofrecer una solución jurídica transparente y directa."}
          </div>

          {/* Secondary Action: Ver perfil completo */}
          {onOpenDetail && (
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => onOpenDetail(match)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3157D5] hover:underline cursor-pointer py-1"
              >
                <span>Ver perfil y trayectoria completa</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar - Clearly Differentiated, Non-Ambiguous */}
        <div className="mt-4 pt-3 border-t border-[#E6EAF0] space-y-2">
          {favoriteFeedback && (
            <p className="text-center text-[11px] font-semibold text-[#3157D5] animate-pulse">
              {favoriteFeedback}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            {/* Action 1: Descartar / Pasar */}
            <button
              type="button"
              onClick={() => onSwipe("left")}
              aria-label="Pasar al siguiente abogado"
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl border border-[#E6EAF0] bg-white py-2.5 px-3 text-xs font-semibold text-[#667085] hover:bg-slate-100 hover:text-[#101828] active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Pasar</span>
            </button>

            {/* Action 2: Guardar en Favoritos */}
            <button
              type="button"
              onClick={handleFavClick}
              aria-label={isFavorite ? "Eliminar de favoritos" : "Guardar en favoritos"}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl border py-2.5 px-3 text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-xs ${
                isFavorite
                  ? "border-[#3157D5] bg-[#EEF2FF] text-[#3157D5]"
                  : "border-[#E6EAF0] bg-white text-[#667085] hover:border-slate-300 hover:text-[#101828]"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-[#3157D5] text-[#3157D5]" : ""}`} />
              <span>{isFavorite ? "Guardado" : "Guardar"}</span>
            </button>

            {/* Action 3: Me Interesa */}
            <button
              type="button"
              onClick={() => onSwipe("right")}
              aria-label="Mostrar interés por este abogado"
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl bg-[#101828] hover:bg-[#1E293B] py-2.5 px-3 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3] text-blue-400" />
              <span>Me interesa</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
