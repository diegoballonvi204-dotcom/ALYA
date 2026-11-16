"use client";

import { useState } from "react";
import { Check, Star, Plus, X } from "lucide-react";

export interface SpecialtyItem {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

interface SpecialtySelectorProps {
  specialties: SpecialtyItem[];
  selected: { specialtyId: number; experienceYears: number; isPrimary: boolean }[];
  onChange: (selected: { specialtyId: number; experienceYears: number; isPrimary: boolean }[]) => void;
}

export function SpecialtySelector({ specialties, selected, onChange }: SpecialtySelectorProps) {
  // Separar estrictamente ramas principales y subespecialidades (H33)
  const mainAreas = specialties.filter((s) => s.parent_id === null || s.parent_id === undefined);
  const subAreas = specialties.filter((s) => s.parent_id !== null && s.parent_id !== undefined);

  // Mantener únicamente selecciones existentes en el catálogo para que contador y fichas coincidan 100%
  const validSelected = selected.filter((item) =>
    specialties.some((spec) => spec.id === item.specialtyId)
  );

  const selectedMainIds = new Set(
    validSelected
      .filter((item) => mainAreas.some((m) => m.id === item.specialtyId))
      .map((item) => item.specialtyId)
  );

  const visibleSubAreas =
    selectedMainIds.size > 0
      ? subAreas.filter(
          (sub) =>
            (sub.parent_id !== null && selectedMainIds.has(sub.parent_id)) ||
            validSelected.some((v) => v.specialtyId === sub.id)
        )
      : subAreas;

  const toggleSpecialty = (id: number) => {
    const exists = validSelected.some((s) => s.specialtyId === id);
    if (exists) {
      const filtered = validSelected
        .filter((s) => s.specialtyId !== id)
        .map((s) => ({ ...s }));
      if (validSelected.find((s) => s.specialtyId === id)?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      onChange(filtered);
    } else {
      onChange([
        ...validSelected,
        {
          specialtyId: id,
          experienceYears: 1,
          isPrimary: validSelected.length === 0,
        },
      ]);
    }
  };

  const setPrimary = (id: number) => {
    const updated = validSelected.map((s) => ({
      ...s,
      isPrimary: s.specialtyId === id,
    }));
    onChange(updated);
  };

  const setYears = (id: number, years: number) => {
    const updated = validSelected.map((s) =>
      s.specialtyId === id ? { ...s, experienceYears: Math.max(0, years) } : s
    );
    onChange(updated);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          Ramas Principales y Subespecialidades{" "}
          <span className="text-[#2563EB]">*</span>
        </span>
        <span className="text-xs text-slate-500 font-mono">
          {validSelected.length} seleccionada(s)
        </span>
      </div>

      {/* Sección 1: Ramas Principales */}
      <div className="space-y-2">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
          1. Ramas Principales del Derecho ({mainAreas.length})
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50/70">
          {mainAreas.map((spec) => {
            const isSelected = validSelected.some((s) => s.specialtyId === spec.id);
            return (
              <button
                type="button"
                key={spec.id}
                aria-pressed={isSelected}
                onClick={() => toggleSpecialty(spec.id)}
                className={`flex items-center justify-between gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all text-left cursor-pointer ${
                  isSelected
                    ? "border-blue-400 bg-blue-50 text-[#2563EB] font-bold shadow-2xs"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{spec.name}</span>
                {isSelected ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
                ) : (
                  <Plus className="h-3 w-3 shrink-0 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sección 2: Subespecialidades Específicas (si existen en catálogo) */}
      {visibleSubAreas.length > 0 && (
        <div className="space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            2. Subespecialidades Procesales ({visibleSubAreas.length})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50/70">
            {visibleSubAreas.map((sub) => {
              const isSelected = validSelected.some((s) => s.specialtyId === sub.id);
              const parentName = mainAreas.find((m) => m.id === sub.parent_id)?.name;
              return (
                <button
                  type="button"
                  key={sub.id}
                  aria-pressed={isSelected}
                  onClick={() => toggleSpecialty(sub.id)}
                  className={`flex items-center justify-between gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all text-left cursor-pointer ${
                    isSelected
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-bold shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block truncate">{sub.name}</span>
                    {parentName && (
                      <span className="block text-[9px] text-slate-400 truncate">
                        {parentName}
                      </span>
                    )}
                  </div>
                  {isSelected ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                  ) : (
                    <Plus className="h-3 w-3 shrink-0 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Configuración de especialidades seleccionadas */}
      {validSelected.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <p className="text-xs text-slate-500">
            Define tus años de experiencia y marca con la estrella{" "}
            <Star className="inline w-3 h-3 text-[#2563EB] fill-[#2563EB]" /> tu
            especialidad principal:
          </p>

          <div className="space-y-2">
            {validSelected.map((item) => {
              const spec = specialties.find((s) => s.id === item.specialtyId);
              const isSub = spec?.parent_id !== null && spec?.parent_id !== undefined;
              return (
                <div
                  key={item.specialtyId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setPrimary(item.specialtyId)}
                      title={item.isPrimary ? "Especialidad principal" : "Marcar como principal"}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        item.isPrimary
                          ? "text-[#2563EB]"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          item.isPrimary ? "fill-[#2563EB]" : ""
                        }`}
                      />
                    </button>
                    <span className="font-semibold text-[#0F172A] truncate">
                      {spec?.name || `Especialidad #${item.specialtyId}`}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      {isSub ? "Subespecialidad" : "Rama principal"}
                    </span>
                    {item.isPrimary && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#2563EB] font-mono">
                        Principal
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Años:</span>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={item.experienceYears}
                        onChange={(e) =>
                          setYears(item.specialtyId, parseInt(e.target.value) || 0)
                        }
                        className="w-14 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center font-mono text-xs text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSpecialty(item.specialtyId)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      title="Quitar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
