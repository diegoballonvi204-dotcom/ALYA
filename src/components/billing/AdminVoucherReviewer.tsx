"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  approveManualPaymentInvoiceAction,
  rejectManualPaymentInvoiceAction,
} from "@/actions/billing.actions";

interface AdminVoucherReviewerProps {
  invoice: {
    id: string;
    amount_pen: number;
    payment_method: string;
    voucher_url: string | null;
    invoice_type: string | null;
    tax_id_number: string | null;
    tax_legal_name: string | null;
    invoice_number: string | null;
    status: string;
    target_plan?: {
      name: string;
      tier: string;
      billing_period: string;
    } | null;
    lawyer_profiles?: {
      bar_number: string;
      bar_association: string;
      profiles?: {
        first_name: string;
        last_name: string;
        phone: string | null;
      } | null;
    } | null;
  };
}

export default function AdminVoucherReviewer({ invoice }: AdminVoucherReviewerProps) {
  const [loading, setLoading] = useState(false);
  const [actionDone, setActionDone] = useState<"approved" | "rejected" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [voucherSignedUrl, setVoucherSignedUrl] = useState<string | null>(null);
  const [openingVoucher, setOpeningVoucher] = useState(false);

  const lawyerName = invoice.lawyer_profiles?.profiles
    ? `${invoice.lawyer_profiles.profiles.first_name} ${invoice.lawyer_profiles.profiles.last_name}`
    : "Abogado Colegiado";

  const handleViewVoucher = async () => {
    if (!invoice.voucher_url) return;
    setOpeningVoucher(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("payment-vouchers")
        .createSignedUrl(invoice.voucher_url, 3600);

      if (error || !data?.signedUrl) {
        throw new Error("No se pudo generar el enlace seguro del comprobante.");
      }

      window.open(data.signedUrl, "_blank");
    } catch (err: any) {
      alert(err.message || "Error abriendo comprobante");
    } finally {
      setOpeningVoucher(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm(`¿Confirmas la aprobación del pago de S/ ${invoice.amount_pen} para ${lawyerName}? Se activará el ${invoice.target_plan?.name}.`)) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await approveManualPaymentInvoiceAction(invoice.id);
      if (!res.success) {
        throw new Error(res.error);
      }
      setActionDone("approved");
    } catch (err: any) {
      setErrorMessage(err.message || "Error al aprobar pago");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Por favor especifica el motivo del rechazo para informar al abogado.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await rejectManualPaymentInvoiceAction(invoice.id, rejectReason.trim());
      if (!res.success) {
        throw new Error(res.error);
      }
      setActionDone("rejected");
    } catch (err: any) {
      setErrorMessage(err.message || "Error al rechazar comprobante");
    } finally {
      setLoading(false);
    }
  };

  if (actionDone === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Aprobado y Activado
      </span>
    );
  }

  if (actionDone === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1">
        <XCircle className="w-3.5 h-3.5" />
        Rechazado
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {errorMessage && (
        <span className="text-[10px] text-rose-600 font-semibold">{errorMessage}</span>
      )}

      <div className="flex items-center gap-2">
        {invoice.voucher_url && (
          <button
            type="button"
            disabled={openingVoucher}
            onClick={handleViewVoucher}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>{openingVoucher ? "Abriendo..." : "Ver Voucher"}</span>
          </button>
        )}

        {invoice.status === "review_pending" && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={handleApprove}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-xs font-bold text-white transition-all shadow-xs disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Aprobar</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => setShowRejectInput(!showRejectInput)}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rechazar</span>
            </button>
          </>
        )}
      </div>

      {showRejectInput && (
        <div className="flex items-center gap-2 pt-1.5 animate-in fade-in">
          <input
            type="text"
            placeholder="Motivo (ej: Monto no coincide, no figura en BCP)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-800 focus:outline-blue-600 w-56"
          />
          <button
            type="button"
            disabled={loading}
            onClick={handleReject}
            className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      )}
    </div>
  );
}
