"use client";

import { useState } from "react";
import { ArrowRight, CreditCard, QrCode } from "lucide-react";
import ManualPaymentModal from "./ManualPaymentModal";

interface SubscriptionClientActionsProps {
  planId: string;
  planName: string;
  tier: "starter" | "pro" | "elite";
  isCurrentPlan: boolean;
  initialTab?: "card" | "transfer";
  buttonLabel?: string;
}

export default function SubscriptionClientActions({
  planId,
  planName,
  tier,
  isCurrentPlan,
  initialTab = "card",
  buttonLabel,
}: SubscriptionClientActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isCurrentPlan) {
    return (
      <span className="w-full inline-block text-center rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-500">
        Plan Activo
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all shadow-sm cursor-pointer ${
          initialTab === "transfer"
            ? "border border-purple-300 bg-white hover:bg-purple-50 text-purple-800"
            : tier === "pro"
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "border border-slate-300 bg-slate-900 hover:bg-slate-800 text-white"
        }`}
      >
        {initialTab === "transfer" ? (
          <QrCode className="w-3.5 h-3.5" />
        ) : (
          <CreditCard className="w-3.5 h-3.5" />
        )}
        <span>{buttonLabel || `Activar ${tier === "pro" ? "ALYA Pro" : "Plan Élite"}`}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      <ManualPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPlanId={planId}
        initialTab={initialTab}
      />
    </>
  );
}
