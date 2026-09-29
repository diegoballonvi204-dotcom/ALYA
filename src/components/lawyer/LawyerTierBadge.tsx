import { ShieldCheck, Zap, Crown } from "lucide-react";
import { SubscriptionTier } from "@/lib/types/subscription.types";

interface LawyerTierBadgeProps {
  tier?: SubscriptionTier | string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function LawyerTierBadge({
  tier = "starter",
  size = "md",
  showLabel = true,
}: LawyerTierBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  if (tier === "elite") {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-linear-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 border border-amber-400/50 text-amber-900 shadow-xs ${sizeClasses[size]}`}
      >
        <Crown className={`${iconSizes[size]} text-amber-600 fill-amber-500`} />
        {showLabel && <span>Estudio Élite 👑</span>}
      </span>
    );
  }

  if (tier === "pro") {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-linear-to-r from-blue-600/10 via-blue-600/15 to-indigo-600/10 border border-blue-500/40 text-blue-900 shadow-xs ${sizeClasses[size]}`}
      >
        <Zap className={`${iconSizes[size]} text-blue-600 fill-blue-600`} />
        {showLabel && <span>Verificado PRO ⚡</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-slate-100 border border-slate-200 text-slate-700 ${sizeClasses[size]}`}
    >
      <ShieldCheck className={`${iconSizes[size]} text-slate-600`} />
      {showLabel && <span>Colegiado Verificado</span>}
    </span>
  );
}
