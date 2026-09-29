"use client";

import { useState } from "react";
import { submitClientOnboarding } from "@/actions/onboarding.actions";
import { User, Phone, MapPin, ArrowRight, Loader2, FileText, AlertCircle } from "lucide-react";

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

interface ClientOnboardingFormProps {
  initialData?: {
    firstName?: string;
    lastName?: string;
    city?: string;
  };
}

export function ClientOnboardingForm({ initialData }: ClientOnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(initialData?.firstName || "");
  const [lastName, setLastName] = useState(initialData?.lastName || "");
  const [phone, setPhone] = useState("");
  const [documentType, setDocumentType] = useState<"DNI" | "CE" | "PASAPORTE">("DNI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [city, setCity] = useState(initialData?.city || "Lima");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!/^9\d{8}$/.test(phone)) {
      setErrorMessage("Por favor ingresa un número de celular peruano válido (9 dígitos comenzando con 9).");
      return;
    }

    if (documentNumber.length < 8) {
      setErrorMessage("Por favor ingresa un número de documento válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitClientOnboarding({
        firstName,
        lastName,
        phone,
        documentType,
        documentNumber,
        city,
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
    <div className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-[#2563EB] mb-1 font-mono">
          <User className="w-4 h-4 text-[#2563EB]" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Bienvenido a ALYA
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#0F172A] font-serif">
          Completa tus datos personales
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Esta información permitirá contactarte cuando encuentres un abogado compatible.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs text-[#0F172A] flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-slate-700 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombres <span className="text-[#2563EB]">*</span>
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Juan"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Apellidos <span className="text-[#2563EB]">*</span>
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Pérez García"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo Doc.
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
            >
              <option value="DNI">DNI</option>
              <option value="CE">C.E.</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Número de Documento <span className="text-[#2563EB]">*</span>
            </label>
            <input
              type="text"
              required
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="45678901"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm font-mono text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Teléfono Móvil (WhatsApp) <span className="text-[#2563EB]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-mono text-slate-400">
              +51
            </span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              placeholder="987654321"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-3 py-2 text-sm font-mono text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Protegido. Solo se comparte cuando confirmes un match bilateral.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Ciudad / Departamento <span className="text-[#2563EB]">*</span>
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
          >
            {PERU_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] py-3 text-sm font-bold text-white transition-all shadow-md shadow-slate-900/10 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                Guardando datos...
              </>
            ) : (
              <>
                Continuar a mi Panel
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
