"use client";

import { useState, useEffect, useCallback } from "react";
import SwipeCard, { type MatchRecord } from "./SwipeCard";
import MatchModal from "./MatchModal";
import LawyerDetailModal from "./LawyerDetailModal";
import { interactMatchAction, toggleFavoriteAction } from "@/actions/cases.actions";
import { RefreshCw, List, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface SwipeDeckProps {
  matches: MatchRecord[];
  caseId: string;
  onSwitchToList?: () => void;
  favoritesSet: Set<string>;
  onFavoriteChange: (lawyerId: string, isFav: boolean) => void;
}

export default function SwipeDeck({
  matches,
  caseId,
  onSwitchToList,
  favoritesSet,
  onFavoriteChange,
}: SwipeDeckProps) {
  const [deck, setDeck] = useState<MatchRecord[]>(matches);
  const [selectedForDetail, setSelectedForDetail] = useState<MatchRecord | null>(null);
  const [matchedLawyer, setMatchedLawyer] = useState<{
    name: string;
    bar: string;
    title?: string;
    conversationId?: string | null;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (deck.length === 0 || isProcessing) return;

      const current = deck[0];
      const interested = direction === "right";

      // Optimistic: remover de la pila inmediatamente
      setDeck((prev) => prev.slice(1));
      setIsProcessing(true);

      try {
        const res = await interactMatchAction(current.id, interested);

        // Si ocurrió match bilateral
        if (res?.isMatched) {
          const lawyer = current.lawyer_profiles;
          setMatchedLawyer({
            name: `${lawyer.profiles.first_name} ${lawyer.profiles.last_name}`,
            bar: `${lawyer.bar_association} • Reg. ${lawyer.bar_number}`,
            title: lawyer.professional_title,
            conversationId: res.conversationId,
          });
        }
      } catch (err) {
        console.error("Error al registrar interacción de match:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [deck, isProcessing]
  );

  const handleToggleFavorite = useCallback(
    async (lawyerId: string) => {
      try {
        const res = await toggleFavoriteAction(lawyerId, "lawyer");
        if (res?.success) {
          onFavoriteChange(lawyerId, res.isFavorite);
        }
      } catch (err) {
        console.error("Error toggling favorite:", err);
      }
    },
    [onFavoriteChange]
  );

  const handleResetDeck = () => {
    setDeck(matches);
  };

  // Teclado accesible para escritorio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedForDetail) return; // Si el modal de detalle está abierto, ignorar flechas de swipe

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSwipe("right");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSwipe("left");
      } else if (e.key === "f" || e.key === "F") {
        if (deck.length > 0) {
          e.preventDefault();
          handleToggleFavorite(deck[0].lawyer_profiles.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwipe, handleToggleFavorite, deck, selectedForDetail]);

  if (deck.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-[#E6EAF0] bg-white p-8 sm:p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#3157D5] mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-[#101828] font-serif">
          ¡Has revisado todos los perfiles recomendados!
        </h3>
        <p className="text-xs sm:text-sm text-[#667085] mt-2.5 leading-relaxed max-w-sm mx-auto">
          Ya has evaluado a los profesionales disponibles para esta consulta. Puedes volver a explorar la baraja o ver el directorio completo para filtrar por otros criterios.
        </p>

        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={handleResetDeck}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] py-3.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            Volver a explorar tarjetas
          </button>

          {onSwitchToList && (
            <button
              type="button"
              onClick={onSwitchToList}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] py-3 text-xs font-semibold text-[#202938] hover:bg-white transition-colors cursor-pointer"
            >
              <List className="w-4 h-4 text-[#667085]" />
              Ver en Directorio con Filtros
            </button>
          )}

          <Link
            href="/dashboard"
            className="block text-xs font-medium text-[#667085] hover:text-[#3157D5] pt-2"
          >
            ← Volver a mi panel de casos
          </Link>
        </div>
      </div>
    );
  }

  // Tomamos hasta 3 cartas para renderizar con efecto de pila equilibrado
  const visibleCards = deck.slice(0, 3);

  return (
    <>
      <div className="flex flex-col items-center">
        {/* Progress & Quick Helper */}
        <div className="flex items-center justify-between w-full max-w-md px-2 pb-3 text-xs text-[#667085]">
          <span className="font-mono font-semibold">
            Profesional {matches.length - deck.length + 1} de {matches.length}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[#667085]">
            Atajos: <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[10px]">←</kbd> Pasar{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[10px]">→</kbd> Interés
          </span>
        </div>

        {/* Card Deck Viewport Container */}
        <div className="relative mx-auto h-[590px] w-full max-w-md">
          {visibleCards
            .map((m, index) => {
              const isFront = index === 0;
              const translateY = index * 10;
              const scale = 1 - index * 0.035;
              const zIndex = 10 - index;

              return (
                <div
                  key={m.id}
                  style={{
                    transform: `translateY(${translateY}px) scale(${scale})`,
                    zIndex,
                  }}
                  className="absolute inset-0 transition-transform duration-300"
                >
                  <SwipeCard
                    match={m}
                    isFront={isFront}
                    onSwipe={handleSwipe}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favoritesSet.has(m.lawyer_profiles.id)}
                    onOpenDetail={(matchToOpen) => setSelectedForDetail(matchToOpen)}
                  />
                </div>
              );
            })
            .reverse()}
        </div>
      </div>

      {/* Lawyer Full Profile Modal */}
      {selectedForDetail && (
        <LawyerDetailModal
          isOpen={true}
          onClose={() => setSelectedForDetail(null)}
          match={selectedForDetail}
          isFavorite={favoritesSet.has(selectedForDetail.lawyer_profiles.id)}
          onToggleFavorite={handleToggleFavorite}
          onExpressInterest={() => handleSwipe("right")}
        />
      )}

      {/* Bilateral Match Celebration Modal */}
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
    </>
  );
}
