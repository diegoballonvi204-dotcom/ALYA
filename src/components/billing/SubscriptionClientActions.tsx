"use client";

import { useState } from "react";
import { QrCode, ArrowRight, Sparkles } from "lucide-react";
import ManualPaymentModal from "./ManualPaymentModal";

interface SubscriptionClientActionsProps {
  planId: string;
  planName: string;
  tier: "starter" | "pro" | "elite";
  isCurrentPlan: boolean;
}

export default function SubscriptionClientActions({
  planId,
  planName,
  tier,
  isCurrentPlan,
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
        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all shadow-sm ${
          tier === "pro"
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "border border-slate-300 bg-slate-50 hover:bg-slate-100 text-[#0F172A]"
        }`}
      >
        <span>Activar {tier === "pro" ? "ALYA Pro" : "Plan Élite"}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      <ManualPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPlanId={planId}
      />
    </>
  );
}
