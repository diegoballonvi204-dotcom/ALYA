"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  MapPin,
  Sparkles,
} from "lucide-react";

export interface ConsultationContextData {
  id: string;
  status: "requested" | "confirmed" | "completed" | "cancelled" | string;
  scheduledAt?: string | null;
  durationMinutes?: number | null;
  modality?: "virtual" | "presencial" | string | null;
  meetingLink?: string | null;
  agreedPrice?: number | null;
  paymentStatus?: "pending_payment" | "held_escrow" | "released" | "refunded" | string | null;
  paymentMethod?: string | null;
  voucherUrl?: string | null;
  roomPasscode?: string | null;
  meetingAddress?: string | null;
  hasReviewed?: boolean;
}

interface ConsultationContextBannerProps {
  consultation: ConsultationContextData;
  isClient: boolean;
  onOpenPayment: () => void;
  onOpenVideo: () => void;
  onOpenReview?: () => void;
}

export function ConsultationContextBanner({
  consultation,
  isClient,
  onOpenPayment,
  onOpenVideo,
  onOpenReview,
}: ConsultationContextBannerProps) {
  const [copiedPin, setCopiedPin] = useState(false);

  if (!consultation || consultation.status === "cancelled") {
    return null;
  }

  const formattedDate = consultation.scheduledAt
    ? new Date(consultation.scheduledAt).toLocaleDateString("es-PE", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const copyPasscode = () => {
    if (consultation.roomPasscode) {
      navigator.clipboard.writeText(consultation.roomPasscode);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const isVirtual =
    consultation.modality !== "presencial" && consultation.modality !== "in_person";
  const isHeld = consultation.paymentStatus === "held_escrow";
  const isPending =
    !consultation.paymentStatus || consultation.paymentStatus === "pending_payment";
  const isReleased = consultation.paymentStatus === "released";

  return (
    <aside
      aria-label="Estado de la consulta legal"
      className="bg-white border-b border-slate-200/90 shadow-xs px-4 sm:px-6 py-3 transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Lado izquierdo: Metadatos de la consulta */}
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isHeld
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : consultation.status === "completed"
                ? "bg-blue-50 text-[#2563EB] border border-blue-200"
                : "bg-amber-50 text-amber-600 border border-amber-200"
            }`}
          >
            {isHeld ? (
              <ShieldCheck className="w-5 h-5" />
            ) : consultation.status === "completed" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A] font-serif">
                Consulta {isVirtual ? "Virtual" : "Presencial"}
              </span>

              {/* Badge de Estado Cita */}
              <span
                className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full ${
                  consultation.status === "confirmed"
                    ? "bg-emerald-100 text-emerald-800"
                    : consultation.status === "completed"
                    ? "bg-slate-100 text-slate-700"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {consultation.status === "confirmed"
                  ? "Confirmada"
                  : consultation.status === "completed"
                  ? "Finalizada"
                  : "Por Confirmar"}
              </span>

              {/* Badge de Custodia Escrow */}
              {Number(consultation.agreedPrice) === 0 ? (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Consulta Gratuita
                </span>
              ) : (
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isHeld
                      ? "bg-emerald-500/10 text-emerald-700 border border-emerald-300"
                      : isReleased
                      ? "bg-blue-50 text-[#2563EB] border border-blue-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {isHeld
                    ? "Custodia ALYA Activa"
                    : isReleased
                    ? "Honorario Liberado"
                    : "Abono Requerido"}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
              {formattedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formattedDate}
                </span>
              )}
              {consultation.agreedPrice !== undefined && consultation.agreedPrice !== null && (
                <span className="font-semibold text-slate-700">
                  Honorario: S/ {Number(consultation.agreedPrice).toFixed(2)}
                </span>
              )}
              {isVirtual && consultation.roomPasscode && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  PIN: <strong className="text-slate-900">{consultation.roomPasscode}</strong>
                  <button
                    onClick={copyPasscode}
                    title="Copiar PIN de acceso"
                    className="ml-1 text-slate-400 hover:text-slate-700"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {copiedPin && <span className="text-[10px] text-emerald-600">¡Copiado!</span>}
                </span>
              )}
              {!isVirtual && consultation.meetingAddress && (
                <span className="flex items-center gap-1 truncate max-w-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{consultation.meetingAddress}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lado derecho: Acciones contextuales */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Si está pendiente de pago y el usuario es cliente */}
          {isPending && consultation.status === "confirmed" && isClient && (
            <button
              onClick={onOpenPayment}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all animate-pulse"
            >
              <CreditCard className="w-4 h-4" />
              <span>Abonar en Custodia</span>
            </button>
          )}

          {/* Si está pendiente de pago y es el abogado */}
          {isPending && consultation.status === "confirmed" && !isClient && (
            <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
              Esperando depósito del cliente en custodia
            </span>
          )}

          {/* Si los fondos están en custodia y la cita es virtual -> Botón 1-Click Videoconsulta */}
          {isHeld && isVirtual && (
            <button
              onClick={onOpenVideo}
              className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Video className="w-4 h-4" />
              <span>Entrar a Videoconsulta</span>
            </button>
          )}

          {/* Si es completada y cliente no ha calificado */}
          {consultation.status === "completed" && isClient && !consultation.hasReviewed && onOpenReview && (
            <button
              onClick={onOpenReview}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dejar Reseña</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
