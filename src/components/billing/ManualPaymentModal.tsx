"use client";

import { useState } from "react";
import {
  X,
  QrCode,
  Building2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitManualPaymentVoucherAction } from "@/actions/billing.actions";

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanId?: string;
}

export default function ManualPaymentModal({
  isOpen,
  onClose,
  initialPlanId = "pro_annual",
}: ManualPaymentModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [paymentMethod, setPaymentMethod] = useState<"yape" | "plin" | "bank_transfer">("yape");
  const [operationNumber, setOperationNumber] = useState("");
  const [invoiceType, setInvoiceType] = useState<"boleta" | "factura">("factura");
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [taxLegalName, setTaxLegalName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const plans = [
    { id: "pro_monthly", name: "ALYA Pro Mensual", price: 89, period: "mes", badge: null },
    { id: "pro_annual", name: "ALYA Pro Anual", price: 790, period: "año", badge: "Ahorra 26%" },
    { id: "elite_monthly", name: "Élite Estudio Mensual", price: 249, period: "mes", badge: null },
    { id: "elite_annual", name: "Élite Estudio Anual", price: 2290, period: "año", badge: "Ahorra 23%" },
  ];

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!file) {
      setErrorMessage("Por favor adjunta la captura o PDF de tu comprobante de pago.");
      return;
    }

    if (!operationNumber.trim()) {
      setErrorMessage("Por favor ingresa el número de operación bancaria.");
      return;
    }

    if (invoiceType === "factura" && (!taxIdNumber.trim() || !taxLegalName.trim())) {
      setErrorMessage("Para emitir Factura requerimos tu número de RUC y Razón Social.");
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
        taxIdNumber: taxIdNumber.trim() || undefined,
        taxLegalName: taxLegalName.trim() || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xl overflow-hidden my-6">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
              ¡Comprobante Recibido con Éxito!
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {successMessage}
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="rounded-xl bg-[#0F172A] px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Entendido y Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-700 mb-2">
                <QrCode className="w-3.5 h-3.5 text-purple-600" />
                <span>Activación Rápida con Yape, Plin o BCP</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-serif">
                Registrar Pago con Comprobante
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Realiza el abono institucional y adjunta tu comprobante para activar tu membresía.
              </p>
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
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`rounded-2xl border p-3 text-left transition-all relative ${
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

            {/* 2. Datos de Cuenta Oficial ALYA Perú */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between font-bold text-[#0F172A]">
                <span>Cuentas Institucionales ALYA Perú SAC</span>
                <span className="text-purple-700 font-mono">Total: S/ {selectedPlan.price}.00</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                <div className="space-y-0.5">
                  <span className="text-slate-500 block font-semibold">Yape / Plin Corporativo:</span>
                  <span className="font-mono font-bold text-slate-900 block text-xs">987 654 321</span>
                  <span className="text-[10px] text-slate-500">A nombre de: ALYA LegalTech SAC</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block font-semibold">Cuenta Corriente BCP Soles:</span>
                  <span className="font-mono font-bold text-slate-900 block text-xs">194-98765432-0-12</span>
                  <span className="text-[10px] text-slate-500">CCI: 002-194-009876543212-90</span>
                </div>
              </div>
            </div>

            {/* 3. Datos del Comprobante y Operación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Método de Pago Empleado</label>
                <select
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
                <label className="text-xs font-bold text-slate-700">N° de Operación Bancaria</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 04581290"
                  value={operationNumber}
                  onChange={(e) => setOperationNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-mono focus:outline-blue-600"
                />
              </div>
            </div>

            {/* 4. Subida de Archivo */}
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

            {/* 5. Comprobante Fiscal SUNAT */}
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
                  <label className="text-[11px] text-slate-500 block mb-1">
                    {invoiceType === "factura" ? "Número de RUC (10 u 20)" : "Número de DNI"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={invoiceType === "factura" ? "20601234567" : "45892134"}
                    value={taxIdNumber}
                    onChange={(e) => setTaxIdNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    {invoiceType === "factura" ? "Razón Social o Nombre Legal" : "Nombre Completo"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={invoiceType === "factura" ? "Estudio Jurídico Silva & Asoc. SAC" : "Carlos Ramos"}
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
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando Comprobante...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Comprobante</span>
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
