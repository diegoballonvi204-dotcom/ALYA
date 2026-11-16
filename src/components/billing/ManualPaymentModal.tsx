"use client";

import { useState, useEffect } from "react";
import {
  X,
  QrCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  submitManualPaymentVoucherAction,
  processCardSubscriptionPaymentAction,
} from "@/actions/billing.actions";

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanId?: string;
  initialTab?: "card" | "transfer";
}

export default function ManualPaymentModal({
  isOpen,
  onClose,
  initialPlanId = "pro_annual",
  initialTab = "card",
}: ManualPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<"card" | "transfer">(initialTab);
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [paymentMethod, setPaymentMethod] = useState<"yape" | "plin" | "bank_transfer">("yape");
  const [operationNumber, setOperationNumber] = useState("");
  const [invoiceType, setInvoiceType] = useState<"boleta" | "factura">("factura");
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [taxLegalName, setTaxLegalName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPlanId(initialPlanId);
      setActiveTab(initialTab);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialPlanId, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const yapePhone = process.env.NEXT_PUBLIC_ALYA_YAPE_PHONE || "";
  const bcpAccount = process.env.NEXT_PUBLIC_ALYA_BCP_ACCOUNT || "";
  const bcpCci = process.env.NEXT_PUBLIC_ALYA_BCP_CCI || "";
  const legalEntity = process.env.NEXT_PUBLIC_ALYA_LEGAL_NAME || "ALYA LegalTech Perú";
  const hasConfiguredBankAccounts = Boolean(yapePhone || bcpAccount);

  const plans = [
    { id: "pro_monthly", name: "ALYA Pro Mensual", price: 89, period: "mes", badge: null },
    { id: "pro_annual", name: "ALYA Pro Anual", price: 790, period: "año", badge: "Ahorra 26%" },
    { id: "elite_monthly", name: "Élite Estudio Mensual", price: 249, period: "mes", badge: null },
    { id: "elite_annual", name: "Élite Estudio Anual", price: 2290, period: "año", badge: "Ahorra 23%" },
  ];

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[1];

  const handleCardNumberChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setExpiry(digits);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const taxDigits = taxIdNumber.replace(/\D/g, "");
    if (invoiceType === "factura" && (taxDigits.length !== 11 || !taxLegalName.trim())) {
      setErrorMessage("Para emitir Factura requerimos un RUC válido de 11 dígitos y la Razón Social.");
      return;
    }
    if (invoiceType === "boleta" && (taxDigits.length !== 8 || !taxLegalName.trim())) {
      setErrorMessage("Para emitir Boleta requerimos un DNI válido de 8 dígitos y tu nombre completo.");
      return;
    }

    if (activeTab === "card") {
      if (cardNumber.replace(/\D/g, "").length < 15 || !cardHolder.trim() || expiry.length < 5 || cvv.length < 3) {
        setErrorMessage("Completa correctamente todos los datos de tu tarjeta (número, titular, MM/AA y CVV).");
        return;
      }

      setLoading(true);
      try {
        const res = await processCardSubscriptionPaymentAction({
          targetPlanId: selectedPlan.id,
          cardNumber,
          cardHolder,
          expiry,
          cvv,
          invoiceType,
          taxIdNumber: taxDigits,
          taxLegalName: taxLegalName.trim(),
        });

        if (!res.success) {
          throw new Error(res.error || "No se pudo procesar el pago con tarjeta.");
        }
        setSuccessMessage(res.message || "Plan activado con éxito.");
      } catch (err: any) {
        setErrorMessage(err.message || "Error al procesar el pago con tarjeta.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!file) {
      setErrorMessage("Por favor adjunta la captura o PDF de tu comprobante de pago.");
      return;
    }

    if (!operationNumber.trim()) {
      setErrorMessage("Por favor ingresa el número de operación bancaria.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("Sesión expirada. Por favor recarga e inicia sesión.");
        setLoading(false);
        return;
      }

      // 1. Subir archivo al bucket privado payment-vouchers
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}_voucher.${fileExt}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("payment-vouchers")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(`Error al subir comprobante: ${uploadErr.message}`);
      }

      // 2. Registrar en la base de datos vía Server Action
      const res = await submitManualPaymentVoucherAction({
        targetPlanId: selectedPlan.id,
        amountPen: selectedPlan.price,
        paymentMethod,
        voucherUrl: uploadData.path,
        invoiceType,
        taxIdNumber: taxDigits,
        taxLegalName: taxLegalName.trim(),
        operationNumber: operationNumber.trim(),
      });

      if (!res.success) {
        throw new Error(res.error || "No se pudo registrar el pago.");
      }

      setSuccessMessage(res.message || "Comprobante enviado exitosamente.");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Ocurrió un error inesperado al enviar el comprobante.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {successMessage ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[#0F172A] font-serif">
              {activeTab === "card" ? "¡Plan Activado con Éxito!" : "¡Comprobante Recibido con Éxito!"}
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {successMessage}
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[#0F172A] px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Entendido y Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 id="payment-modal-title" className="text-2xl font-bold tracking-tight text-[#0F172A] font-serif pr-8">
                Activar Membresía Profesional
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Elige tu plan y completa la activación inmediata con tarjeta o mediante comprobante Yape/BCP.
              </p>
            </div>

            {/* Selector de Modalidad de Pago */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Método de activación">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "card"}
                onClick={() => {
                  setActiveTab("card");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "card"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Tarjeta Crédito / Débito</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "transfer"}
                onClick={() => {
                  setActiveTab("transfer");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "transfer"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <QrCode className="w-4 h-4 text-purple-600" />
                <span>Yape / Plin / Transferencia</span>
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Selección de Plan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">1. Selecciona el Plan a Activar</label>
              <div className="grid grid-cols-2 gap-2.5">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={selectedPlanId === p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`rounded-2xl border p-3 text-left transition-all relative cursor-pointer ${
                      selectedPlanId === p.id
                        ? "border-blue-600 bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute top-2 right-2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5">
                        {p.badge}
                      </span>
                    )}
                    <span className="block text-xs font-bold text-[#0F172A]">{p.name}</span>
                    <span className="block text-sm font-extrabold text-[#0F172A] font-serif mt-0.5">
                      S/ {p.price} <span className="text-[10px] text-slate-500 font-normal">/ {p.period}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "card" ? (
              <div className="rounded-2xl border border-blue-200/80 bg-blue-50/30 p-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Activación Inmediata con Tarjeta
                  </span>
                  <span className="text-blue-700 font-mono">Total: S/ {selectedPlan.price}.00</span>
                </div>

                {!process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200/80 p-2.5 text-[11px] text-amber-800">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      Entorno de validación controlada: verifica los datos de tarjeta e historial fiscal sin efectuar cargos reales hasta conectar pasarela comercial.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="card-holder" className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Titular de la tarjeta
                    </label>
                    <input
                      id="card-holder"
                      type="text"
                      required
                      autoComplete="cc-name"
                      placeholder="Nombre como figura en la tarjeta"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-blue-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="card-number" className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Número de tarjeta (Visa / Mastercard / Amex)
                    </label>
                    <input
                      id="card-number"
                      type="text"
                      inputMode="numeric"
                      required
                      autoComplete="cc-number"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="card-expiry" className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Vencimiento (MM/AA)
                    </label>
                    <input
                      id="card-expiry"
                      type="text"
                      inputMode="numeric"
                      required
                      autoComplete="cc-exp"
                      placeholder="MM/AA"
                      value={expiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="card-cvv" className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Código de seguridad (CVV)
                    </label>
                    <input
                      id="card-cvv"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      autoComplete="cc-csc"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:outline-blue-600"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Datos de Cuenta Institucional */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between font-bold text-[#0F172A]">
                    <span>Cuentas Institucionales ({legalEntity})</span>
                    <span className="text-purple-700 font-mono">Total: S/ {selectedPlan.price}.00</span>
                  </div>
                  {hasConfiguredBankAccounts ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                      {yapePhone && (
                        <div className="space-y-0.5">
                          <span className="text-slate-500 block font-semibold">Yape / Plin Corporativo:</span>
                          <span className="font-mono font-bold text-slate-900 block text-xs">{yapePhone}</span>
                          <span className="text-[10px] text-slate-500">Titular: {legalEntity}</span>
                        </div>
                      )}
                      {bcpAccount && (
                        <div className="space-y-0.5">
                          <span className="text-slate-500 block font-semibold">Cuenta Corriente BCP Soles:</span>
                          <span className="font-mono font-bold text-slate-900 block text-xs">{bcpAccount}</span>
                          {bcpCci && <span className="text-[10px] text-slate-500">CCI: {bcpCci}</span>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 leading-relaxed">
                      <strong>Nota sobre recaudación directa:</strong> Las cuentas Yape/BCP institucionales no están configuradas en este entorno. Usa la pestaña <strong>Tarjeta Crédito / Débito</strong> o solicita los datos bancarios vigentes a soporte@alya.pe antes de realizar abonos manuales.
                    </p>
                  )}
                </div>

                {/* Datos del Comprobante y Operación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="payment-method-select" className="text-xs font-bold text-slate-700">
                      Método de Pago Empleado
                    </label>
                    <select
                      id="payment-method-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-blue-600"
                    >
                      <option value="yape">Yape</option>
                      <option value="plin">Plin</option>
                      <option value="bank_transfer">Transferencia BCP / BBVA / Interbank</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="operation-number" className="text-xs font-bold text-slate-700">
                      N° de Operación Bancaria
                    </label>
                    <input
                      id="operation-number"
                      type="text"
                      required
                      placeholder="Ej: 04581290"
                      value={operationNumber}
                      onChange={(e) => setOperationNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-mono focus:outline-blue-600"
                    />
                  </div>
                </div>

                {/* Subida de Archivo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Adjuntar Voucher (Imagen o PDF)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 p-3 text-xs text-slate-600 transition-colors">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span className="truncate">{file ? file.name : "Seleccionar captura o PDF"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Comprobante Fiscal SUNAT */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Comprobante de Pago SUNAT</span>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceType"
                      value="factura"
                      checked={invoiceType === "factura"}
                      onChange={() => setInvoiceType("factura")}
                      className="text-blue-600"
                    />
                    <span>Factura (RUC)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceType"
                      value="boleta"
                      checked={invoiceType === "boleta"}
                      onChange={() => setInvoiceType("boleta")}
                      className="text-blue-600"
                    />
                    <span>Boleta (DNI)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tax-id-input" className="text-[11px] text-slate-500 block mb-1">
                    {invoiceType === "factura" ? "Número de RUC (11 dígitos)" : "Número de DNI (8 dígitos)"}
                  </label>
                  <input
                    id="tax-id-input"
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={invoiceType === "factura" ? 11 : 8}
                    placeholder={invoiceType === "factura" ? "Ingresa tu RUC de 11 dígitos" : "Ingresa tu DNI de 8 dígitos"}
                    value={taxIdNumber}
                    onChange={(e) =>
                      setTaxIdNumber(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, invoiceType === "factura" ? 11 : 8)
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="tax-legal-name" className="text-[11px] text-slate-500 block mb-1">
                    {invoiceType === "factura" ? "Razón Social o Nombre Legal" : "Nombre Completo"}
                  </label>
                  <input
                    id="tax-legal-name"
                    type="text"
                    required
                    placeholder={invoiceType === "factura" ? "Razón social del estudio o titular" : "Nombres y apellidos completos"}
                    value={taxLegalName}
                    onChange={(e) => setTaxLegalName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Botón de Envío */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{activeTab === "card" ? "Procesando Pago..." : "Enviando Comprobante..."}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {activeTab === "card"
                        ? `Pagar S/ ${selectedPlan.price} y Activar`
                        : "Enviar Comprobante"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
