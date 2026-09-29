"use client";

import { useState, useMemo } from "react";
import type { MatchRecord } from "./SwipeCard";
import ExplicabilityChips from "./ExplicabilityChips";
import MatchModal from "./MatchModal";
import { interactMatchAction, toggleFavoriteAction } from "@/actions/cases.actions";
import {
  Star,
  MapPin,
  ShieldCheck,
  Video,
  Building,
  Heart,
  ArrowUpDown,
  Filter,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

interface LawyerListViewProps {
  matches: MatchRecord[];
  caseId: string;
  favoritesSet: Set<string>;
  onFavoriteChange: (lawyerId: string, isFav: boolean) => void;
}

export default function LawyerListView({
  matches,
  caseId,
  favoritesSet,
  onFavoriteChange,
}: LawyerListViewProps) {
  const [sortBy, setSortBy] = useState<
    "score_desc" | "price_asc" | "experience_desc" | "rating_desc"
  >("score_desc");
  const [virtualOnly, setVirtualOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  const [matchedLawyer, setMatchedLawyer] = useState<{
    name: string;
    bar: string;
    title?: string;
    conversationId?: string | null;
  } | null>(null);

  const [interestedMap, setInterestedMap] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    matches.forEach((m) => {
      if (m.user_interest) init[m.id] = true;
    });
    return init;
  });

  const sortedAndFiltered = useMemo(() => {
    let result = [...matches];

    // Filtros
    if (virtualOnly) {
      result = result.filter((m) => m.lawyer_profiles.virtual_attention);
    }
    if (maxPrice !== "") {
      result = result.filter((m) => {
        const p = m.lawyer_profiles.consultation_price;
        return p ? p <= Number(maxPrice) : true;
      });
    }

    // Ordenamiento
    result.sort((a, b) => {
      if (sortBy === "score_desc") return b.score - a.score;
      if (sortBy === "price_asc") {
        const pa = a.lawyer_profiles.consultation_price || 999999;
        const pb = b.lawyer_profiles.consultation_price || 999999;
        return pa - pb;
      }
      if (sortBy === "experience_desc") {
        return b.lawyer_profiles.years_experience - a.lawyer_profiles.years_experience;
      }
      if (sortBy === "rating_desc") {
        return b.lawyer_profiles.rating_average - a.lawyer_profiles.rating_average;
      }
      return 0;
    });

    return result;
  }, [matches, sortBy, virtualOnly, maxPrice]);

  const handleInterest = async (match: MatchRecord) => {
    setInterestedMap((prev) => ({ ...prev, [match.id]: true }));

    try {
      const res = await interactMatchAction(match.id, true);

      if (res?.isMatched) {
        const lawyer = match.lawyer_profiles;
        setMatchedLawyer({
          name: `${lawyer.profiles.first_name} ${lawyer.profiles.last_name}`,
          bar: `${lawyer.bar_association} • Matrícula ${lawyer.bar_number}`,
          title: lawyer.professional_title,
          conversationId: res.conversationId,
        });
      }
    } catch (err) {
      console.error("Error setting interest:", err);
    }
  };

  const handleToggleFavorite = async (lawyerId: string) => {
    try {
      const res = await toggleFavoriteAction(lawyerId, "lawyer");
      if (res?.success) {
        onFavoriteChange(lawyerId, res.isFavorite);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Sorting and Filtering */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="text-xs text-slate-500 font-medium">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none"
          >
            <option value="score_desc">Mayor compatibilidad (%)</option>
            <option value="price_asc">Menor tarifa orientativa</option>
            <option value="experience_desc">Mayor experiencia (Años)</option>
            <option value="rating_desc">Mayor puntuación de reseñas</option>
          </select>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={virtualOnly}
              onChange={(e) => setVirtualOnly(e.target.checked)}
              className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
            />
            Solo atención virtual
          </label>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Tarifa máx:</span>
            <input
              type="number"
              placeholder="S/. Sin límite"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
              className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Lawyer List */}
      <div className="space-y-4">
        {sortedAndFiltered.length > 0 ? (
          sortedAndFiltered.map((m) => {
            const lawyer = m.lawyer_profiles;
            const profile = lawyer.profiles;
            const isFav = favoritesSet.has(lawyer.id);
            const isInterested = interestedMap[m.id];
            const isMatched = m.status === "matched";
            const primarySpec =
              lawyer.lawyer_specialties?.find((s) => s.is_primary)?.specialties?.name ||
              lawyer.lawyer_specialties?.[0]?.specialties?.name ||
              "Especialista Jurídico";

            return (
              <div
                key={m.id}
                className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 hover:border-blue-400/80 hover:shadow-md transition-all shadow-xs"
              >
                {/* Lawyer Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0F172A] text-white font-bold text-lg shadow-sm font-serif">
                    {profile.first_name[0]}
                    {profile.last_name[0]}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-[#0F172A] text-base truncate font-serif">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#2563EB] font-mono">
                        <ShieldCheck className="w-3 h-3" />
                        CAL {lawyer.bar_number}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        • {lawyer.bar_association}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#2563EB] truncate">
                      {primarySpec} • {lawyer.professional_title}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-mono text-slate-800 font-bold">
                        <Star className="w-3.5 h-3.5 fill-slate-800 text-slate-800" />
                        {lawyer.rating_average.toFixed(1)} ({lawyer.total_reviews} reseñas)
                      </span>
                      <span>•</span>
                      <span>{lawyer.years_experience} años de experiencia</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-[#2563EB]" />
                        {profile.city}
                      </span>
                    </div>

                    {/* Explicability Chips */}
                    <div className="pt-1">
                      <ExplicabilityChips
                        breakdown={m.breakdown || {}}
                        specialtyName={primarySpec}
                        city={profile.city}
                        yearsExperience={lawyer.years_experience}
                      />
                    </div>
                  </div>
                </div>

                {/* Score, Price and Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left md:text-right">
                    <div className="flex items-center md:justify-end gap-1 font-mono text-base font-extrabold text-[#2563EB]">
                      <span>{Math.round(m.score)}%</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        Compatibilidad
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {lawyer.consultation_price
                        ? `S/. ${lawyer.consultation_price} / sesión`
                        : "Tarifa a convenir"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Favorite Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(lawyer.id)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                        isFav
                          ? "border-blue-400 bg-blue-50 text-[#2563EB]"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "fill-[#2563EB]" : ""}`} />
                    </button>

                    {/* Interest / Match CTA */}
                    {isMatched ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Match Confirmado
                      </span>
                    ) : isInterested ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
                        Interés Enviado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInterest(m)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-4 py-2 text-xs font-bold text-white transition-all shadow-xs"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current text-blue-400" />
                        Me Interesa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
            <p className="text-sm font-semibold text-slate-700">
              No hay abogados que coincidan con estos filtros específicos
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Prueba quitando el filtro de modalidad o incrementando el presupuesto máximo.
            </p>
          </div>
        )}
      </div>

      {/* Match Modal */}
      {matchedLawyer && (
        <MatchModal
          isOpen={true}
          onClose={() => setMatchedLawyer(null)}
          lawyerName={matchedLawyer.name}
          lawyerBar={matchedLawyer.bar}
          lawyerTitle={matchedLawyer.title}
          conversationId={matchedLawyer.conversationId}
          caseId={caseId}
        />
      )}
    </div>
  );
}
