"use client";

import { useState } from "react";
import { resolveVerificationAdminAction } from "@/actions/verification.actions";
import { ShieldCheck, AlertCircle, XCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface VerificationDecisionModalProps {
  verificationId: string;
  lawyerName: string;
  barNumber: string;
  currentStatus: string;
}

export default function VerificationDecisionModal({
  verificationId,
  lawyerName,
  barNumber,
  currentStatus,
}: VerificationDecisionModalProps) {
  const router = useRouter();

  const [modalType, setModalType] = useState<"approve" | "observe" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const OBSERVATION_PRESETS = [
    "Carné de colegiatura borroso o ilegible. Se requiere fotografía nítida.",
    "Matrícula no figura como habilitada en la consulta web del Colegio de Abogados.",
    "DNI no coincide con los datos del profesional consignados en la matrícula.",
    "Documento de identidad cortado o vencido. Adjuntar copia legible.",
  ];

  const handleDecision = async (decision: "verified" | "observed" | "rejected") => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await resolveVerificationAdminAction({
        verificationId,
        decision,
        rejectionReason: reason || null,
        adminNotes: adminNotes || null,
      });

      if (res?.error) {
        setErrorMsg(res.error);
        setLoading(false);
      } else {
        setModalType(null);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar el dictamen.");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setModalType("approve")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20"
        >
          <ShieldCheck className="w-4 h-4" />
          Aprobar y Habilitar
        </button>

        <button
          type="button"
          onClick={() => setModalType("observe")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-all"
        >
          <AlertCircle className="w-4 h-4 text-blue-600" />
          Observar Expediente
        </button>

        <button
          type="button"
          onClick={() => setModalType("reject")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
        >
          <XCircle className="w-4 h-4 text-slate-500" />
          Denegar Solicitud
        </button>
      </div>

      {/* Decision Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 text-[#0F172A]">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0F172A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 p-3 text-xs text-slate-800 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-slate-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Modal Content depending on Type */}
            {modalType === "approve" && (
              <div>
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-base mb-1 font-serif">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Confirmar Aprobación de Colegiatura
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ¿Confirmas que la matrícula <strong>{barNumber}</strong> del abogado{" "}
                  <strong>{lawyerName}</strong> ha sido verificada y se encuentra debidamente habilitada en su respectivo Colegio de Abogados?
                </p>
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
                  ✓ El perfil lucirá la insignia de verificación oficial.
                  <br />✓ El profesional será recomendado de inmediato en el motor de matching.
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDecision("verified")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-sm"
                  >
                    {loading ? "Procesando..." : "Confirmar Aprobación"}
                  </button>
                </div>
              </div>
            )}

            {modalType === "observe" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-base font-serif">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  Emitir Observación de Expediente
                </div>
                <p className="text-xs text-slate-600">
                  Selecciona o redacta el motivo de la observación. Se le notificará al profesional para que corrija sus archivos:
                </p>

                {/* Motivos sugeridos */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Motivos frecuentes:
                  </label>
                  {OBSERVATION_PRESETS.map((p, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setReason(p)}
                      className="block w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                    >
                      • {p}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detalle de la Observación *
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe con precisión qué debe corregir el abogado..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading || !reason.trim()}
                    onClick={() => handleDecision("observed")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                  >
                    {loading ? "Enviando..." : "Emitir Observación"}
                  </button>
                </div>
              </div>
            )}

            {modalType === "reject" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-serif">
                  <XCircle className="w-5 h-5 text-slate-600" />
                  Denegar Solicitud de Verificación
                </div>
                <p className="text-xs text-slate-600">
                  Esta acción inhabilitará la verificación del profesional. Indica el motivo formal de la denegatoria:
                </p>

                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motivo formal de la denegatoria (ej. Información incompatible con el padrón oficial)..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none"
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading || !reason.trim()}
                    onClick={() => handleDecision("rejected")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                  >
                    {loading ? "Denegando..." : "Confirmar Denegatoria"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
