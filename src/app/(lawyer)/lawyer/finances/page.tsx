"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Download,
} from "lucide-react";
import {
  getLawyerFinancesAction,
  type LawyerFinancesSummary,
} from "@/actions/payouts.actions";
import { RequestPayoutModal } from "@/components/lawyer/RequestPayoutModal";

export default function LawyerFinancesPage() {
  const [finances, setFinances] = useState<LawyerFinancesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"movements" | "payouts">("movements");

  const loadData = async () => {
    setLoading(true);
    const res = await getLawyerFinancesAction();
    if (res.finances) {
      setFinances(res.finances);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const available = finances?.availableBalance || 0;
  const escrow = finances?.escrowBalance || 0;
  const totalEarned = finances?.totalEarned || 0;
  const totalWithdrawn = finances?.totalWithdrawn || 0;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-8 text-[#0F172A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] font-mono">
              Billetera Forense Digital • ALYA Escrow
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F172A]">
            Finanzas & Liquidaciones de Honorarios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Custodia garantizada de consultas legales y transferencias interbancarias directas (CCI).
          </p>
        </div>

        <button
          onClick={() => setIsPayoutModalOpen(true)}
          disabled={available < 50}
          className="px-5 py-3 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          <span>Solicitar Retiro de Fondos</span>
        </button>
      </div>

      {/* Financial Metric Cards (Swiss Modernism 2.0) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Disponible */}
        <div className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 font-mono">
              Disponible para Retiro
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-950">
            S/ {available.toFixed(2)}
          </div>
          <p className="text-[11px] text-emerald-700 mt-2 font-medium">
            Fondos liberados tras conclusión de citas.
          </p>
        </div>

        {/* Card 2: En Custodia (Escrow) */}
        <div className="p-6 rounded-3xl bg-white border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
              En Custodia (Escrow)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-amber-950">
            S/ {escrow.toFixed(2)}
          </div>
          <p className="text-[11px] text-amber-700 mt-2 font-medium">
            Se liberan al marcar la consulta como realizada.
          </p>
        </div>

        {/* Card 3: Total Ganado */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Total Honorarios Facturados
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-[#0F172A]">
            S/ {totalEarned.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Volumen acumulado en la plataforma.
          </p>
        </div>

        {/* Card 4: Retiros Completados */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Retiros Liquidados
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-slate-800">
            S/ {totalWithdrawn.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Transferidos a tus cuentas bancarias.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("movements")}
          className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider font-mono transition-colors relative ${
            activeTab === "movements"
              ? "text-[#2563EB] border-b-2 border-[#2563EB]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Honorarios por Consulta ({finances?.movements.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("payouts")}
          className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider font-mono transition-colors relative ml-4 ${
            activeTab === "payouts"
              ? "text-[#2563EB] border-b-2 border-[#2563EB]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Solicitudes de Transferencia ({finances?.payouts.length || 0})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
          <span className="text-xs font-mono">Consolidando libro financiero...</span>
        </div>
      ) : activeTab === "movements" ? (
        /* Tabla de Movimientos */
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[11px]">
                <tr>
                  <th className="p-4 sm:px-6">Concepto / Expediente</th>
                  <th className="p-4 sm:px-6">Cliente</th>
                  <th className="p-4 sm:px-6">Fecha</th>
                  <th className="p-4 sm:px-6">Monto Honorario</th>
                  <th className="p-4 sm:px-6 text-right">Estado de Custodia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {finances?.movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No hay transacciones registradas aún.
                    </td>
                  </tr>
                ) : (
                  finances?.movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 sm:px-6 font-semibold text-[#0F172A]">
                        {m.concept}
                      </td>
                      <td className="p-4 sm:px-6 text-slate-600">{m.clientName}</td>
                      <td className="p-4 sm:px-6 text-slate-500 font-mono">
                        {new Date(m.date).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 sm:px-6 font-mono font-bold text-[#0F172A]">
                        S/ {m.amountPen.toFixed(2)}
                      </td>
                      <td className="p-4 sm:px-6 text-right">
                        {m.status === "released" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] font-bold text-[10px] font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            Liberado
                          </span>
                        ) : m.status === "held_escrow" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#D97706] font-bold text-[10px] font-mono">
                            <Clock className="w-3 h-3" />
                            En Custodia
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] font-mono">
                            Reembolsado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tabla de Payouts */
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[11px]">
                <tr>
                  <th className="p-4 sm:px-6">Fecha Solicitud</th>
                  <th className="p-4 sm:px-6">Entidad Bancaria</th>
                  <th className="p-4 sm:px-6">CCI (20 dígitos)</th>
                  <th className="p-4 sm:px-6">Titular</th>
                  <th className="p-4 sm:px-6">Monto Solicitado</th>
                  <th className="p-4 sm:px-6 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {finances?.payouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No has solicitado retiros de honorarios aún.
                    </td>
                  </tr>
                ) : (
                  finances?.payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 sm:px-6 font-mono text-slate-500">
                        {new Date(p.requestedAt).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 sm:px-6 font-semibold text-[#0F172A]">
                        {p.bankName}
                      </td>
                      <td className="p-4 sm:px-6 font-mono text-slate-600">
                        {p.cciNumber}
                      </td>
                      <td className="p-4 sm:px-6 text-slate-600">
                        {p.beneficiaryName} (DNI: {p.beneficiaryDni})
                      </td>
                      <td className="p-4 sm:px-6 font-mono font-bold text-[#0F172A]">
                        S/ {p.amountPen.toFixed(2)}
                      </td>
                      <td className="p-4 sm:px-6 text-right">
                        {p.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] font-bold text-[10px] font-mono">
                            Transferido
                          </span>
                        ) : p.status === "processing" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] font-bold text-[10px] font-mono">
                            En Proceso
                          </span>
                        ) : p.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] font-mono">
                            Rechazado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#D97706] font-bold text-[10px] font-mono">
                            En Cola
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Solicitud de Retiro */}
      <RequestPayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        availableBalance={available}
        onSuccess={loadData}
      />
    </div>
  );
}
