"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  ShieldCheck,
  Lock,
  FileCheck2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Scale,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitArcoRequestAction } from "@/actions/arco.actions";

interface ArcoPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userDefaultName?: string;
  userDefaultEmail?: string;
}

export function ArcoPortalModal({
  isOpen,
  onClose,
  userDefaultName = "",
  userDefaultEmail = "",
}: ArcoPortalModalProps) {
  const [requestType, setRequestType] = useState<
    "access" | "rectification" | "cancellation" | "opposition"
  >("access");
  const [requesterName, setRequesterName] = useState(userDefaultName);
  const [requesterDni, setRequesterDni] = useState("");
  const [requesterEmail, setRequesterEmail] = useState(userDefaultEmail);
  const [justification, setJustification] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (requesterDni.trim().length < 8) {
      setErrorMsg("Ingresa un número de DNI o documento de identidad válido.");
      return;
    }

    if (!justification.trim() || justification.trim().length < 15) {
      setErrorMsg("Por favor describe con mayor detalle el motivo de tu solicitud (mín. 15 caracteres).");
      return;
    }

    startTransition(async () => {
      const res = await submitArcoRequestAction({
        requestType,
        requesterName: requesterName.trim(),
        requesterDni: requesterDni.trim(),
        requesterEmail: requesterEmail.trim(),
        justification: justification.trim(),
      });

      if (res.success && res.request) {
        setSubmittedRequest(res.request);
      } else {
        setErrorMsg(res.error || "No se pudo registrar la solicitud.");
      }
    });
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "access":
        return "Acceso a Datos Personales (Art. 19 LPDP)";
      case "rectification":
        return "Rectificación o Actualización (Art. 20 LPDP)";
      case "cancellation":
        return "Cancelación o Supresión (Art. 21 LPDP)";
      case "opposition":
        return "Oposición al Tratamiento (Art. 22 LPDP)";
      default:
        return type;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto text-[#0F172A]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 my-8"
        >
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#0F172A]">
                  Portal de Derechos ARCO • Ley N.° 29733
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Autoridad Nacional de Protección de Datos Personales (ANPD)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {submittedRequest ? (
            /* Confirmación y Constancia Legal de Trámite */
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
                  Solicitud Registrada Oficialmente
                </span>
                <h4 className="text-xl font-bold font-serif text-[#0F172A] mt-1">
                  Constancia de Recepción de Ejercicio de Derecho ARCO
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Tu requerimiento ha sido ingresado al libro de reclamos y auditoría de la plataforma.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Expediente ARCO N.°:</span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {submittedRequest.id.substring(0, 13).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Derecho Ejercido:</span>
                  <span className="font-semibold text-[#0F172A]">
                    {getTypeName(submittedRequest.request_type)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Titular Solicitante:</span>
                  <span className="font-semibold text-[#0F172A]">
                    {submittedRequest.requester_name} (DNI: {submittedRequest.requester_dni})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Plazo Máximo de Respuesta (Ley 29733):</span>
                  <span className="font-mono font-bold text-blue-700">
                    {new Date(submittedRequest.deadline_at).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Cerrar y Regresar
              </button>
            </div>
          ) : (
            /* Formulario */
            <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
              {/* Selector de Derecho ARCO */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-2">
                  Selecciona el Derecho que deseas ejercer *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: "access", label: "Acceso", desc: "Ver mis datos" },
                    { id: "rectification", label: "Rectificación", desc: "Corregir errores" },
                    { id: "cancellation", label: "Cancelación", desc: "Suprimir registro" },
                    { id: "opposition", label: "Oposición", desc: "Fines comerciales" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setRequestType(d.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        requestType === d.id
                          ? "border-[#2563EB] bg-blue-50/50 text-[#0F172A] shadow-xs"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="font-bold">{d.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Datos Personales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                    Nombres y Apellidos *
                  </label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-xs text-[#0F172A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                    DNI o Carné de Extranjería *
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={requesterDni}
                    onChange={(e) => setRequesterDni(e.target.value)}
                    placeholder="8 dígitos"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-xs font-mono font-bold text-[#0F172A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                  Correo Electrónico de Contacto *
                </label>
                <input
                  type="email"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-xs text-[#0F172A] outline-none"
                />
              </div>

              {/* Justificación */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                  Fundamento o Petitorio Concreto *
                </label>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Detalla qué información requieres acceder, qué dato corregir o la causa de tu oposición..."
                  required
                  className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-xs text-[#0F172A] outline-none resize-none leading-relaxed"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Conforme al D.S. N.° 003-2013-JUS, el plazo de resolución es de 10 días hábiles (20 días para Acceso).
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Ingresando Solicitud...</span>
                    </>
                  ) : (
                    <span>Presentar Solicitud Legal ARCO</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
