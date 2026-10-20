"use client";

import { useState } from "react";
import { SpecialtySelector, type SpecialtyItem } from "./SpecialtySelector";
import { submitLawyerOnboarding } from "@/actions/onboarding.actions";
import DocumentUploader from "@/components/lawyer/DocumentUploader";
import {
  Shield,
  Briefcase,
  Award,
  Building,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileCheck2,
  Lock,
  CheckCircle2,
} from "lucide-react";

interface InitialLawyerData {
  barAssociation?: string;
  barNumber?: string;
  yearsExperience?: number;
  bio?: string;
  virtualAttention?: boolean;
  physicalAttention?: boolean;
  addressOffice?: string;
  consultationPrice?: number;
  specialties?: { specialty_id: number; experience_years: number; is_primary: boolean }[];
  documents?: {
    dni_front?: string;
    dni_back?: string;
    bar_card?: string;
    habilitation_cert?: string;
  };
}

interface LawyerOnboardingFormProps {
  specialties: SpecialtyItem[];
  userEmail: string;
  userId: string;
  initialData?: InitialLawyerData;
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

export function LawyerOnboardingForm({
  specialties,
  userEmail,
  userId,
  initialData,
}: LawyerOnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Form State
  const [barAssociation, setBarAssociation] = useState(
    initialData?.barAssociation || BAR_ASSOCIATIONS[0]
  );
  const [barNumber, setBarNumber] = useState(initialData?.barNumber || "");
  const [yearsExperience, setYearsExperience] = useState(
    initialData?.yearsExperience ?? 3
  );
  const [bio, setBio] = useState(initialData?.bio || "");
  const [selectedSpecialties, setSelectedSpecialties] = useState<
    { specialtyId: number; experienceYears: number; isPrimary: boolean }[]
  >(
    initialData?.specialties?.map((s) => ({
      specialtyId: s.specialty_id,
      experienceYears: s.experience_years,
      isPrimary: s.is_primary,
    })) || []
  );
  const [virtualAttention, setVirtualAttention] = useState(
    initialData?.virtualAttention ?? true
  );
  const [physicalAttention, setPhysicalAttention] = useState(
    initialData?.physicalAttention ?? false
  );
  const [addressOffice, setAddressOffice] = useState(
    initialData?.addressOffice || ""
  );
  const [consultationPrice, setConsultationPrice] = useState<number | undefined>(
    initialData?.consultationPrice ?? 120
  );

  // Document Uploads (Paso 4)
  const [dniFront, setDniFront] = useState(initialData?.documents?.dni_front || "");
  const [dniBack, setDniBack] = useState(initialData?.documents?.dni_back || "");
  const [barCard, setBarCard] = useState(initialData?.documents?.bar_card || "");
  const [habilitationCert, setHabilitationCert] = useState(
    initialData?.documents?.habilitation_cert || ""
  );

  // Validación preventiva Paso 1
  const validateStep1 = () => {
    setErrorMessage(null);
    setFieldErrors({});

    const errors: Record<string, string[]> = {};
    const cleanBar = barNumber.trim();

    if (!cleanBar) {
      errors.barNumber = ["Ingresa tu número de matrícula oficial."];
    } else if (cleanBar.length < 3 || cleanBar.length > 6) {
      errors.barNumber = [
        "El número de matrícula debe tener entre 3 y 6 dígitos numéricos (Ej: 48920).",
      ];
    }

    if (yearsExperience < 0 || yearsExperience > 60) {
      errors.yearsExperience = ["Ingresa años de experiencia válidos (0 a 60)."];
    }

    if (bio.trim().length < 50) {
      errors.bio = [
        `Tu presentación debe tener al menos 50 caracteres (actualmente ${bio.trim().length}).`,
      ];
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage("Por favor corrige los datos señalados en rojo antes de continuar.");
      return false;
    }
    return true;
  };

  // Validación preventiva Paso 2
  const validateStep2 = () => {
    setErrorMessage(null);
    if (selectedSpecialties.length === 0) {
      setErrorMessage("Debes seleccionar al menos una especialidad jurídica.");
      return false;
    }
    return true;
  };

  // Validación preventiva Paso 3
  const validateStep3 = () => {
    setErrorMessage(null);
    const errors: Record<string, string[]> = {};

    if (!virtualAttention && !physicalAttention) {
      errors.virtualAttention = [
        "Debes seleccionar al menos una modalidad (virtual o presencial).",
      ];
    }

    if (consultationPrice !== undefined && consultationPrice < 30) {
      errors.consultationPrice = ["La tarifa sugerida mínima es de S/. 30.00."];
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage("Por favor corrige los datos de modalidad u honorarios.");
      return false;
    }
    return true;
  };

  // Validación final y Submit (Paso 4)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!dniFront || !dniBack || !barCard) {
      setErrorMessage(
        "Debes adjuntar obligatoriamente el anverso y reverso de tu DNI y tu Carné de Colegiatura Oficial."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitLawyerOnboarding({
        barAssociation,
        barNumber: barNumber.trim(),
        yearsExperience,
        bio: bio.trim(),
        specialties: selectedSpecialties,
        virtualAttention,
        physicalAttention,
        addressOffice: physicalAttention ? addressOffice.trim() : undefined,
        consultationPrice,
        dniFrontPath: dniFront,
        dniBackPath: dniBack,
        barCardPath: barCard,
        habilitationCertPath: habilitationCert || undefined,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
          // Redirigir al paso donde esté el error si ocurrió en pasos previos
          if (res.fieldErrors.barNumber || res.fieldErrors.bio || res.fieldErrors.barAssociation) {
            setStep(1);
          } else if (res.fieldErrors.specialties) {
            setStep(2);
          } else if (res.fieldErrors.virtualAttention || res.fieldErrors.consultationPrice) {
            setStep(3);
          }
        }
        setIsSubmitting(false);
      }
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT")) return;
      setErrorMessage(err?.message || "Ocurrió un error inesperado al guardar el perfil.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xl shadow-slate-900/5">
      {/* Header */}
      <div className="mb-8 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-[#2563EB] mb-1.5 font-mono">
          <Shield className="w-4 h-4 text-[#2563EB]" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Registro y Validación de Abogado Colegiado
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif">
          Configuración de Perfil Profesional
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Paso {step} de 4 — Completa tus datos colegiados y expediente documental para habilitar tu cuenta.
        </p>

        {/* Stepper Bar */}
        <div className="flex gap-2.5 mt-5">
          {[
            { num: 1, label: "Colegiatura" },
            { num: 2, label: "Especialidades" },
            { num: 3, label: "Modalidad" },
            { num: 4, label: "Expediente" },
          ].map((s) => (
            <div key={s.num} className="flex-1">
              <div
                className={`h-2 rounded-full transition-all ${
                  s.num <= step ? "bg-[#0F172A]" : "bg-slate-200"
                }`}
              />
              <span
                className={`text-[10px] mt-1.5 block font-medium truncate ${
                  s.num === step
                    ? "text-[#0F172A] font-bold"
                    : s.num < step
                    ? "text-slate-700"
                    : "text-slate-400"
                }`}
              >
                {s.num}. {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs sm:text-sm text-red-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Revisa la información ingresada:</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PASO 1: Identificación Colegiada */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Colegio Profesional de Procedencia <span className="text-[#2563EB]">*</span>
              </label>
              <select
                value={barAssociation}
                onChange={(e) => setBarAssociation(e.target.value)}
                className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 px-4 py-3 text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Número de Matrícula / Colegiatura <span className="text-[#2563EB]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 48920"
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value.replace(/\D/g, ""))}
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-mono text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.barNumber
                      ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300/80 bg-slate-50/70 focus:border-[#2563EB] focus:ring-[#2563EB]/15"
                  }`}
                />
                {fieldErrors.barNumber ? (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">
                    {fieldErrors.barNumber[0]}
                  </p>
                ) : (
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Entre 3 y 6 dígitos numéricos registrados en tu colegio profesional.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Años de Ejercicio Profesional <span className="text-[#2563EB]">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  required
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-mono text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.yearsExperience
                      ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300/80 bg-slate-50/70 focus:border-[#2563EB] focus:ring-[#2563EB]/15"
                  }`}
                />
                {fieldErrors.yearsExperience && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">
                    {fieldErrors.yearsExperience[0]}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Presentación Profesional (Biografía) <span className="text-[#2563EB]">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe tu trayectoria procesal, casos en los que te especializas, enfoque ético y años en tribunales..."
                className={`w-full rounded-xl border p-4 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.bio
                    ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-300/80 bg-slate-50/70 focus:border-[#2563EB] focus:ring-[#2563EB]/15"
                }`}
              />
              <div className="flex justify-between items-center text-xs mt-1">
                {fieldErrors.bio ? (
                  <span className="text-red-600 font-medium">{fieldErrors.bio[0]}</span>
                ) : (
                  <span className="text-slate-400">Mínimo 50 caracteres requeridos.</span>
                )}
                <span
                  className={`font-mono ${
                    bio.trim().length >= 50 ? "text-emerald-600 font-bold" : "text-amber-600"
                  }`}
                >
                  {bio.trim().length} / 1200
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2);
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-7 py-3 text-sm font-bold text-white transition-all shadow-md shadow-slate-900/10 cursor-pointer"
              >
                <span>Continuar a Especialidades</span>
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Especialidades Jurídicas */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Selecciona tus ramas de práctica legal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Los casos de clientes se emparejarán automáticamente según las especialidades que marques aquí.
              </p>
            </div>

            <SpecialtySelector
              specialties={specialties}
              selected={selectedSpecialties}
              onChange={setSelectedSpecialties}
            />

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(1);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) {
                    setStep(3);
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-7 py-3 text-sm font-bold text-white transition-all shadow-md shadow-slate-900/10 cursor-pointer"
              >
                <span>Continuar a Modalidad & Honorarios</span>
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Modalidad y Tarifas */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Modalidad de Atención a Clientes <span className="text-[#2563EB]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${
                    virtualAttention
                      ? "border-blue-500 bg-blue-50/70 shadow-xs"
                      : "border-slate-200 bg-slate-50/70 hover:bg-slate-100/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={virtualAttention}
                    onChange={(e) => setVirtualAttention(e.target.checked)}
                    className="mt-1 accent-[#2563EB] h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-sm text-[#0F172A] block">
                      Atención Virtual (Videollamada)
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      Permite atender clientes de todo el Perú de manera remota y segura.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${
                    physicalAttention
                      ? "border-blue-500 bg-blue-50/70 shadow-xs"
                      : "border-slate-200 bg-slate-50/70 hover:bg-slate-100/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={physicalAttention}
                    onChange={(e) => setPhysicalAttention(e.target.checked)}
                    className="mt-1 accent-[#2563EB] h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-sm text-[#0F172A] block">
                      Atención Presencial (Estudio / Despacho)
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      Clientes podrán agendar citas presenciales en tu dirección profesional.
                    </span>
                  </div>
                </label>
              </div>
              {fieldErrors.virtualAttention && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">
                  {fieldErrors.virtualAttention[0]}
                </p>
              )}
            </div>

            {physicalAttention && (
              <div className="animate-in fade-in duration-150">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Dirección de Estudio u Oficina Jurídica
                </label>
                <input
                  type="text"
                  placeholder="Ej: Av. Las Begonias 441, San Isidro, Lima"
                  value={addressOffice}
                  onChange={(e) => setAddressOffice(e.target.value)}
                  className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 px-4 py-2.5 text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Esta dirección solo se comparte con clientes que confirmen una cita con tu despacho.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Tarifa Orientativa por Consulta Inicial (PEN S/.)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 font-mono font-bold text-[#2563EB]">
                  S/.
                </span>
                <input
                  type="number"
                  min="30"
                  step="10"
                  placeholder="120.00"
                  value={consultationPrice || ""}
                  onChange={(e) =>
                    setConsultationPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 pl-12 pr-4 py-2.5 text-sm font-mono text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Monto sugerido referencial (mínimo S/. 30). Podrás definir honorarios por escrito para cada caso.
              </span>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(2);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep3()) {
                    setStep(4);
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-7 py-3 text-sm font-bold text-white transition-all shadow-md shadow-slate-900/10 cursor-pointer"
              >
                <span>Continuar a Carga de Documentos</span>
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: Expediente Documental de Colegiatura */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-950 flex items-start gap-3">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Expediente de Auditoría Colegiada</strong>
                <span>
                  Para habilitar tu cuenta oficial de abogado y recibir casos compatibles, adjunta tu documento de identidad y tu carné colegiado. El equipo de verificación cotejará tus credenciales con el padrón oficial del Colegio de Abogados.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DocumentUploader
                label="1. DNI — Anverso (Frontal) *"
                description="Fotografía o escaneo legible de la parte delantera de tu DNI."
                docKey="dni_front"
                userId={userId}
                onUploaded={setDniFront}
                existingPath={dniFront}
              />

              <DocumentUploader
                label="2. DNI — Reverso (Posterior) *"
                description="Fotografía o escaneo legible de la parte posterior de tu DNI."
                docKey="dni_back"
                userId={userId}
                onUploaded={setDniBack}
                existingPath={dniBack}
              />

              <DocumentUploader
                label="3. Carné de Colegiatura Oficial *"
                description="Carné vigente emitido por tu Colegio de Abogados (CAL, CAC u otro)."
                docKey="bar_card"
                userId={userId}
                onUploaded={setBarCard}
                existingPath={barCard}
              />

              <DocumentUploader
                label="4. Constancia de Habilitación (Opcional)"
                description="Constancia de habilidad o certificado digital expedido por el colegio."
                docKey="habilitation_cert"
                userId={userId}
                onUploaded={setHabilitationCert}
                existingPath={habilitationCert}
              />
            </div>

            <div className="pt-6 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(3);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !dniFront || !dniBack || !barCard}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-8 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-slate-900/15 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Enviando Expediente a Auditoría...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 className="w-4 h-4 text-blue-400" />
                    <span>Finalizar y Enviar a Auditoría Colegiada</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
