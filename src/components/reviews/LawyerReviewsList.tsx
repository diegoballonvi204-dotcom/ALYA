"use client";

import {
  Star,
  MessageSquare,
  Clock,
  BookOpen,
  Award,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface ReviewItem {
  id: string;
  clientName: string;
  clientCity: string;
  communicationScore: number;
  punctualityScore: number;
  clarityScore: number;
  attentionScore: number;
  averageScore: number;
  comment: string | null;
  createdAt: string;
}

interface LawyerReviewsListProps {
  reviews: ReviewItem[];
  overallRating: number;
  totalReviews: number;
}

export function LawyerReviewsList({
  reviews,
  overallRating,
  totalReviews,
}: LawyerReviewsListProps) {
  // Calcular promedios por factor si hay reviews
  const avgComm =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.communicationScore, 0) /
          reviews.length
        ).toFixed(1)
      : overallRating.toFixed(1);

  const avgPunct =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.punctualityScore, 0) /
          reviews.length
        ).toFixed(1)
      : overallRating.toFixed(1);

  const avgClarity =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.clarityScore, 0) / reviews.length
        ).toFixed(1)
      : overallRating.toFixed(1);

  const avgAttention =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.attentionScore, 0) / reviews.length
        ).toFixed(1)
      : overallRating.toFixed(1);

  return (
    <div className="space-y-6">
      {/* 1. Tarjeta Resumen Analítico de Reputación */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        {/* Score General */}
        <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-slate-50 border border-slate-200 w-full md:w-48 text-center shrink-0">
          <span className="text-4xl font-extrabold text-[#0F172A]">
            {overallRating > 0 ? overallRating.toFixed(1) : "5.0"}
          </span>
          <div className="flex items-center gap-1 my-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= Math.round(overallRating || 5)
                    ? "fill-blue-600 text-blue-600"
                    : "text-slate-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">
            {totalReviews} {totalReviews === 1 ? "opinión" : "opiniones"} de clientes
          </span>
        </div>

        {/* Barras de los 4 Factores */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Factor 1: Comunicación */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#0F172A] flex items-center gap-1.5 font-semibold">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                Comunicación
              </span>
              <span className="font-bold text-[#0F172A]">{avgComm} / 5</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${(Number(avgComm) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Factor 2: Puntualidad */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#0F172A] flex items-center gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                Puntualidad
              </span>
              <span className="font-bold text-[#0F172A]">{avgPunct} / 5</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-slate-700 h-full rounded-full"
                style={{ width: `${(Number(avgPunct) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Factor 3: Claridad Jurídica */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#0F172A] flex items-center gap-1.5 font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                Claridad Jurídica
              </span>
              <span className="font-bold text-[#0F172A]">{avgClarity} / 5</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${(Number(avgClarity) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Factor 4: Trato Profesional */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#0F172A] flex items-center gap-1.5 font-semibold">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                Trato Profesional
              </span>
              <span className="font-bold text-[#0F172A]">{avgAttention} / 5</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${(Number(avgAttention) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Listado de Reseñas de Clientes */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Opiniones Verificadas ({reviews.length})
        </h4>

        {reviews.length === 0 ? (
          <div className="p-8 rounded-2xl border border-slate-200 bg-white text-center text-slate-500 text-xs shadow-xs">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-600" />
            <p className="text-slate-700 font-medium">
              Este abogado aún no cuenta con reseñas públicas registradas.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Las opiniones se habilitan de forma exclusiva para clientes que
              concluyeron una consulta en ALYA Perú.
            </p>
          </div>
        ) : (
          reviews.map((r) => {
            const dateFormatted = new Date(r.createdAt).toLocaleDateString(
              "es-PE",
              { year: "numeric", month: "long", day: "numeric" }
            );

            return (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0F172A]">
                      {r.clientName}
                    </span>
                    <span className="text-[10px] text-slate-400">• {r.clientCity}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Consulta Verificada
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= Math.round(r.averageScore)
                              ? "fill-blue-600 text-blue-600"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#0F172A] ml-1">
                      {r.averageScore}
                    </span>
                  </div>
                </div>

                {r.comment && (
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-3">
                    <span>Com: {r.communicationScore}/5</span>
                    <span>Punt: {r.punctualityScore}/5</span>
                    <span>Clar: {r.clarityScore}/5</span>
                    <span>Trato: {r.attentionScore}/5</span>
                  </span>
                  <span>{dateFormatted}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
