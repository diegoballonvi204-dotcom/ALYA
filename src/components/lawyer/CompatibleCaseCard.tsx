"use client";

import { useState } from "react";
import { lawyerInteractMatchAction } from "@/actions/cases.actions";
import { getLawyerCaseAIBriefAction, LawyerAIBriefResult } from "@/actions/ai.actions";
import {
  MapPin,
  CheckCircle,
  Heart,
  Lock,
  Sparkles,
  Loader2,
  Zap,
} from "lucide-react";
import Link from "next/link";

import SubscriptionUpgradeModal from "./SubscriptionUpgradeModal";
import LawyerAIBriefModal from "./LawyerAIBriefModal";

interface CompatibleCaseCardProps {
  caseItem: {
    id: string;
    title: string;
    description: string;
    city: string;
    modality: string;
    urgency: string;
    is_confidential: boolean;
    created_at?: string;
    specialties?: {
      name: string;
    } | null;
  };
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

export default function CompatibleCaseCard({
  caseItem,
  matchInfo,
  isRadarVip = false,
}: CompatibleCaseCardProps) {
  const [lawyerInterested, setLawyerInterested] = useState(
    matchInfo?.lawyer_interest || false
  );
  const [isMatched, setIsMatched] = useState(matchInfo?.status === "matched");
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [quotaData, setQuotaData] = useState<{ currentUsage: number; maxQuota: number } | null>(null);

  // Estados del Asistente Legal IA
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [aiBrief, setAiBrief] = useState<LawyerAIBriefResult | null>(null);
  const [isBriefLocked, setIsBriefLocked] = useState(false);

  const handleInterest = async () => {
    if (!matchInfo?.id) return;
    setLoading(true);

    try {
      const res = await lawyerInteractMatchAction(matchInfo.id, true);
      if (res?.error === "QUOTA_EXCEEDED") {
        setQuotaData({
          currentUsage: (res.quotaInfo as any)?.current_usage || 3,
          maxQuota: (res.quotaInfo as any)?.max_quota || 3,
        });
        setShowUpgradeModal(true);
      } else if (res?.success) {
        setLawyerInterested(true);
        if (res.isMatched) {
          setIsMatched(true);
        }
      }
    } catch (err) {
      console.error("Error setting lawyer interest:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAiBrief = async () => {
    setLoadingBrief(true);
    try {
      const res = await getLawyerCaseAIBriefAction(caseItem.id);
      if (!res.success && res.isLocked) {
        setIsBriefLocked(true);
        setAiBrief(null);
        setShowBriefModal(true);
      } else if (res.success && res.brief) {
        setIsBriefLocked(false);
        setAiBrief(res.brief);
        setShowBriefModal(true);
      } else {
        // Fallback bloqueado o error
        setIsBriefLocked(true);
        setAiBrief(null);
        setShowBriefModal(true);
      }
    } catch (err) {
      console.error("Error al obtener briefing IA:", err);
      setIsBriefLocked(true);
      setShowBriefModal(true);
    } finally {
      setLoadingBrief(false);
    }
  };

  return (
    <div className={`flex flex-col justify-between rounded-2xl border ${isRadarVip ? "border-amber-300 ring-2 ring-amber-100 bg-linear-to-b from-amber-50/20 to-white" : "border-slate-200 bg-white"} p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden`}>
      {isRadarVip && (
        <div className="absolute top-0 right-0 bg-linear-to-l from-amber-500 to-amber-600 text-white text-[9px] font-extrabold px-3 py-0.5 rounded-bl-xl tracking-wider uppercase flex items-center gap-1 shadow-2xs">
          <Zap className="w-2.5 h-2.5 fill-current text-amber-200" />
          Radar VIP Élite
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-bold text-blue-700">
            {caseItem.specialties?.name || "Materia Jurídica"}
          </span>
          <div className="flex items-center gap-1.5">
            {isRadarVip && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                15m Exclusivo
              </span>
            )}
            {caseItem.is_confidential && !isMatched && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono">
                <Lock className="w-2.5 h-2.5 text-slate-500" />
                Confidencial
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-600 font-bold uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              Urgencia {caseItem.urgency}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-[#0F172A] text-base font-serif">{caseItem.title}</h3>
        <p className="text-xs text-slate-600 line-clamp-3 mt-1.5 leading-relaxed">
          {caseItem.description}
        </p>

        {caseItem.is_confidential && !isMatched && (
          <p className="text-[11px] text-slate-500 italic mt-2">
            Identidad protegida por Ley N.° 29733. Se revelará al formalizar el match bilateral.
          </p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{caseItem.city}</span>
          <span>•</span>
          <span className="capitalize">{caseItem.modality}</span>
          {matchInfo?.score && (
            <>
              <span>•</span>
              <span className="font-mono text-blue-600 font-bold">
                {Math.round(matchInfo.score)}% compatibilidad
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Botón Asistente IA */}
          <button
            type="button"
            onClick={handleOpenAiBrief}
            disabled={loadingBrief}
            title="Analizar expediente con el Asistente Legal IA"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 px-3 py-2 text-xs font-bold text-indigo-700 transition-colors shadow-2xs"
          >
            {loadingBrief ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>Analizar IA</span>
          </button>

          {isMatched ? (
            <Link
              href={matchInfo?.conversation_id ? `/chat/${matchInfo.conversation_id}` : "/lawyer/dashboard"}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              ¡Match Bilateral!
            </Link>
          ) : lawyerInterested ? (
            <span className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700">
              Interés Registrado
            </span>
          ) : (
            <button
              type="button"
              disabled={loading || !matchInfo?.id}
              onClick={handleInterest}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-4 py-2 text-xs font-bold text-white transition-all shadow-sm disabled:opacity-50"
            >
              <Heart className="w-3.5 h-3.5 fill-current text-blue-400" />
              {loading ? "Registrando..." : "Me Interesa"}
            </button>
          )}
        </div>
      </div>

      {/* Modal de Asistente Legal IA */}
      <LawyerAIBriefModal
        isOpen={showBriefModal}
        onClose={() => setShowBriefModal(false)}
        brief={aiBrief}
        isLocked={isBriefLocked}
      />

      {/* Modal de Upgrade cuando la cuota mensual se agota */}
      <SubscriptionUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="QUOTA_EXCEEDED"
        currentUsage={quotaData?.currentUsage ?? 3}
        maxQuota={quotaData?.maxQuota ?? 3}
      />
    </div>
  );
}

