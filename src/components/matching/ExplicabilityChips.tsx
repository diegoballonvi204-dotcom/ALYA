import React from "react";
import { CheckCircle2, MapPin, Briefcase, Clock, Video, Sparkles } from "lucide-react";

interface ExplicabilityChipsProps {
  breakdown: Record<string, unknown>;
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
  const chips: { label: string; icon: React.ComponentType<{ className?: string }>; highlight?: boolean }[] = [];

  if (breakdown.specialty_match && specialtyName) {
    chips.push({
      label: `Especialidad en ${specialtyName}`,
      icon: Briefcase,
      highlight: true,
    });
  }

  if (breakdown.subspecialty_match && subspecialtyName) {
    chips.push({
      label: `Subespecialidad: ${subspecialtyName}`,
      icon: Sparkles,
      highlight: true,
    });
  }

  if (breakdown.same_city && city) {
    chips.push({
      label: `Jurisdicción en ${city}`,
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
      label: `${yearsExperience} años acreditados`,
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
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Factores de coincidencia">
      {chips.map((chip, idx) => {
        const Icon = chip.icon;
        return (
          <span
            key={idx}
            role="listitem"
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
              chip.highlight
                ? "border border-[#D1DEFC] bg-[#F0F4FE] text-[#3157D5] font-semibold"
                : "border border-[#E6EAF0] bg-white text-[#202938]"
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0 text-[#3157D5]" />
            <span>{chip.label}</span>
          </span>
        );
      })}
    </div>
  );
}
