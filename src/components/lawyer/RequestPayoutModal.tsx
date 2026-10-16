"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  Building2,
  CreditCard,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { requestPayoutAction } from "@/actions/payouts.actions";

interface RequestPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess: () => void;
}

const PERU_BANKS = [
  "BCP (Banco de Crédito del Perú)",
  "BBVA Continental Perú",
  "Interbank",
  "Scotiabank Perú",
  "Banco de la Nación",
  "BanBif",
  "Yape / Plin (Titular)",
];

export function RequestPayoutModal({
  isOpen,
  onClose,
  availableBalance,
  onSuccess,
}: RequestPayoutModalProps) {
  const [amount, setAmount] = useState<string>(
    availableBalance >= 50 ? availableBalance.toString() : ""
  );
  const [bankName, setBankName] = useState(PERU_BANKS[0]);
  const [accountType, setAccountType] = useState<"ahorros" | "corriente">("ahorros");
  const [accountNumber, setAccountNumber] = useState("");
  const [cciNumber, setCciNumber] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryDni, setBeneficiaryDni] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 50) {
      setErrorMsg("El monto mínimo de retiro es de S/ 50.00.");
      return;
    }

    if (numAmount > availableBalance) {
      setErrorMsg(`Saldo insuficiente. Tu disponible es S/ ${availableBalance.toFixed(2)}.`);
      return;
    }

    const cleanCci = cciNumber.replace(/[^0-9]/g, "");
    if (cleanCci.length !== 20) {
      setErrorMsg("El Código de Cuenta Interbancario (CCI) debe tener exactamente 20 dígitos numéricos.");
      return;
    }

    if (!beneficiaryDni || beneficiaryDni.trim().length < 8) {
      setErrorMsg("Ingresa un DNI de beneficiario válido.");
      return;
    }

    if (!beneficiaryName.trim()) {
      setErrorMsg("Ingresa el nombre completo del titular de la cuenta.");
      return;
    }

    startTransition(async () => {
      const res = await requestPayoutAction({
        amountPen: numAmount,
        bankName,
        accountType,
        accountNumber: accountNumber.trim() || cleanCci.substring(10),
        cciNumber: cleanCci,
        beneficiaryName: beneficiaryName.trim(),
        beneficiaryDni: beneficiaryDni.trim(),
      });

      if (res.success) {
        alert(res.message);
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Error al procesar la solicitud.");
      }
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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
          className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 text-[#0F172A]"
        >
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#0F172A]">
                  Solicitud de Retiro de Honorarios
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Transferencia Interbancaria Inmediata (CCI)
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
            {/* Saldo Disponible Callout */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
                  Saldo Disponible para Retiro
                </span>
                <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">
                  S/ {availableBalance.toFixed(2)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAmount(availableBalance.toString())}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
              >
                Retirar Todo
              </button>
            </div>

            {/* Monto a Retirar */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                Monto en Soles (PEN) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-sm">
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="50"
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-sm font-mono font-bold text-[#0F172A] outline-none transition-all"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Monto mínimo: S/ 50.00 • Sin comisiones de retención.
              </span>
            </div>

            {/* Banco y Tipo de Cuenta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                  Entidad Bancaria *
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-xs font-medium text-slate-800 outline-none bg-white transition-all"
                >
                  {PERU_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                  Tipo de Cuenta *
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-xs font-medium text-slate-800 outline-none bg-white transition-all"
                >
                  <option value="ahorros">Cuenta de Ahorros</option>
                  <option value="corriente">Cuenta Corriente</option>
                </select>
              </div>
            </div>

            {/* CCI de 20 dígitos */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                Código de Cuenta Interbancario (CCI - 20 dígitos) *
              </label>
              <input
                type="text"
                maxLength={20}
                value={cciNumber}
                onChange={(e) => setCciNumber(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="00219400248596014295"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-xs font-mono font-bold tracking-wider text-[#0F172A] outline-none transition-all"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {cciNumber.length}/20 dígitos ingresados
              </span>
            </div>

            {/* Datos del Titular */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                  Titular de la Cuenta *
                </label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="Nombres y Apellidos"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-xs font-medium text-slate-800 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                  DNI del Titular *
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={beneficiaryDni}
                  onChange={(e) => setBeneficiaryDni(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="8 dígitos"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-xs font-mono font-semibold text-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Footer Buttons */}
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
                disabled={isPending || availableBalance < 50}
                className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Retiro</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
