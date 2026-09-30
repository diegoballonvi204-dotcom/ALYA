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
  Loader2,
  ShieldCheck,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

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
  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [phone, setPhone] = useState(initialData.phone);
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

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

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

      if (res.success) {
        setSuccessMessage(res.message || "Tu perfil ha sido actualizado exitosamente.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErrorMessage(res.error || "Ocurrió un error al guardar los cambios.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al actualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Toast de Éxito o Error */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Información Personal */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-[#0F172A] font-serif flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Datos Personales
          </h3>
          <p className="text-xs text-slate-500">
            Información que identifica tu cuenta en la plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombres</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Apellidos</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Número Celular (Perú)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">+51</span>
              <input
                type="tel"
                required
                maxLength={9}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-12 pr-3.5 py-2.5 text-xs text-[#0F172A] font-mono focus:border-blue-600 focus:outline-none"
                placeholder="987654321"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ciudad / Departamento Sede
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
            Para modificar tu número de matrícula o colegio, es necesario cursar una solicitud formal en{" "}
            <Link href="/lawyer/verification" className="text-blue-600 font-bold underline">
              Mi Colegiatura
            </Link>.
          </p>
        </div>
      </div>

      {/* 3. Perfil Profesional y Presentación */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-[#0F172A] font-serif flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            Perfil Profesional y Práctica
          </h3>
          <p className="text-xs text-slate-500">
            Esta información se muestra a los clientes al postular a casos y formalizar matches.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Presentación Profesional / Biografía
            </label>
            <textarea
              rows={4}
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none leading-relaxed"
              placeholder="Describe tu trayectoria procesal, casos emblemáticos, enfoque ético y metodología de atención..."
            />
            <span className="text-[10px] text-slate-400">
              {bio.length} caracteres (mínimo 30)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Años de Experiencia en Litigación
              </label>
              <input
                type="number"
                min={0}
                max={70}
                required
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
                  min={30}
                  step={10}
                  value={consultationPrice || ""}
                  onChange={(e) =>
                    setConsultationPrice(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          {/* Modalidades de Atención */}
          <div className="pt-2 space-y-3">
            <label className="block text-xs font-bold text-slate-700">Modalidades de Atención</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={virtualAttention}
                  onChange={(e) => setVirtualAttention(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Atención Virtual (Google Meet / Zoom)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={physicalAttention}
                  onChange={(e) => setPhysicalAttention(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Atención Presencial en Despacho</span>
              </label>
            </div>
          </div>

          {physicalAttention && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Dirección del Despacho u Oficina
              </label>
              <input
                type="text"
                value={addressOffice}
                onChange={(e) => setAddressOffice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
                placeholder="Av. Javier Prado Este 1234, Of. 501, San Isidro, Lima"
              />
            </div>
          )}

          {/* Estado de Disponibilidad */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
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
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? "Guardando Cambios..." : "Guardar Cambios"}</span>
        </button>
      </div>
    </form>
  );
}
