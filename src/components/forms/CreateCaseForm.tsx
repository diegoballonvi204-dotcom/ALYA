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
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Info,
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
    label: "Preventiva / Informativa",
    desc: "Revisión de contratos, dudas previas o acuerdos futuros sin conflicto inmediato.",
    color: "border-[#E6EAF0] bg-white text-[#202938]",
    selectedColor: "border-[#198754] bg-[#E8F5E9]/50 text-[#198754]",
  },
  {
    value: "medium",
    label: "Estándar",
    desc: "Conflicto o trámite en curso, sin notificación judicial inminente ni plazos vencidos.",
    color: "border-[#E6EAF0] bg-white text-[#202938]",
    selectedColor: "border-[#3157D5] bg-[#EEF2FF] text-[#3157D5]",
  },
  {
    value: "high",
    label: "Apremiante",
    desc: "Carta notarial recibida, citación fiscal o contestación de demanda con plazo activo.",
    color: "border-[#E6EAF0] bg-white text-[#202938]",
    selectedColor: "border-[#3157D5] bg-[#EEF2FF] text-[#3157D5]",
  },
  {
    value: "immediate",
    label: "Crítica / Urgente",
    desc: "Detención policial, violencia intrafamiliar o medida cautelar que requiere auxilio hoy.",
    color: "border-[#E6EAF0] bg-white text-[#202938]",
    selectedColor: "border-[#101828] bg-[#101828] text-white",
  },
] as const;

export default function CreateCaseForm({
  specialties,
  userCity = "Lima",
}: CreateCaseFormProps) {
  const router = useRouter();

  // Step state (1: Situación, 2: Materia, 3: Modalidad y Urgencia, 4: Revisión)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form values
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

  // Specialties breakdown
  const mainSpecialties = specialties.filter((s) => s.parent_id === null);
  const availableSubspecialties = specialtyId
    ? specialties.filter((s) => s.parent_id === specialtyId)
    : [];

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setSpecialtyId(val);
    setSubspecialtyId(null);
  };

  const validateStep = (step: number): boolean => {
    setErrorMessage(null);
    if (step === 1) {
      if (!title.trim() || title.length < 6) {
        setErrorMessage("Por favor ingresa un título de al menos 6 caracteres.");
        return false;
      }
      if (!description.trim() || description.length < 30) {
        setErrorMessage(
          "Describe lo sucedido con al menos 30 caracteres para que los profesionales puedan evaluarlo adecuadamente."
        );
        return false;
      }
    }
    if (step === 2) {
      if (!specialtyId) {
        setErrorMessage("Selecciona la materia jurídica principal de tu consulta.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4) as any);
    }
  };

  const prevStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1) as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) return;

    setLoading(true);
    setErrorMessage(null);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error inesperado al publicar tu caso.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const selectedSpecialtyName =
    specialties.find((s) => s.id === specialtyId)?.name || "Sin seleccionar";
  const selectedSubspecialtyName =
    specialties.find((s) => s.id === subspecialtyId)?.name || null;

  return (
    <div className="space-y-6">
      {/* Visual Step Indicator */}
      <div className="rounded-2xl border border-[#E6EAF0] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { num: 1 as const, label: "Situación" },
            { num: 2 as const, label: "Materia" },
            { num: 3 as const, label: "Atención" },
            { num: 4 as const, label: "Revisión" },
          ].map((s) => {
            const isCurrent = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted) setCurrentStep(s.num);
                  }}
                  disabled={!isCompleted && !isCurrent}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-[#101828] text-white shadow-xs"
                      : isCompleted
                      ? "bg-[#E8F5E9] text-[#198754]"
                      : "bg-[#F7F8FC] text-[#667085]"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </button>
                <span
                  className={`hidden sm:inline text-xs font-semibold ${
                    isCurrent ? "text-[#101828]" : "text-[#667085]"
                  }`}
                >
                  {s.label}
                </span>
                {s.num < 4 && <div className="hidden md:block w-8 h-px bg-[#E6EAF0]" />}
              </div>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#E6EAF0] bg-white p-4 text-xs text-[#202938] shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#101828]" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Situación fáctica */}
      {currentStep === 1 && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-[#E6EAF0] bg-white p-6 sm:p-8 space-y-5 shadow-xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3157D5] font-mono">
                Paso 1 de 4 • En tus propias palabras
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#101828] font-serif mt-1">
                ¿Qué problema necesitas resolver?
              </h2>
              <p className="text-xs sm:text-sm text-[#667085] mt-1">
                Explícalo con sencillez. No es necesario conocer leyes ni artículos del código.
              </p>
            </div>

            {/* Privacy notice banner */}
            <div className="flex items-start gap-3 rounded-2xl border border-[#D1DEFC] bg-[#F0F4FE] p-4 text-xs text-[#202938]">
              <Lock className="w-4 h-4 shrink-0 text-[#3157D5] mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-[#101828]">Consejo de Privacidad (Ley N.° 29733):</span>
                <p className="text-[#667085] leading-relaxed">
                  Por tu seguridad, <strong>evita incluir nombres completos de terceros, número de DNI o cuentas bancarias</strong> en este texto. Tus datos estarán enmascarados hasta que confirmes un match bilateral.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                  Título breve de tu situación *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Despido arbitrario sin pago de beneficios laborales"
                  className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-4 py-3 text-sm text-[#101828] placeholder:text-slate-400 focus:bg-white focus:border-[#3157D5] focus:outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#202938]">
                    Detalle de lo ocurrido y qué necesitas *
                  </label>
                  <span className="text-[11px] font-mono text-[#667085]">
                    {description.length} caracteres
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Trabajé durante 3 años en una empresa comercial y hace dos días me entregaron una carta de despido sin causa justificada. Necesito saber cómo proceder para exigir mi liquidación y beneficios pendientes..."
                  className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] p-4 text-sm text-[#101828] placeholder:text-slate-400 focus:bg-white focus:border-[#3157D5] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* AI Case Assistant */}
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

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-6 py-3 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
            >
              <span>Continuar a materia legal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Materia Jurídica */}
      {currentStep === 2 && (
        <div className="rounded-3xl border border-[#E6EAF0] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#3157D5] font-mono">
              Paso 2 de 4 • Clasificación de la Consulta
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#101828] font-serif mt-1">
              Área jurídica de tu caso
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Esto permite que el algoritmo te presente abogados con experiencia demostrada en esta materia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                Materia Principal *
              </label>
              <select
                required
                value={specialtyId}
                onChange={handleSpecialtyChange}
                className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-4 py-3 text-sm text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none transition-all"
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
              <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                Subespecialidad específica (Opcional)
              </label>
              <select
                value={subspecialtyId || 0}
                onChange={(e) => setSubspecialtyId(Number(e.target.value) || null)}
                disabled={availableSubspecialties.length === 0}
                className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-4 py-3 text-sm text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none transition-all disabled:opacity-50"
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

          <div className="flex items-center justify-between pt-4 border-t border-[#E6EAF0]">
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#101828] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>

            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-6 py-3 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
            >
              <span>Continuar a modalidad</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Urgencia, Modalidad y Ubicación */}
      {currentStep === 3 && (
        <div className="rounded-3xl border border-[#E6EAF0] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#3157D5] font-mono">
              Paso 3 de 4 • Preferencias de Atención
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#101828] font-serif mt-1">
              ¿Cómo y dónde prefieres ser atendido?
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Elige si deseas consultas virtuales, presenciales en despacho o ambas.
            </p>
          </div>

          {/* Nivel de Urgencia */}
          <div>
            <label className="block text-xs font-semibold text-[#202938] mb-2">
              Nivel de Urgencia de la Consulta
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {URGENCY_OPTIONS.map((u) => {
                const selected = urgency === u.value;
                return (
                  <button
                    type="button"
                    key={u.value}
                    onClick={() => setUrgency(u.value)}
                    className={`flex flex-col text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                      selected
                        ? `${u.selectedColor} shadow-xs ring-1 ring-current`
                        : `${u.color} hover:border-slate-300`
                    }`}
                  >
                    <span className="text-xs font-bold font-mono mb-1">{u.label}</span>
                    <p className="text-[11px] text-[#667085] leading-relaxed">{u.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modalidad y Ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                Modalidad Preferida
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setModality("virtual")}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition-all cursor-pointer ${
                    modality === "virtual"
                      ? "border-[#3157D5] bg-[#EEF2FF] text-[#3157D5]"
                      : "border-[#E6EAF0] bg-[#F7F8FC] text-[#667085] hover:bg-white"
                  }`}
                >
                  <Video className="w-4 h-4 mb-1" />
                  <span>Virtual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModality("in_person")}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition-all cursor-pointer ${
                    modality === "in_person"
                      ? "border-[#3157D5] bg-[#EEF2FF] text-[#3157D5]"
                      : "border-[#E6EAF0] bg-[#F7F8FC] text-[#667085] hover:bg-white"
                  }`}
                >
                  <Building className="w-4 h-4 mb-1" />
                  <span>Presencial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModality("hybrid")}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition-all cursor-pointer ${
                    modality === "hybrid"
                      ? "border-[#3157D5] bg-[#EEF2FF] text-[#3157D5]"
                      : "border-[#E6EAF0] bg-[#F7F8FC] text-[#667085] hover:bg-white"
                  }`}
                >
                  <Sparkles className="w-4 h-4 mb-1" />
                  <span>Híbrida</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                Ciudad / Jurisdicción
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-[#E6EAF0] bg-[#F7F8FC] px-4 py-3 text-sm text-[#101828] focus:bg-white focus:border-[#3157D5] focus:outline-none transition-all"
              >
                {PERU_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E6EAF0]">
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#101828] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>

            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-6 py-3 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
            >
              <span>Revisar resumen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Revisión del caso y Confirmación */}
      {currentStep === 4 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-3xl border border-[#E6EAF0] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3157D5] font-mono">
                Paso 4 de 4 • Resumen Final
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#101828] font-serif mt-1">
                Revisa los datos de tu consulta
              </h2>
              <p className="text-xs sm:text-sm text-[#667085] mt-1">
                Verifica que la información sea clara antes de iniciar el matching con abogados.
              </p>
            </div>

            {/* Summary Box */}
            <div className="rounded-2xl border border-[#E6EAF0] bg-[#F7F8FC] p-5 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#667085] font-mono">
                  Título del caso
                </span>
                <p className="text-base font-bold text-[#101828] font-serif mt-0.5">{title}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-[#667085] font-mono">
                  Descripción
                </span>
                <p className="text-xs text-[#202938] leading-relaxed mt-0.5 whitespace-pre-line">
                  {description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E6EAF0] text-xs">
                <div>
                  <span className="text-[10px] text-[#667085] font-mono uppercase">Materia</span>
                  <p className="font-bold text-[#101828]">
                    {selectedSpecialtyName}
                    {selectedSubspecialtyName ? ` › ${selectedSubspecialtyName}` : ""}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#667085] font-mono uppercase">Ciudad</span>
                  <p className="font-bold text-[#101828]">{city}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#667085] font-mono uppercase">Modalidad</span>
                  <p className="font-bold text-[#101828] capitalize">{modality}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#667085] font-mono uppercase">Urgencia</span>
                  <p className="font-bold text-[#101828] capitalize">{urgency}</p>
                </div>
              </div>
            </div>

            {/* Confidentiality toggle */}
            <div className="flex items-start gap-4 rounded-2xl border border-[#D1DEFC] bg-[#F0F4FE] p-4.5">
              <ShieldCheck className="w-6 h-6 text-[#198754] shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#101828]">
                    Protección de Datos Personales (Ley N.° 29733)
                  </h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isConfidential}
                      onChange={(e) => setIsConfidential(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3157D5]"></div>
                  </label>
                </div>
                <p className="text-[11px] text-[#667085] leading-relaxed">
                  Tus datos de contacto directo se mantendrán ocultos para los abogados hasta que exista un interés recíproco confirmado.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E6EAF0]">
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#101828] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a editar</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-8 py-3.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Conectando con motor de matching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Publicar consulta y ver abogados</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
