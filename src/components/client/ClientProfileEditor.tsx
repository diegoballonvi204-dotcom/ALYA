"use client";

import { useState } from "react";
import { updateClientProfileAction } from "@/actions/profile.actions";
import {
  User,
  Phone,
  MapPin,
  FileText,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
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

interface ClientProfileEditorProps {
  initialData: {
    firstName: string;
    lastName: string;
    phone: string;
    documentType: "DNI" | "CE" | "PASAPORTE";
    documentNumber: string;
    city: string;
    email: string;
  };
}

export default function ClientProfileEditor({ initialData }: ClientProfileEditorProps) {
  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [phone, setPhone] = useState(initialData.phone);
  const [documentType, setDocumentType] = useState<"DNI" | "CE" | "PASAPORTE">(
    initialData.documentType || "DNI"
  );
  const [documentNumber, setDocumentNumber] = useState(initialData.documentNumber);
  const [city, setCity] = useState(initialData.city || "Lima");

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await updateClientProfileAction({
        firstName,
        lastName,
        phone,
        documentType,
        documentNumber,
        city,
      });

      if (res.success) {
        setSuccessMessage(res.message || "Tus datos han sido actualizados exitosamente.");
      } else {
        setErrorMessage(res.error || "Ocurrió un error al actualizar los datos.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al actualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-[#0F172A] font-serif flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Información de Contacto y Titularidad
          </h3>
          <p className="text-xs text-slate-500">
            Tus datos están protegidos bajo la Ley N.° 29733 de Protección de Datos Personales.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombres Completos</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Apellidos Completos</label>
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
              Tipo de Documento
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
            >
              <option value="DNI">DNI (Documento Nacional de Identidad)</option>
              <option value="CE">Carné de Extranjería (CE)</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Número de Documento
            </label>
            <input
              type="text"
              required
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] font-mono focus:border-blue-600 focus:outline-none"
              placeholder="72849102"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Número Celular de Contacto (Perú)
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
              Ciudad / Departamento
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

        {/* Correo Electrónico (Solo Lectura) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Correo registrado: <strong>{initialData.email}</strong></span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Autenticado vía Supabase</span>
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Panel</span>
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
          <span>{saving ? "Guardando..." : "Actualizar Datos"}</span>
        </button>
      </div>
    </form>
  );
}
