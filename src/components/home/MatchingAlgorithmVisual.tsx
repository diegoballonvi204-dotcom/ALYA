"use client";

import { useState } from "react";
import {
  Scale,
  Award,
  MapPin,
  Calendar,
  CheckCircle2,
  Sparkles,
  Sliders,
} from "lucide-react";

export function MatchingAlgorithmVisual() {
  const [selectedFactor, setSelectedFactor] = useState<number>(0);

  const factors = [
    {
      id: 0,
      title: "Materia & Especialidad",
      weight: "35%",
      icon: Scale,
      detail: "Taxonomía jurídica peruana de 32 áreas para asegurar correspondencia doctrinal y procesal exacta.",
    },
    {
      id: 1,
      title: "Años de Experiencia",
      weight: "25%",
      icon: Award,
      detail: "Trayectoria verificada en litigios similares, postgrados y colegiatura activa.",
    },
    {
      id: 2,
      title: "Distrito Judicial",
      weight: "15%",
      icon: MapPin,
      detail: "Corte Superior de Justicia o jurisdicción competente (Lima, Callao, Arequipa, etc.).",
    },
    {
      id: 3,
      title: "Disponibilidad Inmediata",
      weight: "15%",
      icon: Calendar,
      detail: "Horarios abiertos en agenda digital para consultas presenciales o virtuales en menos de 24 horas.",
    },
    {
      id: 4,
      title: "Reputación Multidimensional",
      weight: "10%",
      icon: CheckCircle2,
      detail: "Evaluación objetiva post-consulta: comunicación, puntualidad, claridad y trato profesional.",
    },
  ];

  return (
    <div className="rounded-3xl luxury-glass p-6 sm:p-10 border border-slate-200/90 shadow-xl relative overflow-hidden">
      {/* Background ambient halo */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left: Interactive Variables List */}
        <div className="lg:col-span-6 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-3.5 py-1 text-[11px] font-bold text-blue-400 mb-1 font-mono">
            <Sliders className="w-3 h-3 text-blue-400" />
            <span>Motor Algorítmico Ponderado</span>
          </div>

          <h3 className="text-xl sm:text-3xl font-bold text-[#0F172A] tracking-tight font-serif">
            Así calcula ALYA tu compatibilidad
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            A diferencia de los directorios tradicionales basados en publicidad pagada, nuestro motor pondera variables objetivas para que encuentres al especialista idóneo.
          </p>

          <div className="space-y-2 pt-2">
            {factors.map((factor) => {
              const Icon = factor.icon;
              const isActive = selectedFactor === factor.id;
              return (
                <button
                  key={factor.id}
                  onClick={() => setSelectedFactor(factor.id)}
                  type="button"
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all border ${
                    isActive
                      ? "bg-white border-[#2563EB] shadow-md shadow-blue-500/10 -translate-y-0.5"
                      : "bg-white/60 border-slate-200/70 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                        isActive
                          ? "bg-[#0F172A] text-blue-400"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] font-sans">{factor.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{factor.detail}</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {factor.weight}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Live Interactive Simulation Preview */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-slate-200 shadow-lg relative">
            {/* Top Badge */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Simulación de Compatibilidad
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Auditoría Activa
              </span>
            </div>

            {/* Selected Factor Focus */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A] font-mono">
                  Variable: {factors[selectedFactor].title}
                </span>
                <span className="font-mono text-xs font-bold text-blue-600">
                  Ponderación: {factors[selectedFactor].weight}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-sans">
                {factors[selectedFactor].detail}
              </p>
            </div>

            {/* Connecting Visual Energy Line */}
            <div className="py-4 flex items-center justify-center">
              <div className="h-0.5 w-full bg-gradient-to-r from-[#0F172A] via-blue-500 to-[#1E293B] rounded-full relative">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow">
                  ⚡
                </div>
              </div>
            </div>

            {/* Resulting Match Score Card */}
            <div className="p-5 rounded-2xl bg-[#0F172A] text-white shadow-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-semibold text-blue-400 uppercase tracking-wider">
                    Resultado del Algoritmo
                  </p>
                  <p className="text-base font-bold text-white mt-0.5 font-serif">
                    Match de Alta Afinidad
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-2xl font-extrabold text-blue-400">
                    96.8%
                  </span>
                  <span className="block text-[9px] text-slate-400 font-mono">Puntaje Global</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Bilateral y Explicable
                </span>
                <span className="text-blue-400 font-semibold text-[11px] font-mono">
                  Sin sesgos comerciales
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
