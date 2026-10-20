"use client";

import { useState, useMemo, useCallback } from "react";
import SwipeDeck from "./SwipeDeck";
import LawyerListView from "./LawyerListView";
import CaseDetailModal, { type CaseDraft } from "./CaseDetailModal";
import type { MatchRecord } from "./SwipeCard";
import {
  directMatchWithLawyerAction,
  toggleFavoriteAction,
  updateCaseStatusAction,
  type CaseStatus,
} from "@/actions/cases.actions";
import {
  Layers,
  List,
  SlidersHorizontal,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Check,
  Briefcase,
  AlertCircle,
  Scale,
  MapPin,
  Building,
  Pencil,
  ShieldCheck,
  Lock,
  Heart,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Star,
  ExternalLink,
  PlayCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface SpecialtyItem {
  id: number;
  name: string;
  slug?: string;
}

export interface UserCaseItem {
  id: string;
  title: string;
  description: string;
  status: string;
  city: string;
  specialty_id?: number | null;
  specialties?: { name: string } | null;
  urgency?: "low" | "medium" | "high" | "immediate";
  modality?: "virtual" | "in_person" | "hybrid";
  created_at?: string;
}

interface DirectInquiryContainerProps {
  initialLawyers: MatchRecord[];
  specialties: SpecialtyItem[];
  userCity?: string;
  initialFavorites?: string[];
  userCases?: UserCaseItem[];
  backHref?: string;
  backLabel?: string;
}

export default function DirectInquiryContainer({
  initialLawyers,
  specialties,
  userCity = "Lima",
  initialFavorites = [],
  userCases = [],
  backHref = "",
  backLabel = "",
}: DirectInquiryContainerProps) {
  // Mode toggle: 'swipe' | 'list' | 'saved' | 'cases'
  const [viewMode, setViewMode] = useState<"swipe" | "list" | "saved" | "cases">("swipe");

  // Local synchronized cases list
  const [localCases, setLocalCases] = useState<UserCaseItem[]>(userCases);
  const [updatingCaseId, setUpdatingCaseId] = useState<string | null>(null);

  // Selected case state for clients with multiple cases
  const initialCase = localCases[0] || null;
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCase ? initialCase.id : "new");

  // Active selected case helper
  const activeCaseItem = localCases.find((c) => c.id === selectedCaseId) || null;

  // Status badge config helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
      case "in_consultation":
        return {
          label: "En Proceso",
          bg: "bg-blue-50 border-blue-200/80 text-blue-700",
          dot: "bg-blue-600",
        };
      case "closed":
        return {
          label: "Concluido / Resuelto",
          bg: "bg-purple-50 border-purple-200/80 text-purple-700",
          dot: "bg-purple-600",
        };
      case "cancelled":
        return {
          label: "Cancelado",
          bg: "bg-slate-100 border-slate-300 text-slate-600",
          dot: "bg-slate-400",
        };
      case "published":
      case "matching":
      default:
        return {
          label: "Activo / En búsqueda",
          bg: "bg-emerald-50 border-emerald-200/80 text-emerald-800",
          dot: "bg-emerald-600 animate-pulse",
        };
    }
  };

  const handleUpdateStatus = async (caseId: string, newStatus: CaseStatus) => {
    setUpdatingCaseId(caseId);
    try {
      const res = await updateCaseStatusAction({ caseId, status: newStatus });
      if (res.success) {
        setLocalCases((prev) =>
          prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
        );
      } else {
        alert(res.error || "No se pudo actualizar el estado");
      }
    } catch (err: any) {
      alert(err.message || "Error al actualizar estado");
    } finally {
      setUpdatingCaseId(null);
    }
  };

  // Primary filters
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedModality, setSelectedModality] = useState<"all" | "virtual" | "physical">("all");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number | "all">("all");

  // Mobile contextual case bar accordion toggle
  const [isMobileCaseBarOpen, setIsMobileCaseBarOpen] = useState(false);

  // Case draft state (information for the lawyer)
  const [caseDraft, setCaseDraft] = useState<CaseDraft>({
    title: initialCase?.title || "Consulta Legal Directa",
    description: initialCase?.description || "",
    specialtyId: initialCase?.specialty_id || specialties[0]?.id || 1,
    specialtyName: initialCase?.specialties?.name || specialties[0]?.name || "Derecho Laboral",
    urgency: initialCase?.urgency || "medium",
    city: initialCase?.city || userCity,
    modality: (initialCase?.modality as any) || "virtual",
    isConfidential: true,
  });

  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [pendingMatchLawyer, setPendingMatchLawyer] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Favorites state
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(
    new Set(initialFavorites)
  );

  // List of currently favorited lawyers
  const favoriteLawyers = useMemo(() => {
    return initialLawyers.filter((l) => favoritesSet.has(l.lawyer_profiles.id));
  }, [initialLawyers, favoritesSet]);

  // Success match toast feedback
  const [matchSuccessBanner, setMatchSuccessBanner] = useState<{
    text: string;
    conversationId?: string | null;
  } | null>(null);

  // Unique cities list
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    initialLawyers.forEach((l) => {
      const c = l.lawyer_profiles.profiles.city;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [initialLawyers]);

  // Real-time filtering of lawyers
  const filteredLawyers = useMemo(() => {
    let result = [...initialLawyers];

    // Specialty filter
    if (selectedSpecialty !== "all") {
      result = result.filter((m) =>
        m.lawyer_profiles.lawyer_specialties?.some(
          (s) => s.specialties?.name.toLowerCase() === selectedSpecialty.toLowerCase()
        )
      );
    }

    // City filter
    if (selectedCity !== "all") {
      result = result.filter(
        (m) =>
          m.lawyer_profiles.profiles.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // Modality filter
    if (selectedModality === "virtual") {
      result = result.filter((m) => m.lawyer_profiles.virtual_attention);
    } else if (selectedModality === "physical") {
      result = result.filter((m) => m.lawyer_profiles.physical_attention);
    }

    // Urgency filter (etapas procesales)
    if (selectedUrgency !== "all") {
      if (selectedUrgency === "immediate") {
        result = result.filter((m) => m.breakdown?.is_available || m.score >= 96);
      } else if (selectedUrgency === "high") {
        result = result.filter((m) => m.lawyer_profiles.years_experience >= 10);
      } else if (selectedUrgency === "medium") {
        result = result.filter((m) => m.lawyer_profiles.years_experience >= 5);
      }
    }

    // Minimum experience filter
    if (minExperience > 0) {
      result = result.filter((m) => m.lawyer_profiles.years_experience >= minExperience);
    }

    // Maximum consultation price filter
    if (maxPrice !== "all") {
      result = result.filter(
        (m) =>
          m.lawyer_profiles.consultation_price &&
          m.lawyer_profiles.consultation_price <= maxPrice
      );
    }

    return result;
  }, [
    initialLawyers,
    selectedSpecialty,
    selectedCity,
    selectedModality,
    selectedUrgency,
    minExperience,
    maxPrice,
  ]);

  const hasActiveFilters =
    selectedSpecialty !== "all" ||
    selectedCity !== "all" ||
    selectedModality !== "all" ||
    selectedUrgency !== "all" ||
    minExperience > 0 ||
    maxPrice !== "all";

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    if (caseId === "new") {
      setCaseDraft({
        title: "",
        description: "",
        specialtyId: specialties[0]?.id || 1,
        specialtyName: specialties[0]?.name || "Derecho Laboral",
        urgency: "medium",
        city: userCity,
        modality: "virtual",
        isConfidential: true,
      });
      setIsDetailModalOpen(true);
    } else {
      const found = localCases.find((c) => c.id === caseId);
      if (found) {
        setCaseDraft({
          title: found.title,
          description: found.description,
          specialtyId: found.specialty_id || specialties[0]?.id || 1,
          specialtyName: found.specialties?.name || specialties[0]?.name || "Derecho Laboral",
          urgency: found.urgency || "medium",
          city: found.city || userCity,
          modality: (found.modality as any) || "virtual",
          isConfidential: true,
        });
      }
    }
  };

  const handleFavoriteChange = (lawyerId: string, isFav: boolean) => {
    setFavoritesSet((prev) => {
      const updated = new Set(prev);
      if (isFav) updated.add(lawyerId);
      else updated.delete(lawyerId);
      return updated;
    });
  };

  const sendInquiryToLawyer = useCallback(
    async (lawyerId: string, lawyerName: string, draft: CaseDraft) => {
      try {
        const res = await directMatchWithLawyerAction({
          lawyerId,
          title: draft.title || "Consulta Legal Directa",
          description: draft.description || "Consulta enviada directamente desde el explorador de abogados.",
          specialtyId: draft.specialtyId,
          city: draft.city,
          modality: draft.modality,
          urgency: draft.urgency,
          isConfidential: draft.isConfidential,
        });

        if (res?.success) {
          if (res.isMatched) {
            setMatchSuccessBanner({
              text: `¡Interés confirmado con ${lawyerName}! Conexión establecida. Ya puedes acceder para abonar e iniciar la consulta.`,
              conversationId: res.conversationId,
            });
          } else {
            setMatchSuccessBanner({
              text: `¡Consulta enviada a ${lawyerName}! Se ha notificado al abogado. En cuanto acepte tu solicitud, recibirás una notificación y alerta en pantalla para ir a la conversación, realizar el abono y comenzar la consulta.`,
              conversationId: undefined,
            });
          }
          setTimeout(() => setMatchSuccessBanner(null), 15000);
        }
      } catch (err) {
        console.error("Error al enviar consulta directa:", err);
      }
    },
    []
  );

  const resetFilters = () => {
    setSelectedSpecialty("all");
    setSelectedCity("all");
    setSelectedModality("all");
    setSelectedUrgency("all");
    setMinExperience(0);
    setMaxPrice("all");
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 py-5 space-y-4 font-sans">
      {/* Success Notification Banner */}
      {matchSuccessBanner && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span className="leading-snug">{matchSuccessBanner.text}</span>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            {matchSuccessBanner.conversationId && (
              <Link
                href={`/chat/${matchSuccessBanner.conversationId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-xs"
              >
                <span>Ir a Mensajes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={() => setMatchSuccessBanner(null)}
              className="text-emerald-700 hover:underline text-[11px] font-bold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* SECTION B: Encabezado del Explorador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Encuentra al abogado adecuado para tu caso
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {filteredLawyers.length} colegiados disponibles
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compara experiencia, especialidad y compatibilidad antes de conectar.
          </p>
        </div>

        {/* View Mode Switcher: Tarjetas · Directorio · Mis guardados · Mis casos */}
        <div
          className="flex items-center rounded-xl border border-slate-200 bg-slate-100/90 p-1 shadow-2xs self-start md:self-auto"
          role="tablist"
          aria-label="Modo de exploración"
        >
          {/* Option 1: Tarjetas (Swipe) */}
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "swipe"}
            onClick={() => setViewMode("swipe")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "swipe"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Tarjetas</span>
          </button>

          {/* Option 2: Directorio */}
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-3.5 h-3.5 text-blue-600" />
            <span>Directorio ({filteredLawyers.length})</span>
          </button>

          {/* Option 3: Mis Guardados */}
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "saved"}
            onClick={() => setViewMode("saved")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "saved"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                favoriteLawyers.length > 0 ? "fill-rose-500 text-rose-500" : "text-slate-500"
              }`}
            />
            <span>Mis guardados ({favoriteLawyers.length})</span>
          </button>

          {/* Option 4: Mis Casos (if user has registered cases) */}
          {localCases.length > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "cases"}
              onClick={() => setViewMode("cases")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "cases"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              <span>Mis Casos ({localCases.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION C: Contexto del Caso Activo (Compact & Clean) */}
      <section aria-label="Contexto de caso activo">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3 sm:px-4 sm:py-2.5 shadow-2xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Case Info Strip */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60">
                <FileText className="w-4 h-4" />
              </div>

              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Caso activo:
                </span>

                {localCases.length > 0 ? (
                  <select
                    value={selectedCaseId}
                    onChange={(e) => handleSelectCase(e.target.value)}
                    aria-label="Seleccionar caso activo"
                    className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer max-w-[220px] truncate shadow-2xs"
                  >
                    {localCases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.specialties?.name || "General"})
                      </option>
                    ))}
                    <option value="new">+ Redactar nueva consulta...</option>
                  </select>
                ) : (
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                    {caseDraft.title || "Consulta Legal Directa"}
                  </span>
                )}

                {/* Case tags: Specialty, City, Modality */}
                <span className="rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 px-2.5 py-0.5 text-[10px] font-semibold">
                  {caseDraft.specialtyName}
                </span>
                <span className="hidden md:inline-flex rounded-full bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 text-[10px] font-medium">
                  {caseDraft.city}
                </span>
                <span className="hidden md:inline-flex rounded-full bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 text-[10px] font-medium">
                  {caseDraft.modality === "virtual" ? "Virtual" : "Presencial"}
                </span>
                {/* Dynamic Status Badge for active case */}
                {(() => {
                  const badge = getStatusBadge(activeCaseItem?.status || "published");
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Actions: Edit & New Case */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setPendingMatchLawyer(null);
                  setIsDetailModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer transition-all"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                <span>Editar consulta</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCase("new")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>+ Nuevo caso</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D: Filtros Mejorados y Chips Activos */}
      {viewMode !== "cases" && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* 1. Specialty Filter */}
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all px-2.5 py-1.5 shadow-2xs">
              <Scale className="w-3.5 h-3.5 text-blue-600 shrink-0 mr-1.5" />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full bg-transparent text-[11px] sm:text-xs font-medium text-slate-800 focus:outline-none cursor-pointer truncate"
                aria-label="Filtrar por especialidad"
              >
                <option value="all">Todas las materias</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. City Filter */}
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all px-2.5 py-1.5 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mr-1.5" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-transparent text-[11px] sm:text-xs font-medium text-slate-800 focus:outline-none cursor-pointer truncate"
                aria-label="Filtrar por ciudad"
              >
                <option value="all">Todas las ciudades</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Modality Filter */}
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all px-2.5 py-1.5 shadow-2xs">
              <Building className="w-3.5 h-3.5 text-blue-600 shrink-0 mr-1.5" />
              <select
                value={selectedModality}
                onChange={(e) => setSelectedModality(e.target.value as any)}
                className="w-full bg-transparent text-[11px] sm:text-xs font-medium text-slate-800 focus:outline-none cursor-pointer truncate"
                aria-label="Filtrar por modalidad"
              >
                <option value="all">Todas las modalidades</option>
                <option value="virtual">Solo Virtual</option>
                <option value="physical">Solo Presencial</option>
              </select>
            </div>

            {/* 4. Urgency Filter */}
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all px-2.5 py-1.5 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mr-1.5" />
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="w-full bg-transparent text-[11px] sm:text-xs font-medium text-slate-800 focus:outline-none cursor-pointer truncate"
                aria-label="Filtrar por etapa procesal"
              >
                <option value="all">Todas las etapas</option>
                <option value="immediate">Flagrancia (24h)</option>
                <option value="high">Inv. Preliminar</option>
                <option value="medium">Etapa Intermedia</option>
                <option value="low">Juicio Oral</option>
              </select>
            </div>
          </div>

          {/* Secondary Filters Drawer (Expandable) */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-100 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Experiencia mínima:</span>
                <select
                  value={minExperience}
                  onChange={(e) => setMinExperience(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                >
                  <option value={0}>Cualquier experiencia</option>
                  <option value={3}>+3 años acreditados</option>
                  <option value={5}>+5 años acreditados</option>
                  <option value={10}>+10 años acreditados</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Tarifa máx. consulta:</span>
                <select
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(e.target.value === "all" ? "all" : Number(e.target.value))
                  }
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="all">Cualquier tarifa</option>
                  <option value={120}>Hasta S/. 120</option>
                  <option value={180}>Hasta S/. 180</option>
                  <option value={250}>Hasta S/. 250</option>
                </select>
              </div>
            </div>
          )}

          {/* Active Filter Chips & Bar Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 font-medium">
                <strong className="text-slate-900 font-semibold">{filteredLawyers.length}</strong> de{" "}
                {initialLawyers.length} disponibles
              </span>

              {/* Active Filter Chips */}
              {selectedSpecialty !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 text-[11px] font-semibold">
                  Materia: {selectedSpecialty}
                  <button
                    onClick={() => setSelectedSpecialty("all")}
                    className="hover:text-blue-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCity !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 text-[11px] font-semibold">
                  Ciudad: {selectedCity}
                  <button
                    onClick={() => setSelectedCity("all")}
                    className="hover:text-blue-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedModality !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 text-[11px] font-semibold">
                  Modalidad: {selectedModality === "virtual" ? "Virtual" : "Presencial"}
                  <button
                    onClick={() => setSelectedModality("all")}
                    className="hover:text-blue-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedUrgency !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 text-[11px] font-semibold">
                  Etapa: {selectedUrgency}
                  <button
                    onClick={() => setSelectedUrgency("all")}
                    className="hover:text-amber-950 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {minExperience > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 text-[11px] font-semibold">
                  Exp: +{minExperience} años
                  <button
                    onClick={() => setMinExperience(0)}
                    className="hover:text-blue-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>{showAdvancedFilters ? "Menos filtros" : "Más filtros"}</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION E: Main Exploration Area (Swipe / List / Saved / Cases) */}
      {viewMode === "cases" ? (
        /* Mis Casos View */
        <main className="space-y-4 pt-1 font-sans">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
              Mis Consultas y Casos Registrados ({userCases.length})
            </h2>
            <button
              type="button"
              onClick={() => handleSelectCase("new")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Describir nuevo caso</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localCases.map((c) => {
              const badge = getStatusBadge(c.status);
              const isSelected = c.id === selectedCaseId;
              const isUpdating = updatingCaseId === c.id;

              return (
                <div
                  key={c.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-all shadow-2xs ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md"
                  }`}
                >
                  <div>
                    {/* Header tags: Specialty & Lifecycle Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="rounded-full bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                        {c.specialties?.name || "General"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base line-clamp-1 font-sans">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {c.description}
                    </p>

                    {/* Context info: City & Urgency */}
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Jurisdicción: <strong className="text-slate-800 font-semibold">{c.city}</strong></span>
                      <span>•</span>
                      <span>Modalidad: <strong className="text-slate-800 font-semibold">{c.modality === "virtual" ? "Virtual" : "Presencial"}</strong></span>
                    </div>
                  </div>

                  {/* Lifecycle Controls & Actions */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-3">
                    {/* Status Changer Dropdown/Buttons */}
                    <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                        Cambiar estado:
                      </span>

                      {isUpdating ? (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Actualizando...</span>
                        </div>
                      ) : (
                        <select
                          value={c.status}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateStatus(c.id, e.target.value as CaseStatus)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
                        >
                          <option value="published">🟢 Activo / Abierto</option>
                          <option value="in_progress">🔵 En Proceso</option>
                          <option value="closed">🟣 Concluido / Resuelto</option>
                          <option value="cancelled">⚪ Cancelado / Desistido</option>
                        </select>
                      )}
                    </div>

                    {/* Primary Card CTA */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectCase(c.id);
                          setViewMode("swipe");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        <span>Emparejar Abogados (Tarjetas)</span>
                        <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-blue-600" />
                      </button>

                      {isSelected && (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Seleccionado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      ) : viewMode === "saved" ? (
        /* Mis Guardados & Comparison View */
        <main className="space-y-4 pt-1 font-sans">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
                Abogados Guardados para Comparar ({favoriteLawyers.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evalúa experiencia, honorarios y credenciales de los profesionales que has reservado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode("swipe")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Volver a tarjetas</span>
            </button>
          </div>

          {favoriteLawyers.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mx-auto mb-3">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Aún no tienes abogados guardados</h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Cuando explores tarjetas en la vista principal, presiona el botón &ldquo;Guardar&rdquo; o el atajo S para reservar perfiles y compararlos en este panel.
              </p>
              <button
                type="button"
                onClick={() => setViewMode("swipe")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Explorar tarjetas ahora</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteLawyers.map((fav) => {
                const lp = fav.lawyer_profiles;
                const p = lp.profiles;
                const primarySpec =
                  lp.lawyer_specialties?.find((s) => s.is_primary)?.specialties?.name ||
                  lp.lawyer_specialties?.[0]?.specialties?.name ||
                  "Especialista Jurídico";

                return (
                  <div
                    key={lp.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md transition-all"
                  >
                    <div>
                      {/* Card Top: Verified status & score */}
                      <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-100">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>CAL Habilitado · Reg. {lp.bar_number}</span>
                        </span>
                        <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 text-[10px] font-bold">
                          {fav.score}% afín
                        </span>
                      </div>

                      {/* Lawyer identity */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm">
                          {p.first_name?.[0]}
                          {p.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {p.first_name} {p.last_name}
                          </h4>
                          <p className="text-xs font-semibold text-blue-600 truncate mt-0.5">
                            {primarySpec}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                            <span className="flex items-center gap-1 text-slate-900 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {lp.rating_average ? lp.rating_average.toFixed(1) : "5.0"}
                            </span>
                            <span>·</span>
                            <span>{p.city}</span>
                            <span>·</span>
                            <span className="font-semibold text-slate-900">
                              {lp.consultation_price ? `S/. ${lp.consultation_price}` : "A convenir"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio preview */}
                      <p className="text-xs text-slate-600 line-clamp-2 mt-3 leading-relaxed bg-slate-50 p-2 rounded-xl">
                        {lp.bio || "Abogado colegiado con experiencia demostrada en asesoría jurídica."}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleFavoriteChange(lp.id, false)}
                        className="text-xs font-medium text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        Quitar
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            sendInquiryToLawyer(
                              lp.id,
                              `${p.first_name} ${p.last_name}`,
                              caseDraft
                            );
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3 h-3 text-blue-400 stroke-[3]" />
                          <span>Conectar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      ) : viewMode === "swipe" ? (
        /* Tarjetas Swipe View */
        <main className="pt-1 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Ficha del Caso Activo (Desktop Only) */}
            <aside className="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col gap-4.5">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Caso para Match
                  </span>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5">
                    Activo
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {caseDraft.title || "Consulta Legal Directa"}
                  </h4>
                  <p className="text-xs sm:text-sm text-blue-600 font-semibold mt-1">
                    {caseDraft.specialtyName}
                  </p>
                </div>

                {caseDraft.description && (
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {caseDraft.description}
                  </p>
                )}

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs sm:text-[13px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Jurisdicción:
                    </span>
                    <span className="font-semibold text-slate-800">{caseDraft.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      Modalidad:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {caseDraft.modality === "virtual" ? "Virtual" : "Presencial"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Urgencia:
                    </span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {caseDraft.urgency === "immediate"
                        ? "Flagrancia (24h)"
                        : caseDraft.urgency === "high"
                        ? "Alta"
                        : caseDraft.urgency === "medium"
                        ? "Media"
                        : "Ordinaria"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPendingMatchLawyer(null);
                    setIsDetailModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 py-2.5 text-xs sm:text-[13px] font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4 text-slate-500" />
                  <span>Editar consulta</span>
                </button>
              </div>
            </aside>

            {/* Center Column: Interactive Swipe Deck */}
            <div className="lg:col-span-8 xl:col-span-6 flex flex-col items-center w-full">
              <SwipeDeck
                matches={filteredLawyers}
                caseId={selectedCaseId || "direct_inquiry"}
                onSwitchToList={() => setViewMode("list")}
                favoritesSet={favoritesSet}
                onFavoriteChange={handleFavoriteChange}
                onExpressInterest={async (lawyerId, lawyerName) => {
                  await sendInquiryToLawyer(lawyerId, lawyerName, caseDraft);
                }}
              />
            </div>

            {/* Right Column: Favoritos Guardados (Desktop Only) */}
            <aside className="hidden lg:flex lg:col-span-12 xl:col-span-3 flex-col gap-4.5">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Tus Guardados
                  </span>
                  <span className="rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-[11px] font-bold px-2.5 py-0.5">
                    {favoriteLawyers.length} guardados
                  </span>
                </div>

                {favoriteLawyers.length > 0 ? (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {favoriteLawyers.map((fav) => {
                      const lp = fav.lawyer_profiles;
                      return (
                        <div
                          key={lp.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/90 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xs">
                              {lp.profiles.first_name?.[0]}
                              {lp.profiles.last_name?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                                {lp.profiles.first_name} {lp.profiles.last_name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                Reg. {lp.bar_number} · <span className="font-semibold text-blue-600">{fav.score}% afín</span>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewMode("saved")}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold shrink-0 transition-colors cursor-pointer"
                          >
                            Ver
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-5 border border-slate-100 text-center">
                    <Heart className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-700">Sin guardados aún</p>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Usa el botón &ldquo;Guardar&rdquo; o la tecla <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold">S</kbd> para reservar perfiles y compararlos.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setViewMode("saved")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 py-2.5 text-xs sm:text-[13px] font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <List className="w-4 h-4 text-slate-500" />
                  <span>Comparar guardados</span>
                </button>
              </div>
            </aside>
          </div>
        </main>
      ) : (
        /* Directorio View */
        <main>
          <LawyerListView
            matches={filteredLawyers}
            caseId={selectedCaseId || "direct_inquiry"}
            favoritesSet={favoritesSet}
            onFavoriteChange={handleFavoriteChange}
          />
        </main>
      )}

      {/* Case Creation / Edit Modal */}
      <CaseDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        caseDraft={caseDraft}
        onSaveDraft={(draft) => {
          setCaseDraft(draft);
          setIsDetailModalOpen(false);
        }}
        targetLawyerName={pendingMatchLawyer?.name}
        specialtiesList={specialties}
        onSendDirectInquiry={async (draft) => {
          if (pendingMatchLawyer) {
            await sendInquiryToLawyer(
              pendingMatchLawyer.id,
              pendingMatchLawyer.name,
              draft
            );
          }
          setIsDetailModalOpen(false);
        }}
      />
    </div>
  );
}
