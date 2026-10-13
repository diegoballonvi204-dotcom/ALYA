"use client";

import { useState, useEffect, useCallback } from "react";
import SwipeCard, { type MatchRecord } from "./SwipeCard";
import MatchModal from "./MatchModal";
import LawyerDetailModal from "./LawyerDetailModal";
import { interactMatchAction, toggleFavoriteAction } from "@/actions/cases.actions";
import { RefreshCw, List, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";

interface SwipeDeckProps {
  matches: MatchRecord[];
  caseId: string;
  onSwitchToList?: () => void;
  favoritesSet: Set<string>;
  onFavoriteChange: (lawyerId: string, isFav: boolean) => void;
  onExpressInterest?: (lawyerId: string, lawyerName: string) => Promise<void>;
}

export default function SwipeDeck({
  matches,
  caseId,
  onSwitchToList,
  favoritesSet,
  onFavoriteChange,
  onExpressInterest,
}: SwipeDeckProps) {
  const [deck, setDeck] = useState<MatchRecord[]>(matches);
  const [swipedHistory, setSwipedHistory] = useState<MatchRecord[]>([]);
  const [selectedForDetail, setSelectedForDetail] = useState<MatchRecord | null>(null);
  const [matchedLawyer, setMatchedLawyer] = useState<{
    name: string;
    bar: string;
    title?: string;
    conversationId?: string | null;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Synchronize deck whenever parent matches filter changes
  useEffect(() => {
    setDeck(matches);
    setSwipedHistory([]);
  }, [matches]);

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (deck.length === 0 || isProcessing) return;

      const current = deck[0];
      const interested = direction === "right";
      const lawyer = current.lawyer_profiles;
      const fullName = `${lawyer.profiles.first_name} ${lawyer.profiles.last_name}`;

      // Save into history for Undo
      setSwipedHistory((prev) => [...prev, current]);
      setDeck((prev) => prev.slice(1));
      setIsProcessing(true);

      try {
        if (interested && onExpressInterest) {
          await onExpressInterest(lawyer.id, fullName);
        }

        const res = await interactMatchAction(current.id, interested);

        if (res?.isMatched) {
          setMatchedLawyer({
            name: fullName,
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
    [deck, isProcessing, onExpressInterest]
  );

  const handleUndo = useCallback(() => {
    if (swipedHistory.length === 0) return;
    const lastCard = swipedHistory[swipedHistory.length - 1];
    setSwipedHistory((prev) => prev.slice(0, -1));
    setDeck((prev) => [lastCard, ...prev]);
  }, [swipedHistory]);

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
    setSwipedHistory([]);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedForDetail) return;

      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSwipe("right");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSwipe("left");
      } else if (e.key === "f" || e.key === "F" || e.key === "s" || e.key === "S") {
        if (deck.length > 0) {
          e.preventDefault();
          handleToggleFavorite(deck[0].lawyer_profiles.id);
        }
      } else if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwipe, handleToggleFavorite, handleUndo, deck, selectedForDetail]);

  if (deck.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 text-center shadow-md animate-fade-in font-sans">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-200/60 shadow-2xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
          ¡Has revisado todos los perfiles disponibles!
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed max-w-sm mx-auto font-sans">
          Has evaluado a los profesionales para este caso. Puedes reiniciar la baraja, deshacer el último pase o ver la lista completa en el directorio.
        </p>

        <div className="mt-7 space-y-3 font-sans">
          {swipedHistory.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-3 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-blue-600" />
              <span>Deshacer último pase (Recuperar tarjeta)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetDeck}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-3.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Volver a explorar tarjetas ({matches.length})</span>
          </button>

          {onSwitchToList && (
            <button
              type="button"
              onClick={onSwitchToList}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-semibold text-slate-700 hover:bg-white transition-colors cursor-pointer"
            >
              <List className="w-4 h-4 text-slate-500" />
              <span>Ver en Directorio con filtros avanzados</span>
            </button>
          )}

          <Link
            href="/dashboard"
            className="block text-xs font-medium text-slate-500 hover:text-blue-600 pt-2"
          >
            ← Volver a mi panel de casos
          </Link>
        </div>
      </div>
    );
  }

  // Render up to 3 cards for clean stack physics
  const visibleCards = deck.slice(0, 3);
  const currentIndex = matches.length - deck.length + 1;

  return (
    <>
      <div className="flex flex-col items-center font-sans w-full">
        {/* Progress & Controls Bar */}
        <div className="flex items-center justify-between w-full max-w-[720px] px-2 pb-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Abogado {currentIndex} de {matches.length}
            </span>

            {swipedHistory.length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200/80 hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors cursor-pointer shadow-2xs"
                title="Deshacer el descarte o pase anterior (Atajo: Z)"
              >
                <RotateCcw className="w-3 h-3 text-blue-600" />
                <span>Deshacer</span>
              </button>
            )}
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Atajos:</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-2xs">←</kbd>
              <span className="text-[11px]">Pasar</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-2xs">→</kbd>
              <span className="text-[11px]">Interés</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-2xs">S</kbd>
              <span className="text-[11px]">Guardar</span>
            </span>
          </div>
        </div>

        {/* Card Deck Viewport Container */}
        <div className="relative mx-auto h-[610px] sm:h-[625px] w-full max-w-[720px]">
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
                    isSubmittingInterest={isFront && isProcessing}
                  />
                </div>
              );
            })
            .reverse()}
        </div>
      </div>

      {/* Match Notification Modal (when mutual interest happens) */}
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

      {/* Full Lawyer Detail Modal */}
      {selectedForDetail && (
        <LawyerDetailModal
          isOpen={true}
          onClose={() => setSelectedForDetail(null)}
          match={selectedForDetail}
          isFavorite={favoritesSet.has(selectedForDetail.lawyer_profiles.id)}
          onToggleFavorite={handleToggleFavorite}
          onExpressInterest={() => {
            const lawyer = selectedForDetail.lawyer_profiles;
            const fullName = `${lawyer.profiles.first_name} ${lawyer.profiles.last_name}`;
            handleSwipe("right");
            setSelectedForDetail(null);
          }}
          isInterested={selectedForDetail.user_interest}
        />
      )}
    </>
  );
}
