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
  processCardConsultationPaymentAction,
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

  // Estados de Tarjeta de Crédito / Débito
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [docNumber, setDocNumber] = useState("");

  // Estados de Transferencia / Voucher (Yape / Plin / BCP)
  const [paymentMethod, setPaymentMethod] = useState<"yape" | "plin" | "bank_transfer">("yape");
  const [operationNumber, setOperationNumber] = useState("");
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);

  // Detección dinámica de marca de tarjeta
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s+/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "Mastercard";
    if (/^3[47]/.test(clean)) return "Amex";
    if (/^3[68]/.test(clean)) return "Diners";
    return "Card";
  };

  const handleCardNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
    if (errorMsg) setErrorMsg(null);
  };

  const handleExpiryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setExpiry(raw);
    if (errorMsg) setErrorMsg(null);
  };

  const handleCvvInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvv(raw);
    if (errorMsg) setErrorMsg(null);
  };

  // Procesamiento del pago con tarjeta
  const handleCardPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const cleanNum = cardNumber.replace(/\s+/g, "");
    if (cleanNum.length < 15) {
      setErrorMsg("Ingresa los 16 dígitos de tu tarjeta de crédito o débito.");
      return;
    }
    if (!cardHolder.trim() || cardHolder.trim().length < 3) {
      setErrorMsg("Ingresa el nombre del titular como figura en la tarjeta.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setErrorMsg("Ingresa una fecha de expiración válida (MM/AA).");
      return;
    }
    const [month] = expiry.split("/").map(Number);
    if (month < 1 || month > 12) {
      setErrorMsg("El mes de expiración debe estar entre 01 y 12.");
      return;
    }
    if (cvv.length < 3) {
      setErrorMsg("Ingresa el código de seguridad CVV (3 dígitos al reverso).");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await processCardConsultationPaymentAction({
        consultationId,
        cardNumber,
        cardHolder: cardHolder.trim().toUpperCase(),
        expiry,
        cvv,
        docNumber: docNumber.trim(),
      });

      if (res.success) {
        setSuccessMsg(
          `¡Pago aprobado con éxito! Autorización: ${res.authCode}. Fondos protegidos en custodia de garantía ALYA.`
        );
        if (onPaymentSuccess) onPaymentSuccess("held_escrow");
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setErrorMsg(res.error || "No se pudo procesar el pago con la tarjeta.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la transacción con la pasarela.");
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

  // Si no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-lg rounded-3xl bg-white border border-slate-200 text-[#0F172A] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
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
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Cerrar modal"
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
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              {/* Desglose de Tarifa */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-1.5">
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
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-[#0F172A]">
                  <span>Total a Pagar:</span>
                  <span className="text-base font-mono text-[#2563EB]">
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

              {/* TAB 1: Tarjeta de Crédito o Débito */}
              {activeTab === "card" ? (
                <form onSubmit={handleCardPayment} className="space-y-3.5">
                  {/* Tarjeta Visual Interactiva */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 p-4 text-white shadow-lg border border-slate-700/60 select-none">
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
                    <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col justify-between h-32">
                      <div className="flex items-center justify-between">
                        {/* Chip de seguridad */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-6 rounded-md bg-linear-to-tr from-amber-300 via-amber-200 to-amber-400 p-0.5 shadow-xs border border-amber-400/80 flex items-center justify-center">
                            <div className="w-full h-full border border-amber-600/30 rounded-xs flex flex-col justify-around py-0.5 px-1">
                              <div className="w-full h-[1px] bg-amber-700/30" />
                              <div className="w-full h-[1px] bg-amber-700/30" />
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-300 font-mono tracking-wider">CHIP SEGURO</span>
                        </div>
                        {/* Marca detectada */}
                        <div className="px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-xs border border-white/15 text-xs font-bold tracking-wider uppercase text-blue-200">
                          {getCardBrand(cardNumber)}
                        </div>
                      </div>

                      {/* Número de Tarjeta */}
                      <div className="font-mono text-base tracking-widest font-semibold text-slate-100">
                        {cardNumber ? cardNumber : "•••• •••• •••• ••••"}
                      </div>

                      {/* Datos inferiores */}
                      <div className="flex items-end justify-between text-[11px]">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Titular</p>
                          <p className="font-semibold tracking-wide text-slate-100 truncate max-w-[200px]">
                            {cardHolder ? cardHolder.toUpperCase() : "NOMBRE Y APELLIDO"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Expira</p>
                          <p className="font-mono font-semibold text-slate-100">
                            {expiry ? expiry : "MM/AA"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Campos del Formulario */}
                  <div className="space-y-3">
                    {/* Número de Tarjeta */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Número de Tarjeta (Débito o Crédito)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardNumber}
                          onChange={handleCardNumberInput}
                          placeholder="4000 1234 5678 9010"
                          maxLength={19}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-16 py-2 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <span className="absolute right-3 top-2 text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {getCardBrand(cardNumber)}
                        </span>
                      </div>
                    </div>

                    {/* Nombre del Titular */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre del Titular de la Tarjeta
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => {
                          setCardHolder(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="Como figura impreso en el plástico"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs uppercase font-medium text-slate-900 placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Vencimiento y CVV */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Vencimiento (MM/AA)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={expiry}
                          onChange={handleExpiryInput}
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-center font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Código CVV
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            inputMode="numeric"
                            value={cvv}
                            onChange={handleCvvInput}
                            placeholder="•••"
                            maxLength={4}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-center font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                        </div>
                      </div>
                    </div>

                    {/* Documento DNI */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        DNI / Documento de Identidad del Titular
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={docNumber}
                        onChange={(e) => {
                          setDocNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="DNI del titular para comprobante"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Certificado de seguridad */}
                  <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-3 text-xs text-slate-700 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px]">
                      Conexión encriptada SSL de 256 bits y tokenización PCI-DSS. Los fondos quedan asegurados en garantía de custodia ALYA Escrow hasta la conclusión de tu asesoría.
                    </p>
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
                    className="w-full py-3.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Procesando pago seguro con tarjeta...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span>Pagar S/ {Number(agreedPrice).toFixed(2)} con Tarjeta Segura</span>
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                      </>
                    )}
                  </button>
                </form>
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
