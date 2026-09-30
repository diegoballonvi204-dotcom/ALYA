"use client";

import { useState } from "react";
import { updateLawyerProfileAction } from "@/actions/profile.actions";
import { SpecialtySelector, type SpecialtyItem } from "@/components/forms/SpecialtySelector";
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Building,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Save,
  ArrowLeft,
  X,
  FileCheck2,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PERU_DEPARTMENTS = [
  "Lima",
  "Arequipa",
  "Cusco",
  "La Libertad",
  "Piura",
  "Lambayeque",
  "Junín",
  "Áncash",
  "Ica",
  "San Martín",
  "Cajamarca",
  "Loreto",
  "Huánuco",
  "Tacna",
  "Ucayali",
  "Ayacucho",
  "Puno",
  "Callao",
  "Moquegua",
  "Pasco",
  "Tumbes",
  "Madre de Dios",
  "Huancavelica",
  "Apurímac",
  "Amazonas",
];

interface LawyerProfileEditorProps {
  initialData: {
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    email: string;
    barAssociation: string;
    barNumber: string;
    yearsExperience: number;
    bio: string;
    consultationPrice: number | null;
    virtualAttention: boolean;
    physicalAttention: boolean;
    addressOffice: string | null;
    isAvailable: boolean;
    verificationStatus: string;
  };
  lawyerSpecialties: {
    specialtyId: number;
    experienceYears: number;
    isPrimary: boolean;
  }[];
  specialtiesCatalog: SpecialtyItem[];
}

export default function LawyerProfileEditor({
  initialData,
  lawyerSpecialties,
  specialtiesCatalog,
}: LawyerProfileEditorProps) {
  const router = useRouter();

  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [phone, setPhone] = useState(initialData.phone || "");
  const [city, setCity] = useState(initialData.city || "Lima");

  const [bio, setBio] = useState(initialData.bio);
  const [yearsExperience, setYearsExperience] = useState(initialData.yearsExperience);
  const [consultationPrice, setConsultationPrice] = useState<number | undefined>(
    initialData.consultationPrice || undefined
  );
  const [virtualAttention, setVirtualAttention] = useState(initialData.virtualAttention);
  const [physicalAttention, setPhysicalAttention] = useState(initialData.physicalAttention);
  const [addressOffice, setAddressOffice] = useState(initialData.addressOffice || "");
  const [isAvailable, setIsAvailable] = useState(initialData.isAvailable);

  const [selectedSpecialties, setSelectedSpecialties] = useState(lawyerSpecialties);

  // Estados de control de modales de confirmación y rechazo
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Validación previa antes de solicitar confirmación
  const validateForm = (): string[] => {
    const reasons: string[] = [];

    if (!firstName.trim()) {
      reasons.push("Debes ingresar tus nombres.");
    }
    if (!lastName.trim()) {
      reasons.push("Debes ingresar tus apellidos completos.");
    }

    const cleanPhone = phone.trim();
    if (cleanPhone && !/^9\d{8}$/.test(cleanPhone)) {
      reasons.push("El número celular debe ser un celular peruano válido de 9 dígitos comenzando con 9 (ej: 987654321).");
    }

    if (bio.trim().length < 30) {
      reasons.push(`La presentación profesional debe tener al menos 30 caracteres (actualmente tienes ${bio.trim().length}).`);
    }

    if (!virtualAttention && !physicalAttention) {
      reasons.push("Debes habilitar al menos una modalidad de atención: Virtual o Presencial.");
    }

    if (physicalAttention && !addressOffice.trim()) {
      reasons.push("Has marcado atención presencial en despacho. Debes indicar la dirección de tu oficina.");
    }

    if (selectedSpecialties.length === 0) {
      reasons.push("Debes seleccionar al menos una rama o especialidad jurídica de práctica.");
    }

    if (yearsExperience < 0 || yearsExperience > 70) {
      reasons.push("Los años de experiencia deben estar entre 0 y 70 años.");
    }

    return reasons;
  };

  // Maneja el clic en "Guardar Cambios"
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();

    if (errors.length > 0) {
      setRejectionReasons(errors);
      setShowRejectionModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  // Ejecuta el guardado efectivo en base de datos
  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const res = await updateLawyerProfileAction({
        firstName,
        lastName,
        phone,
        city,
        bio,
        yearsExperience,
        consultationPrice,
        virtualAttention,
        physicalAttention,
        addressOffice,
        isAvailable,
        specialties: selectedSpecialties,
      });

      setShowConfirmModal(false);

      if (res.success) {
        setShowSuccessModal(true);
      } else {
        setRejectionReasons([res.error || "Ocurrió un error inesperado al procesar la actualización."]);
        setShowRejectionModal(true);
      }
    } catch (err: any) {
      setShowConfirmModal(false);
      setRejectionReasons([err.message || "Error de red o conexión al guardar los datos."]);
      setShowRejectionModal(true);
    } finally {
      setSaving(false);
    }
  };

  // Buscar nombre de especialidad principal
  const primarySpec = selectedSpecialties.find((s) => s.isPrimary);
  const primarySpecName = primarySpec
    ? specialtiesCatalog.find((c) => c.id === primarySpec.specialtyId)?.name || "Especialidad principal"
    : selectedSpecialties.length > 0
    ? specialtiesCatalog.find((c) => c.id === selectedSpecialties[0].specialtyId)?.name || "Sin marcar estrella"
    : "Ninguna seleccionada";

  return (
    <>
      <form onSubmit={handlePreSubmit} noValidate className="space-y-8">
        {/* 1. Información Personal */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-[#0F172A] font-serif flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Datos Personales y Contacto
            </h3>
            <p className="text-xs text-slate-500">
              Información de identidad y canales para coordinación directa con tus clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nombres <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
                placeholder="Carlos Alberto"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Apellidos <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
                placeholder="Ramos Silva"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Número Celular (Perú)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">+51</span>
                <input
                  type="text"
                  maxLength={9}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-slate-200 pl-12 pr-3.5 py-2.5 text-xs text-[#0F172A] font-mono focus:border-blue-600 focus:outline-none"
                  placeholder="987654321"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                9 dígitos. Se usará para notificaciones SMS y alertas de citas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ciudad / Departamento Sede <span className="text-rose-500">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
              >
                {PERU_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Credenciales Colegiadas (Solo lectura / Informativo) */}
        <div className="rounded-3xl border border-blue-200 bg-linear-to-r from-blue-50/50 to-white p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-900 font-mono uppercase">
                Credencial Colegiada Vinculada
              </span>
              <span className="rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-[9px] font-extrabold uppercase text-blue-800">
                {initialData.verificationStatus}
              </span>
            </div>
            <p className="text-sm font-bold text-[#0F172A] font-serif">
              {initialData.barAssociation} • Matrícula N.° {initialData.barNumber}
            </p>
            <p className="text-[11px] text-slate-500">
              Para modificar tu número de colegiatura o colegio profesional, visita{" "}
              <Link href="/lawyer/verification" className="text-blue-600 font-bold underline">
                Mi Colegiatura
              </Link>.
            </p>
          </div>
        </div>

        {/* 3. Perfil Profesional y Práctica */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-[#0F172A] font-serif flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Perfil Profesional y Metodología
            </h3>
            <p className="text-xs text-slate-500">
              Esta descripción y condiciones de atención se presentan al cliente en la postulación y emparejamiento.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Presentación Profesional / Biografía <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[10px] font-mono ${bio.trim().length < 30 ? "text-rose-500 font-bold" : "text-slate-400"}`}>
                  {bio.trim().length} / 30 caracteres mín.
                </span>
              </div>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`w-full rounded-2xl border p-3.5 text-xs text-[#0F172A] focus:outline-none leading-relaxed ${
                  bio.trim().length < 30 && bio.trim().length > 0
                    ? "border-rose-300 focus:border-rose-500"
                    : "border-slate-200 focus:border-blue-600"
                }`}
                placeholder="Describe tu trayectoria procesal, materias en las que destacas, enfoque ético y metodología de atención..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Años de Experiencia en Litigación / Asesoría <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={70}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tarifa Referencial de Consulta (Soles)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">S/.</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={consultationPrice || ""}
                    onChange={(e) =>
                      setConsultationPrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
                    placeholder="120"
                  />
                </div>
              </div>
            </div>

            {/* Modalidades de Atención */}
            <div className="pt-2 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Modalidades de Atención Habilitadas <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={virtualAttention}
                    onChange={(e) => setVirtualAttention(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Atención Virtual (Google Meet / Zoom)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={physicalAttention}
                    onChange={(e) => setPhysicalAttention(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Atención Presencial en Despacho</span>
                </label>
              </div>
            </div>

            {physicalAttention && (
              <div className="animate-in fade-in">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dirección de tu Despacho u Oficina <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <Building className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={addressOffice}
                    onChange={(e) => setAddressOffice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
                    placeholder="Av. Rivera Navarrete 501, San Isidro, Lima"
                  />
                </div>
              </div>
            )}

            {/* Estado de Disponibilidad */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0F172A] block">
                  Disponibilidad para recibir nuevos casos
                </span>
                <p className="text-[11px] text-slate-500">
                  Si desactivas esta opción, tu perfil no será sugerido en los nuevos matches.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 4. Especialidades Jurídicas */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-[#0F172A] font-serif">
              Especialidades Jurídicas de Práctica
            </h3>
            <p className="text-xs text-slate-500">
              Define tus materias de especialidad. La marcada con estrella ⭐ se utilizará como principal para ponderar los algoritmos de compatibilidad.
            </p>
          </div>

          <SpecialtySelector
            specialties={specialtiesCatalog}
            selected={selectedSpecialties}
            onChange={setSelectedSpecialties}
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/lawyer/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancelar</span>
          </Link>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>

      {/* ======================================================== */}
      {/* 1. TARJETA MODAL DE CONFIRMACIÓN DE CAMBIOS               */}
      {/* ======================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-6">
            <button
              onClick={() => setShowConfirmModal(false)}
              disabled={saving}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] font-serif">
                  Confirmar Actualización de Perfil
                </h3>
                <p className="text-xs text-slate-500">
                  Revisa el resumen de tus datos antes de aplicar los cambios en la plataforma.
                </p>
              </div>
            </div>

            {/* Resumen de cambios */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Abogado(a):</span>
                <span className="font-bold text-[#0F172A]">{firstName} {lastName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Celular de Contacto:</span>
                <span className="font-bold font-mono text-[#0F172A]">{phone ? `+51 ${phone}` : "No especificado"}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Sede Principal:</span>
                <span className="font-bold text-[#0F172A]">{city}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Experiencia / Tarifa:</span>
                <span className="font-bold text-[#0F172A]">
                  {yearsExperience} años • {consultationPrice ? `S/. ${consultationPrice} consulta` : "A convenir"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Modalidad:</span>
                <span className="font-bold text-[#0F172A]">
                  {virtualAttention && physicalAttention
                    ? "Virtual y Presencial"
                    : virtualAttention
                    ? "Virtual únicamente"
                    : "Presencial únicamente"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Especialidad Principal:</span>
                <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                  ⭐ {primarySpecName}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Al confirmar, tu perfil profesional y especialidades se sincronizarán en la base de datos de ALYA.
            </p>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Volver a Revisar
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Sí, Guardar Perfil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TARJETA MODAL DE RECHAZO / OBSERVACIONES             */}
      {/* ======================================================== */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-6">
            <button
              onClick={() => setShowRejectionModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] font-serif">
                  No se pudieron guardar los cambios
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Existen campos requeridos o inconsistencias en los datos ingresados:
                </p>
              </div>
            </div>

            {/* Lista detallada de motivos de rechazo */}
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 space-y-2">
              {rejectionReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-rose-900 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              Por favor corrige los puntos señalados para poder procesar la actualización de tu perfil.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowRejectionModal(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-6 py-2.5 text-xs font-bold text-white transition-colors"
              >
                Entendido, Corregir Datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TARJETA MODAL DE CONFIRMACIÓN DE ÉXITO                 */}
      {/* ======================================================== */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 text-center my-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#0F172A] font-serif">
                ¡Perfil Profesional Actualizado!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Tus datos de presentación, tarifas y especialidades jurídicas han sido registrados correctamente en ALYA LegalTech.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs text-emerald-800 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tus ponderaciones de compatibilidad ya se encuentran activas.</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Permanecer Aquí
              </button>

              <button
                type="button"
                onClick={() => router.push("/lawyer/dashboard")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white transition-colors shadow-md"
              >
                <span>Ir al Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
