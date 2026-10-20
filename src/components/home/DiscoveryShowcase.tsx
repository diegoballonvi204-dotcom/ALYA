"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  X,
  Bookmark,
  ShieldCheck,
  Star,
  Clock,
  Briefcase,
  Sparkles,
  ArrowRight,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export function DiscoveryShowcase() {
  const [activeTab, setActiveTab] = useState<"card" | "compare">("card");
  const [interactionState, setInteractionState] = useState<"idle" | "match">("idle");

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl luxury-glass border border-slate-200/90 shadow-2xl p-6 sm:p-10 relative overflow-hidden">
      {/* Background ambient sapphire bloom */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-6 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#3157D5] font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#4777F5]" />
            Escena 3 • El Descubrimiento
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#101828] font-serif mt-1">
            Descubre y Compara Abogados como debe ser.
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Navega perfiles oficiales colegiados, evalúa su experiencia y conecta bilateralmente sin intermediarios.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 p-1 rounded-xl" role="tablist" aria-label="Modos de exploración de abogados">
          <button
            id="tab-card"
            role="tab"
            aria-selected={activeTab === "card"}
            aria-controls="tabpanel-card"
            type="button"
            onClick={() => setActiveTab("card")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "card"
                ? "bg-white text-[#101828] shadow-xs"
                : "text-slate-600 hover:text-[#101828]"
            }`}
          >
            Tarjeta Interactiva
          </button>
          <button
            id="tab-compare"
            role="tab"
            aria-selected={activeTab === "compare"}
            aria-controls="tabpanel-compare"
            type="button"
            onClick={() => setActiveTab("compare")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "compare"
                ? "bg-white text-[#101828] shadow-xs"
                : "text-slate-600 hover:text-[#101828]"
            }`}
          >
            Criterios de Match
          </button>
        </div>
      </div>

      {/* Interactive Demonstration Area */}
      {activeTab === "card" ? (
        <div id="tabpanel-card" role="tabpanel" aria-labelledby="tab-card" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-200">
          {/* Left: The Mock Swipe Card Preview */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-sm rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden p-5">
              {/* Stamp Simulation */}
              {interactionState === "match" && (
                <div className="absolute inset-0 z-30 bg-[#101828]/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="h-14 w-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-lg">
                    <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <p className="text-lg font-bold font-serif text-white">¡Match Solicitado!</p>
                  <p className="text-xs text-slate-200 text-center mt-1">
                    Tu consulta ha sido vinculada con la Dra. Elena Ramos.
                  </p>
                  <button
                    type="button"
                    onClick={() => setInteractionState("idle")}
                    className="mt-4 px-4 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Restablecer simulación
                  </button>
                </div>
              )}

              {/* Card Top: Affinity Pill & Status */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#101828] px-3 py-1 text-[11px] font-bold text-white font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                  98.2% Afinidad
                </span>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  CAL Activo
                </span>
              </div>

              {/* Profile Brief */}
              <div className="mt-4 flex items-center gap-3.5">
                <div className="h-14 w-14 rounded-2xl bg-[#101828] text-white flex items-center justify-center font-bold text-lg font-serif shrink-0 shadow-md">
                  ER
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#101828] font-serif">
                    Dra. Elena Ramos Morales
                  </h4>
                  <p className="text-xs font-semibold text-[#3157D5] font-mono">
                    CAL N.° 48921 • Lima
                  </p>
                </div>
              </div>

              {/* Speciality Badge */}
              <div className="mt-3 inline-block bg-blue-50 border border-blue-200 text-[#3157D5] text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                Derecho Laboral • Despidos y Tutela
              </div>

              {/* Metrics */}
              <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center text-xs">
                <div>
                  <span className="block font-bold text-[#101828] font-mono">4.96 ★</span>
                  <span className="text-[10px] text-slate-500">142 casos</span>
                </div>
                <div className="border-x border-slate-200">
                  <span className="block font-bold text-[#101828] font-mono">&lt; 15m</span>
                  <span className="text-[10px] text-slate-500">Respuesta</span>
                </div>
                <div>
                  <span className="block font-bold text-[#101828] font-mono">12 Años</span>
                  <span className="text-[10px] text-slate-500">Litigación</span>
                </div>
              </div>

              {/* Mock Action Buttons (Pass, Match) */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setInteractionState("idle")}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                  <span>Pasar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInteractionState("match")}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#101828] hover:bg-[#1E293B] text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                  <span>Me interesa</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: How Discovery Works in ALYA */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-[#101828] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#3157D5]" />
                Filtros Dinámicos en Tiempo Real
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Filtra instantáneamente por especialidad (Laboral, Penal, Civil, Familia), ciudad o modalidad (virtual/presencial) para ver únicamente a los abogados competentes para tu caso.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-[#101828] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Opción «Detallar mi consulta»
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Agrega detalles confidenciales de tu situación. Cuando das *"Me interesa"*, la información se comparte de forma segura y bilateral para que el profesional te responda de inmediato.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#3157D5] hover:text-[#2547BD] transition-colors font-mono"
              >
                <span>Explorar el nuevo mazo de abogados en vivo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Tab: Criterios de Match - Vista Comparativa Auditada */
        <div id="tabpanel-compare" role="tabpanel" aria-labelledby="tab-compare" className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-7 border border-slate-800">
            <h4 className="text-base sm:text-lg font-bold font-serif mb-2 flex items-center gap-2 text-white">
              <Sliders className="w-5 h-5 text-blue-400" />
              Ponderación Objetiva vs. Directorios Comerciales
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl font-sans">
              En los directorios tradicionales, el primer abogado que ves es quien pagó más dinero por el anuncio. En ALYA, el algoritmo evalúa rigurosamente 5 dimensiones procesales sin distorsión comercial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-bold font-mono">
                <span className="flex h-5 w-5 rounded-full bg-rose-50 text-rose-600 items-center justify-center">✕</span>
                Directorios Tradicionales
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Posición pagada:</strong> El orden depende del plan publicitario contratado.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Sin auditoría CAL:</strong> Carné o colegiatura no se audita en cada consulta.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span><strong>Spam y venta de datos:</strong> Tu número de teléfono se entrega a múltiples contactos sin tu permiso.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-blue-50/70 p-5 border border-blue-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#3157D5] text-xs font-bold font-mono">
                <span className="flex h-5 w-5 rounded-full bg-blue-100 text-[#3157D5] items-center justify-center">✓</span>
                Estándar Algorítmico ALYA
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Afinidad pura:</strong> Coincidencia por hechos, especialidad procesal y jurisprudencia.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Cotejo oficial CAL/CAA:</strong> Verificación de habilitación activa con número de registro visible.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Bóveda cifrada AES-256:</strong> Datos resguardados bajo la Ley N.° 29733 de Protección de Datos Personales.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/abogados"
              className="inline-flex items-center gap-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] text-white px-6 py-3 text-xs font-bold transition-all shadow-md"
            >
              <span>Consultar directorio auditado completo</span>
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
