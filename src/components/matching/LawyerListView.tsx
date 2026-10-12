"use client";

import { useState, useMemo } from "react";
import type { MatchRecord } from "./SwipeCard";
import ExplicabilityChips from "./ExplicabilityChips";
import MatchModal from "./MatchModal";
import LawyerDetailModal from "./LawyerDetailModal";
import { interactMatchAction, toggleFavoriteAction } from "@/actions/cases.actions";
import {
  Star,
  MapPin,
  ShieldCheck,
  Video,
  Heart,
  ArrowUpDown,
  CheckCircle,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

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
  // Sort state
  const [sortBy, setSortBy] = useState<
    "score_desc" | "price_asc" | "experience_desc" | "rating_desc"
  >("score_desc");

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [modalityFilter, setModalityFilter] = useState<"all" | "virtual" | "physical">("all");
  const [minExperience, setMinExperience] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  // Modals state
  const [selectedForDetail, setSelectedForDetail] = useState<MatchRecord | null>(null);
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

  // Unique lists for filter dropdowns
  const availableSpecialties = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      m.lawyer_profiles.lawyer_specialties?.forEach((ls) => {
        if (ls.specialties?.name) set.add(ls.specialties.name);
      });
    });
    return Array.from(set).sort();
  }, [matches]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      if (m.lawyer_profiles.profiles.city) set.add(m.lawyer_profiles.profiles.city);
    });
    return Array.from(set).sort();
  }, [matches]);

  // Filtering and Sorting logic
  const filteredAndSorted = useMemo(() => {
    let result = [...matches];

    // Specialty filter
    if (selectedSpecialty !== "all") {
      result = result.filter((m) =>
        m.lawyer_profiles.lawyer_specialties?.some(
          (s) => s.specialties?.name === selectedSpecialty
        )
      );
    }

    // City filter
    if (selectedCity !== "all") {
      result = result.filter(
        (m) => m.lawyer_profiles.profiles.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // Modality filter
    if (modalityFilter === "virtual") {
      result = result.filter((m) => m.lawyer_profiles.virtual_attention);
    } else if (modalityFilter === "physical") {
      result = result.filter((m) => m.lawyer_profiles.physical_attention);
    }

    // Experience filter
    if (minExperience > 0) {
      result = result.filter((m) => m.lawyer_profiles.years_experience >= minExperience);
    }

    // Max Price filter
    if (maxPrice !== "") {
      result = result.filter((m) => {
        const p = m.lawyer_profiles.consultation_price;
        return p ? p <= Number(maxPrice) : true;
      });
    }

    // Sorting
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
  }, [matches, sortBy, selectedSpecialty, selectedCity, modalityFilter, minExperience, maxPrice]);

  const activeFiltersCount =
    (selectedSpecialty !== "all" ? 1 : 0) +
    (selectedCity !== "all" ? 1 : 0) +
    (modalityFilter !== "all" ? 1 : 0) +
    (minExperience > 0 ? 1 : 0) +
    (maxPrice !== "" ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedSpecialty("all");
    setSelectedCity("all");
    setModalityFilter("all");
    setMinExperience(0);
    setMaxPrice("");
    setSortBy("score_desc");
  };

  const handleInterest = async (match: MatchRecord) => {
    setInterestedMap((prev) => ({ ...prev, [match.id]: true }));

    try {
      const res = await interactMatchAction(match.id, true);

      if (res?.isMatched) {
        const lawyer = match.lawyer_profiles;
        setMatchedLawyer({
          name: `${lawyer.profiles.first_name} ${lawyer.profiles.last_name}`,
          bar: `${lawyer.bar_association} • Reg. ${lawyer.bar_number}`,
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
      {/* Control Bar: Sorting, Results count & Filter toggle */}
      <div className="rounded-2xl border border-[#E6EAF0] bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Results count & toggle filters button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                showFilters || activeFiltersCount > 0
                  ? "border-[#3157D5] bg-[#EEF2FF] text-[#3157D5]"
                  : "border-[#E6EAF0] bg-white text-[#202938] hover:border-slate-300"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-[#3157D5] text-white px-1.5 py-0.2 text-[10px] font-mono">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <span className="text-xs text-[#667085]">
              Mostrando <strong className="text-[#101828]">{filteredAndSorted.length}</strong> de{" "}
              {matches.length} profesionales
            </span>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#3157D5] hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ArrowUpDown className="w-4 h-4 text-[#3157D5] shrink-0" />
            <label htmlFor="sort-select" className="text-xs text-[#667085] font-medium">
              Ordenar por:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | "score_desc"
                    | "price_asc"
                    | "experience_desc"
                    | "rating_desc"
                )
              }
              className="rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-3 py-1.5 text-xs font-semibold text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none transition-colors"
            >
              <option value="score_desc">Mayor coincidencia con el caso</option>
              <option value="price_asc">Menor tarifa orientativa</option>
              <option value="experience_desc">Mayor experiencia (Años)</option>
              <option value="rating_desc">Mejor valoración de clientes</option>
            </select>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="pt-4 border-t border-[#E6EAF0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Filter: Specialty */}
            <div>
              <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                Especialidad
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-2.5 py-1.5 text-xs text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none"
              >
                <option value="all">Todas las especialidades</option>
                {availableSpecialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: City */}
            <div>
              <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                Ciudad / Jurisdicción
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-2.5 py-1.5 text-xs text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none"
              >
                <option value="all">Todas las ciudades</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Modality */}
            <div>
              <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                Modalidad
              </label>
              <select
                value={modalityFilter}
                onChange={(e) =>
                  setModalityFilter(
                    e.target.value as "all" | "virtual" | "physical"
                  )
                }
                className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-2.5 py-1.5 text-xs text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none"
              >
                <option value="all">Cualquier modalidad</option>
                <option value="virtual">Virtual / Videollamada</option>
                <option value="physical">Despacho presencial</option>
              </select>
            </div>

            {/* Filter: Min Experience */}
            <div>
              <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                Experiencia mínima
              </label>
              <select
                value={minExperience}
                onChange={(e) => setMinExperience(Number(e.target.value))}
                className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-2.5 py-1.5 text-xs text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none"
              >
                <option value={0}>Cualquier experiencia</option>
                <option value={3}>3+ años de ejercicio</option>
                <option value={5}>5+ años de ejercicio</option>
                <option value={10}>10+ años de ejercicio</option>
              </select>
            </div>

            {/* Filter: Max Price */}
            <div>
              <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                Tarifa máx. (S/.)
              </label>
              <input
                type="number"
                placeholder="Ej: 200"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-2.5 py-1.5 text-xs text-[#101828] placeholder:text-slate-400 focus:bg-white focus:border-[#3157D5] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Directory Cards List */}
      <div className="space-y-4">
        {filteredAndSorted.length > 0 ? (
          filteredAndSorted.map((m) => {
            const lawyer = m.lawyer_profiles;
            const profile = lawyer.profiles;
            const isFav = favoritesSet.has(lawyer.id);
            const isInterested = interestedMap[m.id];
            const isMatched = m.status === "matched";
            const primarySpec =
              lawyer.lawyer_specialties?.find((s) => s.is_primary)?.specialties?.name ||
              lawyer.lawyer_specialties?.[0]?.specialties?.name ||
              "Especialista Jurídico";

            const isVerified = lawyer.verification_status === "approved" || !!lawyer.bar_number;

            return (
              <div
                key={m.id}
                className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 rounded-3xl border border-[#E6EAF0] bg-white p-5 sm:p-6 hover:border-[#3157D5]/60 hover:shadow-md transition-all shadow-xs"
              >
                {/* Lawyer Information Block */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#101828] text-white font-bold text-lg shadow-xs font-serif">
                    {profile.first_name?.[0] || "A"}
                    {profile.last_name?.[0] || "L"}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-[#101828] text-base truncate font-serif">
                        {profile.first_name} {profile.last_name}
                      </h3>

                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-[11px] font-bold text-[#198754] font-mono">
                          <ShieldCheck className="w-3 h-3" />
                          Habilitado CAL {lawyer.bar_number}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-[#667085] font-mono">
                          En verificación
                        </span>
                      )}

                      <span className="text-[11px] text-[#667085]">
                        • {lawyer.bar_association}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#3157D5] truncate">
                      {primarySpec} • {lawyer.professional_title}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#667085]">
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
                      <span className="flex items-center gap-1 text-[#202938]">
                        <MapPin className="w-3 h-3 text-[#3157D5]" />
                        {profile.city}
                      </span>
                      {lawyer.virtual_attention && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#202938]">
                            <Video className="w-3 h-3 text-[#3157D5]" />
                            Virtual
                          </span>
                        </>
                      )}
                    </div>

                    {/* Explicability Factor Chips */}
                    <div className="pt-1.5">
                      <ExplicabilityChips
                        breakdown={m.breakdown || {}}
                        specialtyName={primarySpec}
                        city={profile.city}
                        yearsExperience={lawyer.years_experience}
                      />
                    </div>
                  </div>
                </div>

                {/* Score, Price and Action Buttons */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E6EAF0] shrink-0">
                  <div className="text-left lg:text-right">
                    <div className="flex items-center lg:justify-end gap-1.5 font-mono text-base font-extrabold text-[#3157D5]">
                      <span>{Math.round(m.score)}%</span>
                      <span className="text-[11px] font-normal text-[#667085]">
                        coincidencia
                      </span>
                    </div>
                    <p className="text-xs text-[#202938] mt-0.5 font-semibold">
                      {lawyer.consultation_price
                        ? `S/. ${lawyer.consultation_price} / consulta`
                        : "Tarifa a convenir"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Detail Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedForDetail(m)}
                      aria-label="Ver perfil completo del abogado"
                      className="rounded-xl border border-[#E6EAF0] bg-white px-3 py-2 text-xs font-semibold text-[#202938] hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Ver perfil
                    </button>

                    {/* Favorite Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(lawyer.id)}
                      aria-label={isFav ? "Eliminar de favoritos" : "Guardar en favoritos"}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                        isFav
                          ? "border-[#3157D5] bg-[#EEF2FF] text-[#3157D5]"
                          : "border-[#E6EAF0] bg-white text-[#667085] hover:border-slate-300 hover:text-[#101828]"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "fill-[#3157D5]" : ""}`} />
                    </button>

                    {/* Interest / Match CTA */}
                    {isMatched ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#198754]/30 bg-[#E8F5E9] px-3.5 py-2 text-xs font-bold text-[#198754]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Match Confirmado
                      </span>
                    ) : isInterested ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6EAF0] bg-slate-100 px-3.5 py-2 text-xs font-semibold text-[#667085]">
                        Interés Enviado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInterest(m)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-4 py-2 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current text-blue-400" />
                        <span>Me Interesa</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-[#E6EAF0] bg-white p-12 text-center shadow-xs">
            <p className="text-sm font-bold text-[#101828]">
              No hay profesionales que coincidan con estos filtros específicos
            </p>
            <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
              Prueba relajando el rango de precio, quitando el filtro de modalidad o cambiando la especialidad seleccionada.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-4 py-2 text-xs font-bold text-[#3157D5] hover:bg-white cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer filtros
            </button>
          </div>
        )}
      </div>

      {/* Lawyer Full Profile Modal */}
      {selectedForDetail && (
        <LawyerDetailModal
          isOpen={true}
          onClose={() => setSelectedForDetail(null)}
          match={selectedForDetail}
          isFavorite={favoritesSet.has(selectedForDetail.lawyer_profiles.id)}
          onToggleFavorite={handleToggleFavorite}
          onExpressInterest={() => handleInterest(selectedForDetail)}
          isInterested={interestedMap[selectedForDetail.id]}
        />
      )}

      {/* Match Celebration Modal */}
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
