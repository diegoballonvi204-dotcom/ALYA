"use client";

import { useState } from "react";
import {
  Scale,
  FileCheck2,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { SignFeeAgreementModal, FeeAgreementData } from "./SignFeeAgreementModal";

interface FeeAgreementCardProps {
  agreement: FeeAgreementData;
  isClient: boolean;
  onRefresh?: () => void;
}

export function FeeAgreementCard({
  agreement,
  isClient,
  onRefresh,
}: FeeAgreementCardProps) {
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const isSigned = agreement.status === "signed";

  return (
    <>
      <div
        className={`rounded-2xl border p-4 transition-all duration-200 shadow-xs ${
          isSigned
            ? "bg-emerald-50/40 border-emerald-200"
            : "bg-blue-50/40 border-blue-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isSigned
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-blue-100 text-[#2563EB]"
              }`}
            >
              {isSigned ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Scale className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 font-serif">
                  {agreement.title}
                </span>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isSigned
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isSigned ? "Firmado Bilateralmente" : "Pendiente de Firma"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                <span>
                  Honorarios: <strong className="text-slate-900 font-bold">S/ {Number(agreement.fixed_fee).toFixed(2)}</strong>
                  {agreement.success_fee_percentage ? ` (+${agreement.success_fee_percentage}% éxito)` : ""}
                </span>
                <span>•</span>
                <span>Art. 1764 C.C.</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 self-end sm:self-auto">
            {isSigned ? (
              <button
                type="button"
                onClick={() => setIsSignModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ver Constancia</span>
              </button>
            ) : isClient ? (
              <button
                type="button"
                onClick={() => setIsSignModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all animate-pulse"
              >
                <span>Revisar y Firmar</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSignModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <span>Ver Propuesta</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <SignFeeAgreementModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        agreement={agreement}
        isClient={isClient}
        onAgreementSigned={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
}
