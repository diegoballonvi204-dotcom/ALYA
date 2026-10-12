"use client";

import { useState, useMemo, useCallback } from "react";
import SwipeDeck from "./SwipeDeck";
import LawyerListView from "./LawyerListView";
import CaseDetailModal, { type CaseDraft } from "./CaseDetailModal";
import type { MatchRecord } from "./SwipeCard";
import { directMatchWithLawyerAction, toggleFavoriteAction } from "@/actions/cases.actions";
import {
  Layers,
  List,
  SlidersHorizontal,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Check,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface SpecialtyItem {
  id: number;
  name: string;
  slug?: string;
}

interface DirectInquiryContainerProps {
  initialLawyers: MatchRecord[];
  specialties: SpecialtyItem[];
  userCity?: string;
  initialFavorites?: string[];
}

export default function DirectInquiryContainer({
  initialLawyers,
  specialties,
  userCity = "Lima",
  initialFavorites = [],
}: DirectInquiryContainerProps) {
  // Mode toggle
  const [viewMode, setViewMode] = useState<"swipe" | "list">("swipe");

  // Filters state
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedModality, setSelectedModality] = useState<"all" | "virtual" | "physical">("all");

  // Case draft state (extra information for the lawyer)
  const [caseDraft, setCaseDraft] = useState<CaseDraft>({
    title: "",
    description: "",
    specialtyId: specialties[0]?.id || 1,
    specialtyName: specialties[0]?.name || "Derecho Laboral",
    urgency: "medium",
    city: userCity,
    modality: "virtual",
    isConfidential: true,
  });

  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [pendingMatchLawyer, setPendingMatchLawyer] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Favorites state
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(
    new Set(initialFavorites)
  );

  // Success match toast feedback
  const [matchSuccessBanner, setMatchSuccessBanner] = useState<string | null>(null);

  // Unique cities list
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    initialLawyers.forEach((l) => {
      const c = l.lawyer_profiles.profiles.city;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [initialLawyers]);

  // Real-time filtering of lawyers
  const filteredLawyers = useMemo(() => {
    let result = [...initialLawyers];

    // Specialty filter
    if (selectedSpecialty !== "all") {
      result = result.filter((m) =>
        m.lawyer_profiles.lawyer_specialties?.some(
          (s) => s.specialties?.name.toLowerCase() === selectedSpecialty.toLowerCase()
        )
      );
    }

    // City filter
    if (selectedCity !== "all") {
      result = result.filter(
        (m) =>
          m.lawyer_profiles.profiles.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // Modality filter
    if (selectedModality === "virtual") {
      result = result.filter((m) => m.lawyer_profiles.virtual_attention);
    } else if (selectedModality === "physical") {
      result = result.filter((m) => m.lawyer_profiles.physical_attention);
    }

    return result;
  }, [initialLawyers, selectedSpecialty, selectedCity, selectedModality]);

  const hasCaseDetails = caseDraft.title.trim().length > 0 && caseDraft.description.trim().length > 0;

  const handleFavoriteChange = (lawyerId: string, isFav: boolean) => {
    setFavoritesSet((prev) => {
      const updated = new Set(prev);
      if (isFav) updated.add(lawyerId);
      else updated.delete(lawyerId);
      return updated;
    });
  };

  // Direct match sender
  const sendInquiryToLawyer = useCallback(
    async (lawyerId: string, lawyerName: string, draft: CaseDraft) => {
      try {
        const res = await directMatchWithLawyerAction({
          lawyerId,
          title: draft.title || "Consulta Legal Directa",
          description: draft.description || "Consulta enviada directamente desde el explorador de abogados.",
          specialtyId: draft.specialtyId,
          city: draft.city,
          modality: draft.modality,
          urgency: draft.urgency,
          isConfidential: draft.isConfidential,
        });

        if (res?.success) {
          setMatchSuccessBanner(
            `¡Interés enviado a ${lawyerName}! Se han registrado los detalles de tu consulta para que el profesional revise tu caso.`
          );
          setTimeout(() => setMatchSuccessBanner(null), 7000);
        }
      } catch (err) {
        console.error("Error al enviar consulta directa:", err);
      }
    },
    []
  );

  const resetFilters = () => {
    setSelectedSpecialty("all");
    setSelectedCity("all");
    setSelectedModality("all");
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Success Notification Banner */}
      {matchSuccessBanner && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#198754]/30 bg-[#E8F5E9] p-4 text-xs font-semibold text-[#198754] shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-[#198754]" />
          <span className="flex-1">{matchSuccessBanner}</span>
          <button
            onClick={() => setMatchSuccessBanner(null)}
            className="text-[#198754] hover:underline text-[11px] font-bold"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#101828] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#3157D5]" />
          <span>Volver a mis casos</span>
        </Link>

        {/* View Mode Toggle */}
        <div
          className="flex items-center rounded-2xl border border-[#E6EAF0] bg-white p-1 shadow-xs self-start sm:self-auto"
          role="tablist"
          aria-label="Modo de visualización"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "swipe"}
            onClick={() => setViewMode("swipe")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "swipe"
                ? "bg-[#101828] text-white shadow-xs"
                : "text-[#667085] hover:text-[#101828]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Tarjetas Swipe</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-[#101828] text-white shadow-xs"
                : "text-[#667085] hover:text-[#101828]"
            }`}
          >
            <List className="w-3.5 h-3.5 text-blue-400" />
            <span>Directorio ({filteredLawyers.length})</span>
          </button>
        </div>
      </div>

      {/* Header and Case Detailing Trigger Box */}
      <header className="rounded-3xl border border-[#E6EAF0] bg-white p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#3157D5] font-mono">
              Descubrimiento Jurídico Directo
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101828] font-serif mt-1">
              Encuentra al abogado ideal para tu caso
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1 leading-relaxed max-w-xl">
              Explora abogados colegiados habilitados. Desliza para evaluar y añade los detalles de tu consulta para que el profesional los revise y acepte el match.
            </p>
          </div>

          {/* Prominent Case Detail Trigger Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setPendingMatchLawyer(null);
                setIsDetailModalOpen(true);
              }}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all cursor-pointer shadow-xs ${
                hasCaseDetails
                  ? "border border-[#198754]/30 bg-[#E8F5E9] text-[#198754] hover:bg-[#E8F5E9]/80"
                  : "border border-[#D1DEFC] bg-[#EEF2FF] text-[#3157D5] hover:bg-[#D1DEFC]/50"
              }`}
            >
              {hasCaseDetails ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#198754]" />
                  <div className="text-left">
                    <span className="block font-bold">Detalles agregados</span>
                    <span className="block text-[10px] text-[#667085] font-normal truncate max-w-[150px]">
                      {caseDraft.title}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-[#3157D5]" />
                  <div className="text-left">
                    <span className="block font-bold">+ Detallar mi consulta legal</span>
                    <span className="block text-[10px] text-[#667085] font-normal">
                      Para que el abogado vea tu caso
                    </span>
                  </div>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="pt-4 border-t border-[#E6EAF0] flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-[#101828] flex items-center gap-1.5 mr-1 font-mono uppercase text-[11px]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#3157D5]" />
            Filtros rápidos:
          </span>

          {/* Specialty Filter */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-3 py-1.5 text-xs font-semibold text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none"
          >
            <option value="all">Todas las especialidades</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-3 py-1.5 text-xs font-semibold text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none"
          >
            <option value="all">Todas las ciudades</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Modality Filter */}
          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value as any)}
            className="rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-3 py-1.5 text-xs font-semibold text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none"
          >
            <option value="all">Cualquier modalidad</option>
            <option value="virtual">Solo Virtual</option>
            <option value="physical">Solo Presencial</option>
          </select>

          {(selectedSpecialty !== "all" || selectedCity !== "all" || selectedModality !== "all") && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-[#3157D5] hover:underline font-semibold cursor-pointer ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}

          <span className="text-xs text-[#667085] ml-auto font-mono">
            <strong>{filteredLawyers.length}</strong> disponibles
          </span>
        </div>
      </header>

      {/* Main Lawyers Viewport */}
      {filteredLawyers.length > 0 ? (
        viewMode === "swipe" ? (
          <main className="py-2">
            <SwipeDeck
              matches={filteredLawyers}
              caseId="direct_inquiry"
              onSwitchToList={() => setViewMode("list")}
              favoritesSet={favoritesSet}
              onFavoriteChange={handleFavoriteChange}
            />
          </main>
        ) : (
          <main>
            <LawyerListView
              matches={filteredLawyers}
              caseId="direct_inquiry"
              favoritesSet={favoritesSet}
              onFavoriteChange={handleFavoriteChange}
            />
          </main>
        )
      ) : (
        <div className="rounded-3xl border border-dashed border-[#E6EAF0] bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#3157D5] mb-3">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#101828] font-serif">
            No se encontraron abogados con estos filtros
          </h2>
          <p className="text-xs text-[#667085] max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            Prueba seleccionando &ldquo;Todas las especialidades&rdquo; o &ldquo;Todas las ciudades&rdquo; para explorar el directorio completo.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-5 py-2.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer filtros</span>
          </button>
        </div>
      )}

      {/* Case Detail Modal */}
      <CaseDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        caseDraft={caseDraft}
        onSaveDraft={(updated) => setCaseDraft(updated)}
        targetLawyerName={pendingMatchLawyer?.name}
        onSendDirectInquiry={
          pendingMatchLawyer
            ? async (draft) => {
                await sendInquiryToLawyer(
                  pendingMatchLawyer.id,
                  pendingMatchLawyer.name,
                  draft
                );
              }
            : undefined
        }
        specialtiesList={specialties}
      />
    </div>
  );
}
