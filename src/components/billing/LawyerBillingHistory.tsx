"use client";

import { SubscriptionInvoice } from "@/lib/types/subscription.types";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Receipt,
  Download,
} from "lucide-react";

interface LawyerBillingHistoryProps {
  invoices: SubscriptionInvoice[];
}

export default function LawyerBillingHistory({ invoices }: LawyerBillingHistoryProps) {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-xs">
        <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-[#0F172A] font-serif">
          No tienes comprobantes de pago registrados aún
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          Cuando realices un pago por Yape, Plin o BCP y cargues tu comprobante, aparecerá aquí con el seguimiento en tiempo real de su aprobación.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Receipt className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[#0F172A] font-serif">
              Historial de Pagos y Comprobantes
            </h3>
            <p className="text-xs text-slate-500">
              Registro contable de tus membresías, comprobantes tributarios y estado de verificación.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-slate-500">
          {invoices.length} comprobante(s)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-mono uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Monto</th>
              <th className="px-6 py-4">Método & N° Operación</th>
              <th className="px-6 py-4">Tipo Comprobante</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Comprobante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const formattedDate = new Date(inv.created_at).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-600 whitespace-nowrap">
                    {formattedDate}
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-bold text-[#0F172A]">
                      {inv.target_plan?.name || "Plan Profesional"}
                    </span>
                    <span className="block text-[10px] text-slate-400 capitalize">
                      {inv.target_plan?.billing_period || "Mensual"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-extrabold text-[#0F172A] font-serif text-sm">
                      S/ {Number(inv.amount_pen).toFixed(2)}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-bold capitalize text-slate-700 block">
                      {inv.payment_method}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {inv.invoice_number || "Sin N° registrado"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="uppercase text-[10px] font-bold rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 inline-block">
                      {inv.invoice_type || "Boleta"}
                    </span>
                    {inv.tax_id_number && (
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        RUC: {inv.tax_id_number}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {inv.status === "paid" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Aprobado
                      </span>
                    )}
                    {inv.status === "review_pending" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5">
                        <Clock className="w-3 h-3" />
                        En Revisión
                      </span>
                    )}
                    {inv.status === "failed" && (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5">
                          <AlertCircle className="w-3 h-3" />
                          Observado
                        </span>
                        {inv.rejection_reason && (
                          <p className="text-[11px] text-rose-700 max-w-xs leading-tight">
                            Motivo: {inv.rejection_reason}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {inv.voucher_url ? (
                      <a
                        href={inv.voucher_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <span>Ver Voucher</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
