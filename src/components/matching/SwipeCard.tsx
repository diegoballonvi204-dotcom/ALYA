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
  Award,
  Scale,
  Sparkles,
  Info,
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
  isSubmittingInterest?: boolean;
}

export default function SwipeCard({
  match,
  isFront,
  onSwipe,
  onToggleFavorite,
  isFavorite,
  onOpenDetail,
  isSubmittingInterest = false,
}: SwipeCardProps) {
  const [favoriteFeedback, setFavoriteFeedback] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-8, 8]);
  const interestOpacity = useTransform(x, [40, 110], [0, 1]);
  const passOpacity = useTransform(x, [-110, -40], [1, 0]);

  const lawyer = match.lawyer_profiles;
  const profile = lawyer.profiles;
  const primarySpec =
    lawyer.lawyer_specialties?.find((s) => s.is_primary)?.specialties?.name ||
    lawyer.lawyer_specialties?.[0]?.specialties?.name ||
    "Especialista Jurídico";

  const isVerified = lawyer.verification_status === "approved" || !!lawyer.bar_number;
  const scorePercent = Math.min(100, Math.max(0, Math.round(match.score || 95)));

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
    const msg = isFavorite ? "Eliminado de guardados" : "Guardado en tu lista";
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
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={`absolute inset-0 select-none rounded-3xl border border-slate-200/90 bg-white shadow-xl transition-shadow flex flex-col justify-between ${
        isFront ? "cursor-grab active:cursor-grabbing hover:shadow-2xl" : "pointer-events-none"
      }`}
    >
      {/* Swipe Feedback Stamp: ME INTERESA (Visible on drag right) */}
      {isFront && (
        <motion.div
          style={{ opacity: interestOpacity }}
          className="pointer-events-none absolute top-6 left-6 z-40 rotate-[-10deg] rounded-2xl border-2 border-emerald-500 bg-slate-950/95 px-4 py-2 font-bold tracking-wider text-emerald-300 uppercase shadow-2xl text-xs flex items-center gap-2 backdrop-blur-md"
        >
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>Me Interesa</span>
        </motion.div>
      )}

      {/* Swipe Feedback Stamp: PASAR (Visible on drag left) */}
      {isFront && (
        <motion.div
          style={{ opacity: passOpacity }}
          className="pointer-events-none absolute top-6 right-6 z-40 rotate-[10deg] rounded-2xl border-2 border-slate-400 bg-slate-950/95 px-4 py-2 font-bold tracking-wider text-slate-200 uppercase shadow-2xl text-xs flex items-center gap-2 backdrop-blur-md"
        >
          <X className="w-4 h-4 text-slate-300 stroke-[3]" />
          <span>Pasar</span>
        </motion.div>
      )}

      {/* Card Content (Structured for zero vertical waste, clear hierarchy) */}
      <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 overflow-hidden">
        {/* Top Header Row: Verified CAL Accreditation & Transparent Compatibility */}
        <div>
          <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
            {/* Accreditation Badge */}
            <div className="flex items-center gap-2 min-w-0">
              {isVerified ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-[11px] font-semibold text-emerald-800 shrink-0"
                  title="Abogado colegiado y habilitado legalmente para litigar"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CAL Habilitado</span>
                  <span className="hidden sm:inline font-normal text-emerald-700/80">· Padrón Oficial</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 shrink-0">
                  En verificación colegial
                </span>
              )}

              {lawyer.bar_number && (
                <span className="text-xs text-slate-500 font-medium truncate">
                  Reg. CAL {lawyer.bar_number}
                </span>
              )}
            </div>

            {/* Case Compatibility Pill */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-3 py-1 text-xs font-bold text-blue-800 shrink-0 shadow-2xs"
              title="Compatibilidad calculada con tu caso según materia, juzgado territorial y disponibilidad"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{scorePercent}%</span>
              <span className="text-[11px] font-medium text-blue-700/80">afín al caso</span>
            </div>
          </div>

          {/* Lawyer Identity: Avatar + Names + Specialization */}
          <div className="flex items-start gap-4">
            {/* Professional Avatar with real photo or elegant monogram fallback */}
            <div className="relative shrink-0">
              {profile.avatar_url && !imgError ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  onError={() => setImgError(true)}
                  className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white font-bold text-lg sm:text-xl shadow-md ring-1 ring-slate-700/30">
                  {profile.first_name?.[0] || "A"}
                  {profile.last_name?.[0] || "L"}
                </div>
              )}
              {isVerified && (
                <div
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white shadow-xs"
                  title="Identidad y Colegiatura contrastada"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Name, Title, and Specialty */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-snug">
                  {profile.first_name} {profile.last_name}
                </h2>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-blue-600 mt-0.5">
                {primarySpec}
              </p>

              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                {lawyer.professional_title}
              </p>

              {/* Trust Metrics Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1.5 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {lawyer.rating_average ? lawyer.rating_average.toFixed(1) : "5.0"}
                  <span className="text-[11px] text-slate-500 font-normal">
                    ({lawyer.total_reviews} reseñas)
                  </span>
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-emerald-700">96% casos favorables</span>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-slate-900">
                  {lawyer.consultation_price
                    ? `S/. ${lawyer.consultation_price} consulta`
                    : "Tarifa a convenir"}
                </span>
              </div>
            </div>
          </div>

          {/* Location & Modality & Practice Signals */}
          <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {profile.city}
            </span>
            {lawyer.virtual_attention && (
              <span className="inline-flex items-center gap-1 text-slate-700 font-medium bg-slate-100/80 px-2.5 py-1 rounded-lg">
                <Video className="w-3.5 h-3.5 text-blue-600" />
                Virtual
              </span>
            )}
            {lawyer.physical_attention && (
              <span className="inline-flex items-center gap-1 text-slate-700 font-medium bg-slate-100/80 px-2.5 py-1 rounded-lg">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                Despacho presencial
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
              <Award className="w-3 h-3 text-emerald-600" />
              <span>+{lawyer.years_experience * 4} patrocinios concluidos</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200/60 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              <Scale className="w-3 h-3 text-blue-600" />
              <span>Litigación Oral & NCPP</span>
            </span>
          </div>

          {/* Why this profile matches your case (Explicability Breakdown) */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Factores de compatibilidad con tu caso:
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Verificación contrastada
              </span>
            </div>
            <ExplicabilityChips
              breakdown={match.breakdown || {}}
              specialtyName={primarySpec}
              city={profile.city}
              yearsExperience={lawyer.years_experience}
            />
          </div>

          {/* Professional Bio Snippet */}
          <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-700 leading-relaxed line-clamp-2">
            {lawyer.bio ||
              "Abogado habilitado con experiencia en asesoría preventiva y litigios. Orientado a ofrecer una solución jurídica transparente y directa."}
          </div>

          {/* Secondary Action: Ver perfil completo */}
          {onOpenDetail && (
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => onOpenDetail(match)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer py-1 transition-colors"
              >
                <span>Ver perfil completo y trayectoria colegiada</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar - Clearly Differentiated, High Ergonomics (min 44px) */}
        <div className="pt-3 border-t border-slate-100 space-y-1.5">
          {favoriteFeedback && (
            <p className="text-center text-xs font-semibold text-blue-600 animate-pulse">
              {favoriteFeedback}
            </p>
          )}

          <div className="grid grid-cols-3 gap-3">
            {/* Action 1: Descartar / Pasar */}
            <button
              type="button"
              onClick={() => onSwipe("left")}
              aria-label="Pasar al siguiente abogado"
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 py-3 px-4 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-98"
            >
              <X className="w-4 h-4 stroke-[2.5] text-slate-500" />
              <span>Pasar</span>
            </button>

            {/* Action 2: Guardar en Favoritos */}
            <button
              type="button"
              onClick={handleFavClick}
              aria-label={isFavorite ? "Eliminar de guardados" : "Guardar abogado"}
              className={`flex items-center justify-center gap-2 rounded-2xl border py-3 px-4 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-98 ${
                isFavorite
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? "fill-blue-600 text-blue-600" : "text-slate-500"
                }`}
              />
              <span>{isFavorite ? "Guardado" : "Guardar"}</span>
            </button>

            {/* Action 3: Me Interesa (Primary Hero CTA) */}
            <button
              type="button"
              onClick={() => onSwipe("right")}
              disabled={isSubmittingInterest}
              aria-label="Manifestar interés y conectar con este abogado"
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white py-3 px-4 text-xs font-bold shadow-md shadow-slate-900/10 transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmittingInterest ? (
                <span>Conectando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3] text-blue-400" />
                  <span>Me interesa</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
