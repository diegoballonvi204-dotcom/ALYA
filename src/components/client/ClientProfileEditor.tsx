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
  AlertTriangle,
  Loader2,
  Save,
  ArrowLeft,
  X,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
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
  const router = useRouter();

  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [phone, setPhone] = useState(initialData.phone || "");
  const [documentType, setDocumentType] = useState<"DNI" | "CE" | "PASAPORTE">(
    initialData.documentType || "DNI"
  );
  const [documentNumber, setDocumentNumber] = useState(initialData.documentNumber || "");
  const [city, setCity] = useState(initialData.city || "Lima");

  // Modales de Confirmación y Rechazo
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Validación previa
  const validateForm = (): string[] => {
    const reasons: string[] = [];

    if (!firstName.trim()) {
      reasons.push("Debes ingresar tus nombres completos.");
    }
    if (!lastName.trim()) {
      reasons.push("Debes ingresar tus apellidos completos.");
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      reasons.push("El número celular de contacto es obligatorio.");
    } else if (!/^9\d{8}$/.test(cleanPhone)) {
      reasons.push("El número celular debe ser un celular peruano válido (9 dígitos comenzando con 9).");
    }

    if (!documentNumber.trim()) {
      reasons.push("Debes ingresar tu número de documento de identidad.");
    } else if (documentType === "DNI" && !/^\d{8}$/.test(documentNumber.trim())) {
      reasons.push("El DNI debe contener exactamente 8 dígitos numéricos.");
    }

    return reasons;
  };

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

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const res = await updateClientProfileAction({
        firstName,
        lastName,
        phone,
        documentType,
        documentNumber,
        city,
      });

      setShowConfirmModal(false);

      if (res.success) {
        setShowSuccessModal(true);
      } else {
        setRejectionReasons([res.error || "Ocurrió un error al actualizar los datos."]);
        setShowRejectionModal(true);
      }
    } catch (err: any) {
      setShowConfirmModal(false);
      setRejectionReasons([err.message || "Error de conexión al procesar los cambios."]);
      setShowRejectionModal(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handlePreSubmit} noValidate className="space-y-6">
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nombres Completos <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
                placeholder="Juan"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Apellidos Completos <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-blue-600 focus:outline-none"
                placeholder="Pérez García"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tipo de Documento <span className="text-rose-500">*</span>
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
                Número de Documento <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={15}
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value.trim())}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-[#0F172A] font-mono focus:border-blue-600 focus:outline-none"
                placeholder="72849102"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Número Celular de Contacto (Perú) <span className="text-rose-500">*</span>
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
                Necesario para coordinar citas y recibir alertas sobre tus casos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ciudad / Departamento <span className="text-rose-500">*</span>
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
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Actualizar Datos</span>
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
                  Verifica que tus datos personales sean correctos.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Titular:</span>
                <span className="font-bold text-[#0F172A]">{firstName} {lastName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Documento:</span>
                <span className="font-bold font-mono text-[#0F172A]">{documentType} {documentNumber}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Celular:</span>
                <span className="font-bold font-mono text-[#0F172A]">+51 {phone}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Ciudad:</span>
                <span className="font-bold text-[#0F172A]">{city}</span>
              </div>
            </div>

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
                  Revisa los siguientes campos antes de continuar:
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 space-y-2">
              {rejectionReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-rose-900 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>

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
                ¡Perfil Actualizado!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Tus datos personales y canales de contacto han sido registrados correctamente en ALYA LegalTech.
              </p>
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
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white transition-colors shadow-md"
              >
                <span>Ir al Panel Principal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
