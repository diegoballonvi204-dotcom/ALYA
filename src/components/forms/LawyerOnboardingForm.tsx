"use client";

import { useState } from "react";
import { SpecialtySelector, type SpecialtyItem } from "./SpecialtySelector";
import { submitLawyerOnboarding } from "@/actions/onboarding.actions";
import { Shield, Briefcase, Award, Building, DollarSign, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface LawyerOnboardingFormProps {
  specialties: SpecialtyItem[];
  userEmail: string;
}

const BAR_ASSOCIATIONS = [
  "Colegio de Abogados de Lima (CAL)",
  "Colegio de Abogados de Lima Sur (CALSUR)",
  "Colegio de Abogados de Lima Norte (CALNORTE)",
  "Colegio de Abogados del Callao (CAC)",
  "Colegio de Abogados de Arequipa (CAA)",
  "Colegio de Abogados de La Libertad (CALL)",
  "Colegio de Abogados de Lambayeque (CAL)",
  "Colegio de Abogados de Cusco (CAC)",
  "Colegio de Abogados de Piura (CAP)",
  "Colegio de Abogados de Junín (CAJ)",
  "Colegio de Abogados de Tacna (CAT)",
  "Colegio de Abogados de Áncash (CAA)",
  "Colegio de Abogados de Ica (CAI)",
  "Otro Colegio Profesional Departamental",
];

export function LawyerOnboardingForm({ specialties }: LawyerOnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [barAssociation, setBarAssociation] = useState(BAR_ASSOCIATIONS[0]);
  const [barNumber, setBarNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState(3);
  const [bio, setBio] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<
    { specialtyId: number; experienceYears: number; isPrimary: boolean }[]
  >([]);
  const [virtualAttention, setVirtualAttention] = useState(true);
  const [physicalAttention, setPhysicalAttention] = useState(false);
  const [addressOffice, setAddressOffice] = useState("");
  const [consultationPrice, setConsultationPrice] = useState<number | undefined>(100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedSpecialties.length === 0) {
      setErrorMessage("Por favor selecciona al menos una especialidad jurídica.");
      setStep(2);
      return;
    }

    if (!virtualAttention && !physicalAttention) {
      setErrorMessage("Selecciona al menos una modalidad de atención.");
      setStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitLawyerOnboarding({
        barAssociation,
        barNumber,
        yearsExperience,
        bio,
        specialties: selectedSpecialties,
        virtualAttention,
        physicalAttention,
        addressOffice,
        consultationPrice,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT")) return;
      setErrorMessage(err?.message || "Ocurrió un error inesperado al guardar.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="mb-8 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2 text-[#2563EB] mb-1 font-mono">
          <Shield className="w-4 h-4 text-[#2563EB]" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Registro de Abogado Colegiado
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-serif">
          Configuración de Perfil Profesional
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Paso {step} de 3 — Completa tus datos para empezar a recibir casos compatibles.
        </p>

        {/* Stepper Dots */}
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? "bg-[#0F172A]" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-[#0F172A] flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-slate-700 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PASO 1: Identificación Colegiada */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Colegio Profesional de Procedencia <span className="text-[#2563EB]">*</span>
              </label>
              <select
                value={barAssociation}
                onChange={(e) => setBarAssociation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
              >
                {BAR_ASSOCIATIONS.map((assoc) => (
                  <option key={assoc} value={assoc}>
                    {assoc}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Número de Matrícula / Colegiatura <span className="text-[#2563EB]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 54321"
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-mono text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Años de Ejercicio Profesional <span className="text-[#2563EB]">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  required
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-mono text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Presentación Profesional (Biografía) <span className="text-[#2563EB]">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe tu trayectoria, enfoque jurídico y casos en los que te especializas..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                {bio.length} / 1200 caracteres (mínimo 50)
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!barNumber || bio.length < 50) {
                    setErrorMessage("Por favor ingresa tu número de matrícula y una biografía de al menos 50 caracteres.");
                    return;
                  }
                  setErrorMessage(null);
                  setStep(2);
                }}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-6 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-slate-900/10"
              >
                Continuar a Especialidades
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Especialidades Jurídicas */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <SpecialtySelector
              specialties={specialties}
              selected={selectedSpecialties}
              onChange={setSelectedSpecialties}
            />

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-white transition-colors"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedSpecialties.length === 0) {
                    setErrorMessage("Debes seleccionar al menos una especialidad jurídica.");
                    return;
                  }
                  setErrorMessage(null);
                  setStep(3);
                }}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-6 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-slate-900/10"
              >
                Continuar a Modalidad & Honorarios
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Modalidad y Tarifas */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Modalidad de Atención a Clientes <span className="text-[#2563EB]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                    virtualAttention
                      ? "border-blue-400 bg-blue-50/70"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={virtualAttention}
                    onChange={(e) => setVirtualAttention(e.target.checked)}
                    className="mt-1 accent-[#2563EB]"
                  />
                  <div>
                    <span className="font-semibold text-sm text-[#0F172A] block">
                      Atención Virtual (Videollamada)
                    </span>
                    <span className="text-xs text-slate-500">
                      Permite atender clientes de todo el Perú de manera remota.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                    physicalAttention
                      ? "border-blue-400 bg-blue-50/70"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={physicalAttention}
                    onChange={(e) => setPhysicalAttention(e.target.checked)}
                    className="mt-1 accent-[#2563EB]"
                  />
                  <div>
                    <span className="font-semibold text-sm text-[#0F172A] block">
                      Atención Presencial (Estudio / Oficina)
                    </span>
                    <span className="text-xs text-slate-500">
                      Clientes podrán agendar citas presenciales en tu despacho.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {physicalAttention && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Dirección de Oficina o Despacho (Privada hasta confirmar cita)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Av. Javier Prado Este 450, San Isidro, Lima"
                  value={addressOffice}
                  onChange={(e) => setAddressOffice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Tarifa Orientativa por Consulta Inicial (PEN S/.)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 font-mono font-bold text-[#2563EB]">
                  S/.
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="100.00"
                  value={consultationPrice || ""}
                  onChange={(e) =>
                    setConsultationPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 py-2.5 text-sm font-mono text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                />
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Monto orientativo de referencia para los clientes al explorar perfiles.
              </span>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-white transition-colors"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-8 py-2.5 text-sm font-bold text-white transition-all shadow-md shadow-slate-900/10 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    Guardando Perfil...
                  </>
                ) : (
                  "Finalizar y Publicar Perfil"
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
