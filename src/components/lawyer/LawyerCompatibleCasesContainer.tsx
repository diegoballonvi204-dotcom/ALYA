"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import CaseSwipeCard, { type LawyerCaseItem } from "./CaseSwipeCard";
import CompatibleCaseCard from "./CompatibleCaseCard";
import SubscriptionUpgradeModal from "./SubscriptionUpgradeModal";
import LawyerAIBriefModal from "./LawyerAIBriefModal";
import MatchModal from "../matching/MatchModal";
import { lawyerInteractMatchAction } from "@/actions/cases.actions";
import { getLawyerCaseAIBriefAction, LawyerAIBriefResult } from "@/actions/ai.actions";
import {
  Layers,
  List,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  Briefcase,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface LawyerCaseEntry {
  caseItem: LawyerCaseItem;
  matchInfo?: {
    id: string;
    score: number;
    user_interest: boolean;
    lawyer_interest: boolean;
    status: string;
    conversation_id?: string | null;
  } | null;
  isRadarVip?: boolean;
}

interface LawyerCompatibleCasesContainerProps {
  initialCases: LawyerCaseEntry[];
  hasRadarPriority?: boolean;
}

export default function LawyerCompatibleCasesContainer({
  initialCases,
  hasRadarPriority = false,
}: LawyerCompatibleCasesContainerProps) {
  // Mode toggle: Default is 'swipe' for rapid micro-interactions!
  const [viewMode, setViewMode] = useState<"swipe" | "list">("swipe");

  // Filters state for procedural urgency & jurisdiction
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  // Deck state
  const [deck, setDeck] = useState<LawyerCaseEntry[]>(initialCases);
  const [isProcessing, setIsProcessing] = useState(false);

  // Bilateral match modal state
  const [matchedCase, setMatchedCase] = useState<{
    lawyerName: string;
    lawyerBar: string;
    title: string;
    conversationId?: string | null;
    caseId: string;
  } | null>(null);

  // Quota & AI brief states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [quotaData, setQuotaData] = useState<{ currentUsage: number; maxQuota: number } | null>(null);
  const [selectedCaseForBrief, setSelectedCaseForBrief] = useState<LawyerCaseItem | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [aiBrief, setAiBrief] = useState<LawyerAIBriefResult | null>(null);
  const [isBriefLocked, setIsBriefLocked] = useState(false);

  // Unique cities list
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    initialCases.forEach((c) => {
      if (c.caseItem.city) set.add(c.caseItem.city);
    });
    return Array.from(set).sort();
  }, [initialCases]);

  // Real-time filtering
  const filteredCases = useMemo(() => {
    let result = [...initialCases];

    if (selectedUrgency !== "all") {
      result = result.filter((c) => c.caseItem.urgency === selectedUrgency);
    }

    if (selectedCity !== "all") {
      result = result.filter(
        (c) => c.caseItem.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    return result;
  }, [initialCases, selectedUrgency, selectedCity]);

  // Sync deck when filteredCases change
  useEffect(() => {
    setDeck(filteredCases);
  }, [filteredCases]);

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (deck.length === 0 || isProcessing) return;

      const current = deck[0];
      const interested = direction === "right";

      // Optimistic removal
      setDeck((prev) => prev.slice(1));
      setIsProcessing(true);

      // Si el abogado da like a la derecha (Postular Interés),
      // mostramos el modal de conexión bilateral de forma inmediata (0ms de latencia)
      if (interested) {
        setMatchedCase({
          lawyerName: "Justiciable Interesado",
          lawyerBar: "Identidad Desbloqueada con Éxito",
          title: current.caseItem.title,
          conversationId: current.matchInfo?.conversation_id || null,
          caseId: current.caseItem.id,
        });
      }

      try {
        const res = await lawyerInteractMatchAction({
          matchId: current.matchInfo?.id,
          caseId: current.caseItem.id,
          interested,
        });

        if (res?.error === "QUOTA_EXCEEDED") {
          setMatchedCase(null);
          setQuotaData({
            currentUsage: (res.quotaInfo as any)?.current_usage || 3,
            maxQuota: (res.quotaInfo as any)?.max_quota || 3,
          });
          setShowUpgradeModal(true);
        } else if (res?.error) {
          console.error("Error al registrar interacción del abogado:", res.error);
          if (interested) {
            setMatchedCase(null);
          }
        } else if (res?.success && res.isMatched) {
          setMatchedCase({
            lawyerName: "Justiciable Interesado",
            lawyerBar: "Identidad Desbloqueada con Éxito",
            title: current.caseItem.title,
            conversationId: res.conversationId,
            caseId: current.caseItem.id,
          });
        }
      } catch (err) {
        console.error("Error al registrar interacción del abogado:", err);
        if (interested) {
          setMatchedCase(null);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [deck, isProcessing]
  );

  const handleOpenAiBrief = async (c: LawyerCaseItem) => {
    setSelectedCaseForBrief(c);
    setLoadingBrief(true);
    try {
      const res = await getLawyerCaseAIBriefAction(c.id);
      if (!res.success && res.isLocked) {
        setIsBriefLocked(true);
        setAiBrief(null);
        setShowBriefModal(true);
      } else if (res.success && res.brief) {
        setIsBriefLocked(false);
        setAiBrief(res.brief);
        setShowBriefModal(true);
      }
    } catch (err) {
      console.error("Error cargando brief IA:", err);
    } finally {
      setLoadingBrief(false);
    }
  };

  const resetFilters = () => {
    setSelectedUrgency("all");
    setSelectedCity("all");
  };

  if (initialCases.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xs space-y-4 my-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
          <Briefcase className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#0F172A] font-serif">
            Aún no tienes consultas o casos asignados a tu despacho
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            Tu perfil profesional colegiado está activo y protegido. En cuanto un cliente solicite una consulta directa o confirme interés en tus especialidades jurídicas, el caso aparecerá en esta consola confidencial.
          </p>
        </div>
      </div>
    );
  }

  const visibleCards = deck.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Header Row: Navigation & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] font-serif">
            Casos Jurídicos Compatibles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fichas ejecutivas procesales protegidas por la Ley N.° 29733. Desliza para postular tu interés.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div
          className="flex items-center rounded-2xl border border-[#E6EAF0] bg-white p-1 shadow-xs self-start sm:self-auto"
          role="tablist"
          aria-label="Modo de visualización de casos"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "swipe"}
            onClick={() => setViewMode("swipe")}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
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
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-[#101828] text-white shadow-xs"
                : "text-[#667085] hover:text-[#101828]"
            }`}
          >
            <List className="w-3.5 h-3.5 text-blue-400" />
            <span>Lista / Cuadrícula ({filteredCases.length})</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Ribbon (Etapas Procesales & Sede) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[#E6EAF0] bg-white px-3.5 py-2 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-[11px] font-bold text-[#101828] flex items-center gap-1 font-mono uppercase shrink-0">
            <SlidersHorizontal className="w-3 h-3 text-[#3157D5]" />
            Filtros procesales:
          </span>

          {/* Urgencia / Etapa Procesal */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="rounded-lg border border-[#E6EAF0] bg-[#F7F8FC] px-2.5 py-1 text-xs font-semibold text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none cursor-pointer"
          >
            <option value="all">Todas las etapas procesales</option>
            <option value="immediate">🚨 Flagrancia (Atención Inmediata)</option>
            <option value="high">🔍 Investigación Preliminar</option>
            <option value="medium">⚖️ Etapa Intermedia / Acusación</option>
            <option value="low">🏛️ Juicio Oral / General</option>
          </select>

          {/* City / Sede Judicial */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="rounded-lg border border-[#E6EAF0] bg-[#F7F8FC] px-2.5 py-1 text-xs font-semibold text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none cursor-pointer"
          >
            <option value="all">Todas las sedes judiciales</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {(selectedUrgency !== "all" || selectedCity !== "all") && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-[#3157D5] hover:underline font-semibold cursor-pointer ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#667085] ml-auto shrink-0">
          <span className="font-mono text-[11px]">
            <strong className="text-[#101828]">{filteredCases.length}</strong> consultas disponibles
          </span>
        </div>
      </div>

      {/* Main Viewport */}
      {filteredCases.length > 0 ? (
        viewMode === "swipe" ? (
          deck.length > 0 ? (
            <div className="flex flex-col items-center pt-1 pb-4">
              {/* Progress & Shortcuts Helper */}
              <div className="flex items-center justify-between w-full max-w-md px-2 pb-2 text-xs text-[#667085]">
                <span className="font-mono font-semibold">
                  Consulta {filteredCases.length - deck.length + 1} de {filteredCases.length}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[#667085]">
                  Atajos: <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[10px]">←</kbd> Descartar{" "}
                  <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[10px]">→</kbd> Postular
                </span>
              </div>

              {/* Card Deck Viewport */}
              <div className="relative mx-auto h-[545px] sm:h-[555px] w-full max-w-md">
                {visibleCards
                  .map((entry, index) => {
                    const isFront = index === 0;
                    const translateY = index * 10;
                    const scale = 1 - index * 0.035;
                    const zIndex = 10 - index;

                    return (
                      <div
                        key={entry.caseItem.id}
                        style={{
                          transform: `translateY(${translateY}px) scale(${scale})`,
                          zIndex,
                        }}
                        className="absolute inset-0 transition-transform duration-300"
                      >
                        <CaseSwipeCard
                          caseItem={entry.caseItem}
                          matchInfo={entry.matchInfo}
                          isFront={isFront}
                          onSwipe={handleSwipe}
                          onOpenAiBrief={() => handleOpenAiBrief(entry.caseItem)}
                          isRadarVip={entry.isRadarVip}
                        />
                      </div>
                    );
                  })
                  .reverse()}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-md rounded-3xl border border-[#E6EAF0] bg-white p-8 text-center shadow-xs my-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9] text-[#198754] mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#101828] font-serif">
                ¡Has revisado todas las consultas afines!
              </h3>
              <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                Te notificaremos de inmediato cuando un justiciable publique un nuevo problema legal afín a tu especialidad penal.
              </p>
              <button
                type="button"
                onClick={() => setDeck(filteredCases)}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-5 py-2.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Volver a explorar tarjetas</span>
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCases.map((item) => (
              <CompatibleCaseCard
                key={item.caseItem.id}
                caseItem={item.caseItem}
                matchInfo={item.matchInfo}
                isRadarVip={item.isRadarVip}
                onMatched={(convId) => {
                  setMatchedCase({
                    lawyerName: "Justiciable Interesado",
                    lawyerBar: "Identidad Desbloqueada con Éxito",
                    title: item.caseItem.title,
                    conversationId: convId,
                    caseId: item.caseItem.id,
                  });
                }}
              />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-base font-bold text-[#0F172A] font-serif">
            No se encontraron consultas con estos filtros procesales
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Prueba seleccionando &ldquo;Todas las etapas procesales&rdquo; o &ldquo;Todas las sedes judiciales&rdquo;.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-4 py-2 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer filtros</span>
          </button>
        </div>
      )}

      {/* Modal de Conexión Bilateral (Match Confirmado) */}
      {matchedCase && (
        <MatchModal
          isOpen={true}
          onClose={() => setMatchedCase(null)}
          lawyerName="Justiciable Interesado"
          lawyerBar="Identidad Desbloqueada con Éxito"
          lawyerTitle={matchedCase.title}
          conversationId={matchedCase.conversationId}
          caseId={matchedCase.caseId}
          closeButtonText="Continuar revisando casos compatibles"
        />
      )}

      {/* Modal de Cuota Excedida / Upgrade */}
      {showUpgradeModal && quotaData && (
        <SubscriptionUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentUsage={quotaData.currentUsage}
          maxQuota={quotaData.maxQuota}
        />
      )}

      {/* Modal de Asistente Legal IA Brief */}
      {showBriefModal && selectedCaseForBrief && (
        <LawyerAIBriefModal
          isOpen={showBriefModal}
          onClose={() => setShowBriefModal(false)}
          brief={aiBrief}
          isLocked={isBriefLocked}
        />
      )}
    </div>
  );
}
