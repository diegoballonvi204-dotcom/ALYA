"use client";

import { useState } from "react";
import SwipeDeck from "./SwipeDeck";
import LawyerListView from "./LawyerListView";
import type { MatchRecord } from "./SwipeCard";
import {
  Sparkles,
  Layers,
  List,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Briefcase,
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
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-6">
      {/* Top Navigation & Case Context Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
          Volver a mi panel
        </Link>

        {/* View Mode Toggle Pill */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 self-start sm:self-auto shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("swipe")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              viewMode === "swipe"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4 text-blue-400" />
            Tarjetas Swipe
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              viewMode === "list"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-4 h-4 text-blue-400" />
            Modo Directorio
          </button>
        </div>
      </div>

      {/* Case Summary Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#2563EB] font-mono">
              {caseData.specialties?.name || "Materia Jurídica"}
            </span>
            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-semibold">
              Urgencia {caseData.urgency}
            </span>
          </div>

          <span className="text-xs font-mono text-[#2563EB] font-bold">
            {matches.length} profesionales compatibles identificados
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] font-serif">
          {caseData.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
            {caseData.city}
          </span>
          <span>•</span>
          <span className="capitalize">{caseData.modality}</span>
          <span>•</span>
          <span className="text-slate-500 line-clamp-1 max-w-xl">
            {caseData.description}
          </span>
        </div>
      </div>

      {/* Matching Experience */}
      {matches.length > 0 ? (
        viewMode === "swipe" ? (
          <div className="py-2">
            <SwipeDeck
              matches={matches}
              caseId={caseData.id}
              onSwitchToList={() => setViewMode("list")}
              favoritesSet={favoritesSet}
              onFavoriteChange={handleFavoriteChange}
            />
          </div>
        ) : (
          <LawyerListView
            matches={matches}
            caseId={caseData.id}
            favoritesSet={favoritesSet}
            onFavoriteChange={handleFavoriteChange}
          />
        )
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] font-serif">
            Buscando abogados colegiados compatibles
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            Actualmente no hay abogados verificados en tu ciudad exacta con esta subespecialidad
            disponibles de inmediato. Tu caso ha sido publicado en la red y serás notificado en
            cuanto un profesional muestre interés.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-6 py-3 text-xs font-bold text-white transition-all shadow-md shadow-slate-900/10"
            >
              Publicar otro caso
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
            >
              Ir a mi panel
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
