"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCaseAction } from "@/actions/cases.actions";
import {
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  MapPin,
  Video,
  Building,
  Sparkles,
  HelpCircle,
  CheckCircle,
} from "lucide-react";
import { AICaseAssistant } from "./AICaseAssistant";

interface Specialty {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  description: string | null;
}

interface CreateCaseFormProps {
  specialties: Specialty[];
  userCity?: string;
}

const PERU_CITIES = [
  "Lima",
  "Arequipa",
  "Trujillo",
  "Cusco",
  "Piura",
  "Chiclayo",
  "Huancayo",
  "Iquitos",
  "Tacna",
  "Pucallpa",
  "Chimbote",
  "Ica",
  "Juliaca",
  "Ayacucho",
  "Cajamarca",
];

const URGENCY_OPTIONS = [
  {
    value: "low",
    label: "Baja (Preventiva)",
    desc: "Consultas preliminares, revisión de contratos o acuerdos.",
    color: "border-emerald-300 bg-emerald-50/70 text-emerald-950",
    badge: "bg-emerald-100 text-emerald-800",
  },
  {
    value: "medium",
    label: "Media (Estándar)",
    desc: "Conflictos en curso sin plazo procesal perentorio.",
    color: "border-blue-300 bg-blue-50/70 text-blue-950",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    value: "high",
    label: "Alta (Apremiante)",
    desc: "Cartas notariales recibidas, citaciones o contestaciones en curso.",
    color: "border-indigo-300 bg-indigo-50/70 text-indigo-950",
    badge: "bg-indigo-100 text-indigo-800",
  },
  {
    value: "immediate",
    label: "Inmediata (Crítica)",
    desc: "Detención policial/fiscal en flagrancia o violencia familiar.",
    color: "border-slate-800 bg-slate-900 text-white",
    badge: "bg-white text-slate-950 font-bold",
  },
] as const;

export default function CreateCaseForm({
  specialties,
  userCity = "Lima",
}: CreateCaseFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specialtyId, setSpecialtyId] = useState<number>(0);
  const [subspecialtyId, setSubspecialtyId] = useState<number | null>(null);
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "immediate">("medium");
  const [city, setCity] = useState(userCity);
  const [modality, setModality] = useState<"virtual" | "in_person" | "hybrid">("virtual");
  const [isConfidential, setIsConfidential] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtrar ramas principales (parent_id == null)
  const mainSpecialties = specialties.filter((s) => s.parent_id === null);

  // Filtrar subespecialidades de la rama seleccionada
  const availableSubspecialties = specialtyId
    ? specialties.filter((s) => s.parent_id === specialtyId)
    : [];

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setSpecialtyId(val);
    setSubspecialtyId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || title.length < 6) {
      setErrorMessage("Por favor ingresa un título de al menos 6 caracteres.");
      return;
    }

    if (!description.trim() || description.length < 30) {
      setErrorMessage(
        "Describe tu situación con al menos 30 caracteres para que los abogados puedan analizarla."
      );
      return;
    }

    if (!specialtyId) {
      setErrorMessage("Debes seleccionar una materia jurídica principal.");
      return;
    }

    setLoading(true);

    try {
      const res = await createCaseAction({
        title,
        description,
        specialtyId,
        subspecialtyId,
        urgency,
        city,
        modality,
        isConfidential,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        setLoading(false);
        return;
      }

      if (res?.caseId) {
        router.push(`/cases/${res.caseId}/match`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error inesperado al publicar tu caso.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm text-[#0F172A] shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-slate-700" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Paso 1: "Cuéntanos qué ocurrió" */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB] uppercase tracking-wider font-mono">
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
          <span>Paso 1 • En tus propias palabras</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] font-serif">¿Cuál es tu problema legal?</h2>
          <p className="text-xs text-slate-500 mt-1">
            No necesitas usar términos técnicos. Describe qué ocurrió y qué solución buscas.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Título resumido del caso *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Despido arbitrario sin pago de liquidación en empresa privada"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Detalle de lo ocurrido *
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {description.length} / 3000 caracteres
              </span>
            </div>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Laboré durante 3 años en una empresa comercial y el día de ayer me entregaron una carta de despido sin expresión de causa. No me quieren reconocer mi CTS pendiente ni vacaciones truncas..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Asistente Inteligente de Clasificación Legal */}
      <AICaseAssistant
        title={title}
        description={description}
        city={city}
        onApplySuggestion={({ specialtyId: sId, subspecialtyId: subId, urgency: urg }) => {
          setSpecialtyId(sId);
          setSubspecialtyId(subId);
          const mappedUrgency = urg === "urgent" ? "immediate" : urg;
          setUrgency(mappedUrgency);
        }}
      />

      {/* Paso 2: Materia y Subespecialidad en Cascada */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB] uppercase tracking-wider font-mono">
          <FileText className="w-4 h-4 text-[#2563EB]" />
          <span>Paso 2 • Tipificación Jurídica</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] font-serif">Materia Jurídica y Especialidad</h2>
          <p className="text-xs text-slate-500 mt-1">
            Selecciona el área legal más afín para que nuestro algoritmo pondere a los abogados idóneos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Rama Legal Principal *
            </label>
            <select
              required
              value={specialtyId}
              onChange={handleSpecialtyChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
            >
              <option value={0}>Selecciona una materia...</option>
              {mainSpecialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Subespecialidad específica (Opcional +20% compatibilidad)
            </label>
            <select
              value={subspecialtyId || 0}
              onChange={(e) => setSubspecialtyId(Number(e.target.value) || null)}
              disabled={availableSubspecialties.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={0}>
                {availableSubspecialties.length > 0
                  ? "Selecciona subespecialidad afín..."
                  : "Materia general / Sin subespecialidad"}
              </option>
              {availableSubspecialties.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Paso 3: Urgencia, Modalidad y Ubicación */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB] uppercase tracking-wider font-mono">
          <Clock className="w-4 h-4 text-[#2563EB]" />
          <span>Paso 3 • Parámetros de Atención</span>
        </div>

        {/* Nivel de Urgencia */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Nivel de Urgencia del Caso
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {URGENCY_OPTIONS.map((u) => {
              const selected = urgency === u.value;
              return (
                <button
                  type="button"
                  key={u.value}
                  onClick={() => setUrgency(u.value)}
                  className={`flex flex-col text-left rounded-xl border p-4 transition-all ${
                    selected
                      ? `${u.color} ring-2 ring-current shadow-xs`
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white text-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase mb-2 ${
                      selected ? u.badge : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {u.label}
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{u.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modalidad y Ubicación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Modalidad de Atención Deseada
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setModality("virtual")}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-medium transition-all ${
                  modality === "virtual"
                    ? "border-[#2563EB] bg-blue-50/80 text-[#2563EB] font-bold shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <Video className="w-4 h-4 mb-1" />
                Virtual
              </button>
              <button
                type="button"
                onClick={() => setModality("in_person")}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-medium transition-all ${
                  modality === "in_person"
                    ? "border-[#2563EB] bg-blue-50/80 text-[#2563EB] font-bold shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <Building className="w-4 h-4 mb-1" />
                Presencial
              </button>
              <button
                type="button"
                onClick={() => setModality("hybrid")}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-medium transition-all ${
                  modality === "hybrid"
                    ? "border-[#2563EB] bg-blue-50/80 text-[#2563EB] font-bold shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <Sparkles className="w-4 h-4 mb-1" />
                Híbrida
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ciudad / Departamento del Caso
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
            >
              {PERU_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Paso 4: Cláusula de Confidencialidad (Ley N.° 29733) */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 sm:p-6 flex items-start gap-4 shadow-xs">
        <div className="rounded-xl bg-blue-100/80 p-2 text-[#2563EB] shrink-0 mt-0.5">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#0F172A]">
              Protección y Confidencialidad (Ley N.° 29733)
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
            </label>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tus datos de identidad directa (teléfono, apellidos y DNI) permanecerán
            estrictamente protegidos y enmascarados para los abogados. Solo se revelarán
            cuando ambas partes confirmen interés mutuo en el caso (Match Bilateral).
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-8 py-3.5 text-sm font-bold text-white transition-all shadow-md shadow-slate-900/10 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Calculando compatibilidad con abogados...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 stroke-[2.5] text-blue-400" />
              Publicar caso y encontrar abogados
            </>
          )}
        </button>
      </div>
    </form>
  );
}
