"use client";

import { CheckCircle2, MapPin, Briefcase, Clock, Video, Sparkles } from "lucide-react";

interface ExplicabilityChipsProps {
  breakdown: Record<string, any>;
  specialtyName?: string;
  subspecialtyName?: string;
  city?: string;
  yearsExperience?: number;
}

export default function ExplicabilityChips({
  breakdown,
  specialtyName,
  subspecialtyName,
  city,
  yearsExperience,
}: ExplicabilityChipsProps) {
  const chips: { label: string; icon: any; highlight?: boolean }[] = [];

  if (breakdown.specialty_match && specialtyName) {
    chips.push({
      label: `Especialista en ${specialtyName}`,
      icon: Briefcase,
      highlight: true,
    });
  }

  if (breakdown.subspecialty_match && subspecialtyName) {
    chips.push({
      label: `Experto en ${subspecialtyName}`,
      icon: Sparkles,
      highlight: true,
    });
  }

  if (breakdown.same_city && city) {
    chips.push({
      label: `Despacho en ${city}`,
      icon: MapPin,
    });
  }

  if (breakdown.modality_compatible) {
    chips.push({
      label: "Modalidad compatible",
      icon: Video,
    });
  }

  if (yearsExperience && yearsExperience > 0) {
    chips.push({
      label: `${yearsExperience} años de trayectoria`,
      icon: CheckCircle2,
    });
  }

  if (breakdown.is_available) {
    chips.push({
      label: "Disponibilidad inmediata",
      icon: Clock,
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip, idx) => {
        const Icon = chip.icon;
        return (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
              chip.highlight
                ? "border border-blue-200 bg-blue-50 text-[#2563EB] font-semibold"
                : "border border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <Icon className="w-3 h-3 shrink-0" />
            {chip.label}
          </span>
        );
      })}
    </div>
  );
}
