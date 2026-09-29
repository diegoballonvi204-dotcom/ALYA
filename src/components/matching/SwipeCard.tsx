"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  Star,
  MapPin,
  ShieldCheck,
  Video,
  Building,
  Heart,
  X,
  Info,
  ExternalLink,
} from "lucide-react";
import ExplicabilityChips from "./ExplicabilityChips";

export interface MatchRecord {
  id: string; // match id
  case_id: string;
  lawyer_id: string;
  score: number;
  breakdown: Record<string, any>;
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
}

export default function SwipeCard({
  match,
  isFront,
  onSwipe,
  onToggleFavorite,
  isFavorite,
}: SwipeCardProps) {
  const [showFullBio, setShowFullBio] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-12, 12]);
  const interestOpacity = useTransform(x, [40, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -40], [1, 0]);

  const lawyer = match.lawyer_profiles;
  const profile = lawyer.profiles;
  const primarySpec =
    lawyer.lawyer_specialties?.find((s) => s.is_primary)?.specialties?.name ||
    lawyer.lawyer_specialties?.[0]?.specialties?.name ||
    "Especialista Legal";

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
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
      whileDrag={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`absolute inset-0 select-none overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-all ${
        isFront ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      }`}
    >
      {/* Dynamic Stamp: ME INTERESA (Visible on drag right) */}
      {isFront && (
        <motion.div
          style={{ opacity: interestOpacity }}
          className="pointer-events-none absolute top-8 left-8 z-30 rotate-[-15deg] rounded-2xl border-4 border-[#2563EB] bg-[#0F172A]/90 px-4 py-2 font-black tracking-wider text-blue-400 uppercase shadow-lg text-lg font-serif"
        >
          Me Interesa ✓
        </motion.div>
      )}

      {/* Dynamic Stamp: PASAR (Visible on drag left) */}
      {isFront && (
        <motion.div
          style={{ opacity: passOpacity }}
          className="pointer-events-none absolute top-8 right-8 z-30 rotate-[15deg] rounded-2xl border-4 border-slate-400 bg-slate-900/90 px-4 py-2 font-black tracking-wider text-white uppercase shadow-lg text-lg font-serif"
        >
          Pasar ✕
        </motion.div>
      )}

      {/* Card Content Container */}
      <div className="flex h-full flex-col justify-between p-6 sm:p-7">
        {/* Top Header Row */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold font-mono text-[#2563EB]">
                <ShieldCheck className="w-3.5 h-3.5" />
                CAL {lawyer.bar_number}
              </span>
              <span className="text-[11px] text-slate-500 truncate max-w-[140px] sm:max-w-none">
                {lawyer.bar_association}
              </span>
            </div>

            {/* Score Ring / Pill */}
            <div className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-extrabold text-[#2563EB] font-mono shadow-xs">
              <span>{Math.round(match.score)}%</span>
              <span className="text-[10px] font-normal text-slate-600">Compatible</span>
            </div>
          </div>

          {/* Profile Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0F172A] text-white font-bold text-xl shadow-md font-serif">
              {profile.first_name[0]}
              {profile.last_name[0]}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold tracking-tight text-[#0F172A] truncate font-serif">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-xs font-semibold text-[#2563EB] truncate mt-0.5">
                {primarySpec}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {lawyer.professional_title}
              </p>

              <div className="flex items-center gap-3 pt-2 text-xs">
                <span className="flex items-center gap-1 font-mono text-slate-800 font-bold">
                  <Star className="w-3.5 h-3.5 fill-slate-800 text-slate-800" />
                  {lawyer.rating_average.toFixed(1)}
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({lawyer.total_reviews})
                  </span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">
                  {lawyer.years_experience} años exp.
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700 font-medium">
                  {lawyer.consultation_price
                    ? `S/. ${lawyer.consultation_price}`
                    : "A convenir"}
                </span>
              </div>
            </div>
          </div>

          {/* Explicability Breakdown Chips */}
          <div className="my-3 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              ¿Por qué es compatible con tu caso?
            </span>
            <ExplicabilityChips
              breakdown={match.breakdown || {}}
              specialtyName={primarySpec}
              city={profile.city}
              yearsExperience={lawyer.years_experience}
            />
          </div>

          {/* Bio Preview */}
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <p
              className={`text-xs text-slate-600 leading-relaxed ${
                showFullBio ? "" : "line-clamp-3"
              }`}
            >
              {lawyer.bio ||
                "Abogado debidamente habilitado en el Colegio de Abogados con amplia experiencia en patrocinio de litigios y consultoría preventiva."}
            </p>
            {lawyer.bio && lawyer.bio.length > 140 && (
              <button
                type="button"
                onClick={() => setShowFullBio(!showFullBio)}
                className="mt-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
              >
                {showFullBio ? "Ver menos" : "Leer trayectoria completa..."}
              </button>
            )}
          </div>

          {/* Modalidad & Ubicación */}
          <div className="flex flex-wrap items-center gap-3 pt-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              {profile.city}
            </span>
            {lawyer.virtual_attention && (
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Video className="w-3.5 h-3.5 text-blue-600" />
                Videollamada
              </span>
            )}
            {lawyer.physical_attention && (
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                Despacho presencial
              </span>
            )}
          </div>
        </div>

        {/* Bottom Floating Action Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-around gap-3">
          {/* Discard / Pass Button */}
          <button
            type="button"
            onClick={() => onSwipe("left")}
            aria-label="Pasar abogado"
            className="flex h-13 w-13 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all shadow-xs active:scale-90"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={() => onToggleFavorite(lawyer.id)}
            aria-label="Guardar en favoritos"
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all active:scale-90 ${
              isFavorite
                ? "border-blue-400 bg-blue-50 text-[#2563EB]"
                : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-[#2563EB]" : ""}`} />
          </button>

          {/* Me Interesa Button */}
          <button
            type="button"
            onClick={() => onSwipe("right")}
            aria-label="Me interesa el abogado"
            className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white transition-all shadow-md active:scale-90"
          >
            <Heart className="w-6 h-6 fill-current stroke-[2] text-blue-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
