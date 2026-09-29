"use client";

import { useState } from "react";
import SwipeCard, { type MatchRecord } from "./SwipeCard";
import MatchModal from "./MatchModal";
import { interactMatchAction, toggleFavoriteAction } from "@/actions/cases.actions";
import { Sparkles, RefreshCw, List, CheckCircle2, ShieldAlert } from "lucide-react";
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
  const [matchedLawyer, setMatchedLawyer] = useState<{
    name: string;
    bar: string;
    title?: string;
    conversationId?: string | null;
  } | null>(null);

  const handleSwipe = async (direction: "left" | "right") => {
    if (deck.length === 0) return;

    const current = deck[0];
    const interested = direction === "right";

    // Optimistic: remover de la pila inmediatamente
    setDeck((prev) => prev.slice(1));

    try {
      const res = await interactMatchAction(current.id, interested);

      // Si ocurrió match bilateral
      if (res?.isMatched) {
        const lawyer = current.lawyer_profiles;
        setMatchedLawyer({
          name: `${lawyer.profiles.first_name} ${lawyer.profiles.last_name}`,
          bar: `${lawyer.bar_association} • Matrícula ${lawyer.bar_number}`,
          title: lawyer.professional_title,
          conversationId: res.conversationId,
        });
      }
    } catch (err) {
      console.error("Error al registrar interacción de match:", err);
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

  const handleResetDeck = () => {
    setDeck(matches);
  };

  if (deck.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#0F172A] font-serif">¡Has revisado todos los perfiles!</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Ya has explorado los abogados recomendados para este caso. Puedes volver a revisar
          los perfiles o explorar el directorio completo en modo lista.
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleResetDeck}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] py-3 text-xs font-bold text-white transition-all shadow-md shadow-slate-900/10"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            Volver a explorar tarjetas
          </button>

          {onSwitchToList && (
            <button
              type="button"
              onClick={onSwitchToList}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
            >
              <List className="w-4 h-4 text-slate-500" />
              Ver en Modo Directorio
            </button>
          )}

          <Link
            href="/dashboard"
            className="block text-xs font-medium text-slate-500 hover:text-[#2563EB] pt-2"
          >
            ← Volver a mi panel de casos
          </Link>
        </div>
      </div>
    );
  }

  // Tomamos hasta 3 cartas para renderizar con efecto de pila 3D
  const visibleCards = deck.slice(0, 3);

  return (
    <>
      <div className="relative mx-auto h-[610px] w-full max-w-md">
        {visibleCards
          .map((m, index) => {
            const isFront = index === 0;
            const translateY = index * 12;
            const scale = 1 - index * 0.04;
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
                />
              </div>
            );
          })
          .reverse()}
      </div>

      {/* Match Bilateral Celebration Modal */}
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
