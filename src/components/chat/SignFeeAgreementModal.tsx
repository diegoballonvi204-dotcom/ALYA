"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileCheck2,
  Scale,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  Download,
  Award,
} from "lucide-react";
import { signFeeAgreementAction } from "@/actions/agreements.actions";

export interface FeeAgreementData {
  id: string;
  case_id: string;
  lawyer_id: string;
  client_id: string;
  title: string;
  scope_description: string;
  stages: Array<{ title: string; price: number; description?: string }> | any;
  fixed_fee: number;
  success_fee_percentage?: number | null;
  expenses_terms: string;
  status: "draft" | "pending_client_signature" | "signed" | "rejected" | "cancelled" | string;
  lawyer_signed_at?: string | null;
  client_signed_at?: string | null;
  client_full_name?: string | null;
  client_dni?: string | null;
  client_ip?: string | null;
  agreement_hash?: string | null;
  created_at: string;
  lawyerName?: string;
  lawyerBarAssociation?: string;
  lawyerBarNumber?: string;
}

interface SignFeeAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: FeeAgreementData;
  isClient: boolean;
  onAgreementSigned?: (hash: string) => void;
}

export function SignFeeAgreementModal({
  isOpen,
  onClose,
  agreement,
  isClient,
  onAgreementSigned,
}: SignFeeAgreementModalProps) {
  const [clientFullName, setClientFullName] = useState(agreement.client_full_name || "");
  const [clientDni, setClientDni] = useState(agreement.client_dni || "");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successHash, setSuccessHash] = useState<string | null>(agreement.agreement_hash || null);

  if (!isOpen) return null;

  const isAlreadySigned = agreement.status === "signed";
  const stagesList = Array.isArray(agreement.stages) ? agreement.stages : [];

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFullName.trim()) {
      setErrorMsg("Ingresa tus nombres y apellidos completos como firmante.");
      return;
    }
    if (!clientDni.trim() || clientDni.trim().length < 8) {
      setErrorMsg("Ingresa un número de documento de identidad (DNI/CE) válido.");
      return;
    }
    if (!acceptTerms) {
      setErrorMsg("Debes aceptar expresamente los términos del convenio legal.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await signFeeAgreementAction({
      agreementId: agreement.id,
      clientFullName: clientFullName.trim(),
      clientDni: clientDni.trim(),
      acceptTerms,
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessHash(res.agreementHash || "HASH-VERIFIED");
      if (onAgreementSigned && res.agreementHash) {
        onAgreementSigned(res.agreementHash);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative z-10 w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 text-[#0F172A] shadow-2xl overflow-hidden font-sans"
        >
          {/* Header */}
          <header className="px-6 py-5 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif">
                  Convenio de Honorarios Profesionales / Hoja de Encargo
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Sujeto al Art. 1764 del Código Civil Peruano y la Ley N.° 27269 de Firmas Digitales
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Modal Body / Legal Document */}
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1 text-slate-800 text-xs leading-relaxed">
            {/* Success Banner if Signed */}
            {(isAlreadySigned || successHash) && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Convenio Firmado y Perfeccionado Bilateralmente</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Este contrato cuenta con plena validez probatoria. Una copia digital inmutable ha sido archivada automáticamente en la Bóveda Documental del expediente.
                </p>
                {successHash && (
                  <div className="text-[11px] font-mono text-emerald-800 bg-emerald-100/60 p-2 rounded-lg border border-emerald-300/50 break-all">
                    <strong>Hash SHA-256 de Inmutabilidad:</strong> {successHash}
                  </div>
                )}
              </div>
            )}

            {/* Document Content Paper */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-5 font-serif text-slate-900">
              <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#2563EB] font-bold">
                  CONVENIO PRIVADO DE PRESTACIÓN DE SERVICIOS LEGALES
                </span>
                <h2 className="text-lg font-bold font-serif text-[#0F172A]">
                  {agreement.title}
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Fecha de propuesta: {new Date(agreement.created_at).toLocaleDateString("es-PE", { dateStyle: "long" })}
                </p>
              </div>

              {/* Cláusula Primera: Partes */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                  Cláusula Primera: De las Partes Intervinientes
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  Conste por el presente documento el Convenio de Honorarios Profesionales y Hoja de Encargo que celebran de una parte el <strong>Abogado Patrocinante</strong> debidamente acreditado ante el Colegio de Abogados ({agreement.lawyerBarAssociation || "CAL"} Matrícula {agreement.lawyerBarNumber || "Habilitado"}), y de otra parte el <strong>Cliente</strong>, quienes convienen de mutuo acuerdo las siguientes cláusulas y condiciones.
                </p>
              </div>

              {/* Cláusula Segunda: Objeto y Alcance */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                  Cláusula Segunda: Objeto y Alcance del Patrocinio
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line bg-white p-3.5 rounded-xl border border-slate-200">
                  {agreement.scope_description}
                </p>
              </div>

              {/* Cláusula Tercera: Retribución Económica (Honorarios) */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                  Cláusula Tercera: Honorarios Profesionales
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  Conforme al Art. 1764 del Código Civil Peruano, por los servicios de patrocinio descritos, el Cliente conviene en abonar al Abogado la suma de:
                </p>

                <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 font-sans">
                  <div>
                    <span className="text-xs text-slate-500 block">Honorario Fijo Base</span>
                    <span className="text-xl font-bold text-[#0F172A] font-serif">
                      S/ {Number(agreement.fixed_fee).toFixed(2)} PEN
                    </span>
                  </div>

                  {agreement.success_fee_percentage && (
                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-xs text-slate-500 block">Cuota Litis (Éxito)</span>
                      <span className="text-base font-bold text-emerald-700">
                        {agreement.success_fee_percentage}% del resultado
                      </span>
                    </div>
                  )}
                </div>

                {stagesList.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-600 font-sans block">
                      Desglose por Hitos Procesales:
                    </span>
                    <div className="space-y-1 font-sans">
                      {stagesList.map((stage: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                        >
                          <span className="text-slate-800">{stage.title}</span>
                          <span className="font-mono font-bold text-slate-900">
                            S/ {Number(stage.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cláusula Cuarta: Gastos y Aranceles Judiciales */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                  Cláusula Cuarta: Gastos Procesales y Tasas
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {agreement.expenses_terms}
                </p>
              </div>

              {/* Cláusula Quinta: Confidencialidad y Secreto Profesional */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                  Cláusula Quinta: Confidencialidad y Deber Deontológico
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  Toda la información y documentación compartida goza de la protección del secreto profesional consagrado en el Art. 13 del Código de Ética del Abogado del Perú y la Ley N.° 29733 de Protección de Datos Personales.
                </p>
              </div>
            </div>

            {/* Formulario de Firma si está pendiente y es el cliente */}
            {!isAlreadySigned && !successHash && isClient && (
              <form onSubmit={handleSign} className="p-6 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A] font-serif">
                  <FileCheck2 className="w-5 h-5 text-[#2563EB]" />
                  <span>Aceptación y Firma Electrónica del Cliente</span>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 font-sans">
                      Nombres y Apellidos Completos
                    </label>
                    <input
                      type="text"
                      required
                      value={clientFullName}
                      onChange={(e) => setClientFullName(e.target.value)}
                      placeholder="Ej. Juan Carlos Pérez Gómez"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 font-sans">
                      Documento de Identidad (DNI / CE)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={clientDni}
                      onChange={(e) => setClientDni(e.target.value)}
                      placeholder="Ej. 45892104"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 leading-snug font-sans">
                    He leído, comprendido y acepto expresamente los términos de esta Hoja de Encargo y Convenio de Honorarios conforme al <strong>Art. 1764 del Código Civil Peruano</strong>, autorizando el registro de mi firma electrónica bajo la <strong>Ley N.° 27269</strong>.
                  </span>
                </label>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !acceptTerms}
                    className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Validando Firma Criptográfica...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Firmar Electrónicamente Convenio</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {!isAlreadySigned && !successHash && !isClient && (
              <div className="p-4 rounded-xl bg-slate-100 text-slate-700 text-xs text-center font-medium">
                Propuesta de convenio emitida para revisión y firma del cliente. Se notificará en este chat una vez firmado.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
