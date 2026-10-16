"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Upload,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  createConsultationCheckoutAction,
  confirmSimulatedConsultationPaymentAction,
  submitConsultationVoucherAction,
} from "@/actions/schedule.actions";

interface ConsultationPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string;
  agreedPrice: number;
  lawyerName: string;
  caseTitle?: string;
  onPaymentSuccess?: (status?: string) => void;
}

export function ConsultationPaymentModal({
  isOpen,
  onClose,
  consultationId,
  agreedPrice,
  lawyerName,
  caseTitle = "Caso Legal",
  onPaymentSuccess,
}: ConsultationPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<"card" | "yape">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados de Yape/Plin
  const [paymentMethod, setPaymentMethod] = useState<"yape" | "plin" | "bank_transfer">("yape");
  const [operationNumber, setOperationNumber] = useState("");
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCardPayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await createConsultationCheckoutAction(consultationId);

      if (!res.success) {
        setErrorMsg(res.error || "No se pudo iniciar el checkout.");
        setIsProcessing(false);
        return;
      }

      if (res.isSimulation) {
        // En desarrollo o sin credenciales activas de MP, simular confirmación
        const simRes = await confirmSimulatedConsultationPaymentAction(consultationId);
        if (simRes.success) {
          setSuccessMsg("¡Pago en custodia asegurado exitosamente! Tu consulta está lista.");
          if (onPaymentSuccess) onPaymentSuccess("held_escrow");
          setTimeout(() => {
            onClose();
          }, 2200);
        } else {
          setErrorMsg(simRes.error || "Error al registrar pago simulado.");
        }
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar pago");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg("El archivo no debe exceder 8MB");
        return;
      }
      setVoucherFile(file);
      setVoucherPreview(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operationNumber.trim() || operationNumber.trim().length < 4) {
      setErrorMsg("Ingresa un número de operación válido (mínimo 4 dígitos).");
      return;
    }
    if (!voucherFile) {
      setErrorMsg("Por favor adjunta la captura o constancia de pago.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const ext = voucherFile.name.split(".").pop();
      const filePath = `consultations/${consultationId}/${Date.now()}_voucher.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("case-documents")
        .upload(filePath, voucherFile, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: signed } = await supabase.storage
        .from("case-documents")
        .createSignedUrl(filePath, 86400 * 30); // 30 días de acceso

      const res = await submitConsultationVoucherAction({
        consultationId,
        paymentMethod,
        operationNumber: operationNumber.trim(),
        voucherUrl: signed?.signedUrl || filePath,
      });

      if (res.success) {
        setSuccessMsg("¡Comprobante verificado! Fondos protegidos en custodia ALYA.");
        if (onPaymentSuccess) onPaymentSuccess("held_escrow");
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setErrorMsg(res.error || "Error al registrar constancia");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al subir comprobante");
    } finally {
      setIsProcessing(false);
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-lg rounded-3xl bg-white border border-slate-200 text-[#0F172A] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-linear-to-b from-slate-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shadow-2xs">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A] font-serif">
                  Abono de Honorarios en Custodia
                </h3>
                <p className="text-xs text-slate-500">
                  Consulta con {lawyerName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Banner */}
          {successMsg ? (
            <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-lg font-bold text-[#0F172A] font-serif">
                ¡Honorarios Asegurados en Custodia!
              </h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                {successMsg}
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              {/* Desglose de Tarifa */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Materia del Caso:</span>
                  <strong className="text-slate-900 font-medium truncate max-w-[200px]">
                    {caseTitle}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Asesoría Legal Colegiada (45 min):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    S/ {Number(agreedPrice).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Comisión de Custodia ALYA:</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    S/ 0.00 (Gratis)
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-[#0F172A]">
                  <span>Total a Pagar:</span>
                  <span className="text-lg font-mono text-[#2563EB]">
                    S/ {Number(agreedPrice).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Selector de Pestañas: Tarjeta vs Yape/Plin */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("card")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === "card"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#2563EB]" />
                  <span>Tarjeta (Mercado Pago)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("yape")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === "yape"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <QrCode className="w-4 h-4 text-purple-600" />
                  <span>Yape / Plin / BCP</span>
                </button>
              </div>

              {/* TAB 1: Tarjeta con Mercado Pago */}
              {activeTab === "card" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-3.5 text-xs text-slate-700 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Paga de forma inmediata con cualquier tarjeta de crédito o débito Visa, Mastercard o Diners mediante la pasarela segura de Mercado Pago.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCardPayment}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Conectando con pasarela segura...</span>
                      </>
                    ) : (
                      <>
                        <span>Pagar S/ {Number(agreedPrice).toFixed(2)} con Tarjeta</span>
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* TAB 2: Yape / Plin / BCP */
                <form onSubmit={handleVoucherSubmit} className="space-y-4">
                  <div className="flex items-center gap-2">
                    {(["yape", "plin", "bank_transfer"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-all cursor-pointer ${
                          paymentMethod === method
                            ? "bg-purple-50 border-purple-300 text-purple-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {method === "bank_transfer" ? "BCP Transferencia" : method}
                      </button>
                    ))}
                  </div>

                  {/* QR Box & Coordenadas de Pago */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                      <QrCode className="w-12 h-12 text-slate-800" />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-900">
                        {paymentMethod === "yape"
                          ? "Yape Oficial ALYA Perú"
                          : paymentMethod === "plin"
                          ? "Plin Oficial ALYA Perú"
                          : "Cuenta Corriente BCP"}
                      </p>
                      <p className="font-mono text-purple-700 font-bold text-sm">
                        {paymentMethod === "bank_transfer"
                          ? "193-98214587-0-12"
                          : "987 654 321"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Titular: ALYA LegalTech SAC (RUC 20608974512)
                      </p>
                    </div>
                  </div>

                  {/* Número de Operación */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Número de Operación (Yape / Plin / BCP):
                    </label>
                    <input
                      type="text"
                      value={operationNumber}
                      onChange={(e) => setOperationNumber(e.target.value)}
                      placeholder="Ej. 845210"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Subida de Voucher */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adjuntar Captura del Comprobante:
                    </label>
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-3 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 truncate max-w-[240px]">
                        {voucherFile ? voucherFile.name : "Subir imagen (JPG, PNG)"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span>Verificando comprobante...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirmar Abono en Custodia</span>
                        <ArrowRight className="w-4 h-4 text-purple-400" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Mensaje de Garantía Escrow */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Garantía de Custodia ALYA:</strong> Tu dinero se mantiene retenido y seguro. Solo será liberado al abogado una vez concluida tu asesoría legal.
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
