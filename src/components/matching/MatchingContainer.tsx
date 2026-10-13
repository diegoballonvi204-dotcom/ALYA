"use client";

import { useState } from "react";
import SwipeDeck from "./SwipeDeck";
import LawyerListView from "./LawyerListView";
import type { MatchRecord } from "./SwipeCard";
import {
  Layers,
  List,
  MapPin,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface MatchingContainerProps {
  matches: MatchRecord[];
  caseData: {
    id: string;
    title: string;
    description: string;
    city: string;
    modality: string;
    urgency: string;
    specialties?: {
      name: string;
    } | null;
  };
  initialFavorites: string[];
}

export default function MatchingContainer({
  matches,
  caseData,
  initialFavorites,
}: MatchingContainerProps) {
  const [viewMode, setViewMode] = useState<"swipe" | "list">("swipe");
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(
    new Set(initialFavorites)
  );

  const handleFavoriteChange = (lawyerId: string, isFav: boolean) => {
    setFavoritesSet((prev) => {
      const updated = new Set(prev);
      if (isFav) updated.add(lawyerId);
      else updated.delete(lawyerId);
      return updated;
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Breadcrumb & Return Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#101828] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#3157D5]" />
          <span>Volver a mis casos</span>
        </Link>

        {/* View Mode Toggle Pill */}
        <div
          className="flex items-center rounded-2xl border border-[#E6EAF0] bg-white p-1 shadow-xs"
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
            <span>Directorio ({matches.length})</span>
          </button>
        </div>
      </div>

      {/* Case Header Card - Clean, Moderate & Informative */}
      <header className="rounded-3xl border border-[#E6EAF0] bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#EEF2FF] border border-[#D1DEFC] px-3 py-0.5 text-xs font-bold text-[#3157D5] font-mono">
              {caseData.specialties?.name || "Materia Jurídica"}
            </span>
            <span className="text-[11px] font-mono uppercase bg-[#F7F8FC] border border-[#E6EAF0] text-[#667085] px-2.5 py-0.5 rounded-full font-semibold">
              Urgencia {caseData.urgency}
            </span>
          </div>

          <span className="text-xs font-mono font-bold text-[#3157D5] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#198754]" />
            <span>{matches.length} profesionales idóneos disponibles</span>
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101828] font-serif">
          Encuentra al abogado adecuado para tu caso
        </h1>

        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[#E6EAF0] text-xs text-[#667085]">
          <span className="flex items-center gap-1 font-medium text-[#202938]">
            <MapPin className="w-3.5 h-3.5 text-[#3157D5]" />
            {caseData.city}
          </span>
          <span>•</span>
          <span className="capitalize text-[#202938]">Modalidad: {caseData.modality}</span>
          <span>•</span>
          <span className="text-[#667085] line-clamp-1 max-w-md italic">
            &ldquo;{caseData.title}&rdquo;
          </span>
        </div>
      </header>

      {/* Main Matching Area */}
      {matches.length > 0 ? (
        viewMode === "swipe" ? (
          <main className="py-2">
            <SwipeDeck
              matches={matches}
              caseId={caseData.id}
              onSwitchToList={() => setViewMode("list")}
              favoritesSet={favoritesSet}
              onFavoriteChange={handleFavoriteChange}
            />
          </main>
        ) : (
          <main>
            <LawyerListView
              matches={matches}
              caseId={caseData.id}
              favoritesSet={favoritesSet}
              onFavoriteChange={handleFavoriteChange}
            />
          </main>
        )
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-[#E6EAF0] bg-white p-10 sm:p-14 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#3157D5] mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#101828] font-serif">
            Ampliando la búsqueda de abogados colegiados
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] max-w-md mx-auto mt-2 leading-relaxed">
            No hay abogados con esta subespecialidad exacta con disponibilidad instantánea en {caseData.city}. Tu caso permanece publicado de forma segura y serás notificado en cuanto un profesional afín revise el expediente.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-6 py-3 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
            >
              Volver a Mis Casos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
