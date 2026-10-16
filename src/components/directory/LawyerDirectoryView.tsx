"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ShieldCheck,
  MapPin,
  Briefcase,
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { LawyerCard, LawyerCardData } from "./LawyerCard";

interface SpecialtyOption {
  id: number;
  name: string;
  slug: string;
}

interface LawyerDirectoryViewProps {
  initialLawyers: LawyerCardData[];
  specialties: SpecialtyOption[];
}

const CITIES = [
  "Lima",
  "Arequipa",
  "Trujillo",
  "Chiclayo",
  "Piura",
  "Cusco",
  "Huancayo",
  "Tacna",
  "Ica",
];

export function LawyerDirectoryView({
  initialLawyers,
  specialties,
}: LawyerDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedModality, setSelectedModality] = useState<"all" | "virtual" | "physical">("all");
  const [sortBy, setSortBy] = useState<"rating" | "experience" | "price_asc" | "price_desc">("rating");

  // Filtrado y ordenamiento reactivo
  const filteredLawyers = useMemo(() => {
    return initialLawyers
      .filter((lawyer) => {
        // Filtro texto
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const fullName = `${lawyer.firstName} ${lawyer.lastName}`.toLowerCase();
          const bar = `${lawyer.barAssociation || ""} ${lawyer.barNumber}`.toLowerCase();
          const bio = (lawyer.bio || "").toLowerCase();
          const specs = lawyer.specialties.map((s) => s.name?.toLowerCase() || "").join(" ");
          if (!fullName.includes(q) && !bar.includes(q) && !bio.includes(q) && !specs.includes(q)) {
            return false;
          }
        }

        // Filtro especialidad
        if (selectedSpecialty !== null) {
          const hasSpec = lawyer.specialties.some((s) => s.id === selectedSpecialty);
          if (!hasSpec) return false;
        }

        // Filtro ciudad
        if (selectedCity !== "all") {
          if (lawyer.city.toLowerCase() !== selectedCity.toLowerCase()) {
            return false;
          }
        }

        // Filtro modalidad
        if (selectedModality === "virtual" && !lawyer.virtualAttention) return false;
        if (selectedModality === "physical" && !lawyer.physicalAttention) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "experience") {
          return b.yearsExperience - a.yearsExperience;
        }
        if (sortBy === "price_asc") {
          return (a.consultationPrice || 9999) - (b.consultationPrice || 9999);
        }
        if (sortBy === "price_desc") {
          return (b.consultationPrice || 0) - (a.consultationPrice || 0);
        }
        // Por defecto: rating
        return b.ratingAverage - a.ratingAverage || b.totalReviews - a.totalReviews;
      });
  }, [
    initialLawyers,
    searchQuery,
    selectedSpecialty,
    selectedCity,
    selectedModality,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedSpecialty(null);
    setSelectedCity("all");
    setSelectedModality("all");
    setSortBy("rating");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedSpecialty !== null ||
    selectedCity !== "all" ||
    selectedModality !== "all" ||
    sortBy !== "rating";

  return (
    <div className="space-y-8">
      {/* 1. Barra de Búsqueda y Filtros Principales */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Input de Búsqueda General */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, especialidad o matrícula CAL..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selector de Ciudad */}
          <div className="w-full md:w-48 shrink-0">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="all">Todas las Ciudades</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Modalidad */}
          <div className="w-full md:w-44 shrink-0">
            <select
              value={selectedModality}
              onChange={(e) =>
                setSelectedModality(e.target.value as "all" | "virtual" | "physical")
              }
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="all">Toda Modalidad</option>
              <option value="virtual">Videoconsulta</option>
              <option value="physical">Presencial</option>
            </select>
          </div>

          {/* Selector de Ordenamiento */}
          <div className="w-full md:w-48 shrink-0">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "rating" | "experience" | "price_asc" | "price_desc"
                )
              }
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="rating">Mejor Calificados</option>
              <option value="experience">Más Años de Ejercicio</option>
              <option value="price_asc">Menor Tarifa de Consulta</option>
              <option value="price_desc">Mayor Tarifa</option>
            </select>
          </div>
        </div>

        {/* Chips de Especialidades Rápidas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => setSelectedSpecialty(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSpecialty === null
                ? "bg-[#0F172A] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            Todas las Especialidades
          </button>
          {specialties.map((spec) => (
            <button
              key={spec.id}
              onClick={() => setSelectedSpecialty(spec.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSpecialty === spec.id
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {spec.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Barra de Resultados y Reseteo */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Mostrando <strong className="text-slate-900 font-bold">{filteredLawyers.length}</strong> abogados colegiados verificados
        </span>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        )}
      </div>

      {/* 3. Rejilla de Abogados */}
      {filteredLawyers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLawyers.map((lawyer) => (
            <LawyerCard key={lawyer.id} lawyer={lawyer} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            No se encontraron letrados con estos criterios
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Prueba ajustando los filtros de especialidad o ciudad, o ingresa términos de búsqueda más amplios.
          </p>
          <button
            onClick={resetFilters}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ver Todos los Abogados</span>
          </button>
        </div>
      )}
    </div>
  );
}
