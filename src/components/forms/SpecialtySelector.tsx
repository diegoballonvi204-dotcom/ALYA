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
  // Filtrar áreas principales (parent_id === null)
  const mainAreas = specialties.filter((s) => s.parent_id === null);

  const toggleSpecialty = (id: number) => {
    const exists = selected.some((s) => s.specialtyId === id);
    if (exists) {
      const filtered = selected.filter((s) => s.specialtyId !== id);
      // Si eliminamos la primaria y quedan otras, poner la primera como primaria
      if (selected.find((s) => s.specialtyId === id)?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      onChange(filtered);
    } else {
      onChange([
        ...selected,
        {
          specialtyId: id,
          experienceYears: 1,
          isPrimary: selected.length === 0, // Primera seleccionada es primaria por defecto
        },
      ]);
    }
  };

  const setPrimary = (id: number) => {
    const updated = selected.map((s) => ({
      ...s,
      isPrimary: s.specialtyId === id,
    }));
    onChange(updated);
  };

  const setYears = (id: number, years: number) => {
    const updated = selected.map((s) =>
      s.specialtyId === id ? { ...s, experienceYears: Math.max(0, years) } : s
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">
          Ramas del Derecho en las que ejerces{" "}
          <span className="text-[#2563EB]">*</span>
        </label>
        <span className="text-xs text-slate-500 font-mono">
          {selected.length} seleccionada(s)
        </span>
      </div>

      {/* Grid de ramas principales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50/70">
        {mainAreas.map((spec) => {
          const isSelected = selected.some((s) => s.specialtyId === spec.id);
          return (
            <button
              type="button"
              key={spec.id}
              onClick={() => toggleSpecialty(spec.id)}
              className={`flex items-center justify-between gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all text-left ${
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

      {/* Configuración de especialidades seleccionadas */}
      {selected.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <p className="text-xs text-slate-500">
            Define tus años de experiencia y marca con la estrella{" "}
            <Star className="inline w-3 h-3 text-[#2563EB] fill-[#2563EB]" /> tu
            especialidad principal:
          </p>

          <div className="space-y-2">
            {selected.map((item) => {
              const spec = specialties.find((s) => s.id === item.specialtyId);
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
                      className={`p-1 rounded transition-colors ${
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
                      {spec?.name}
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
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
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
