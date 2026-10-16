"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Star,
  MapPin,
  Video,
  Building,
  Briefcase,
  Award,
  ArrowRight,
} from "lucide-react";

export interface LawyerCardData {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  city: string;
  barAssociation: string;
  barNumber: string;
  yearsExperience: number;
  bio: string | null;
  consultationPrice: number | null;
  currency: string;
  virtualAttention: boolean;
  physicalAttention: boolean;
  addressOffice: string | null;
  ratingAverage: number;
  totalReviews: number;
  isVerified: boolean;
  specialties: Array<{
    id?: number;
    name?: string;
    slug?: string;
    isPrimary?: boolean;
    experienceYears?: number;
  }>;
}

interface LawyerCardProps {
  lawyer: LawyerCardData;
}

export function LawyerCard({ lawyer }: LawyerCardProps) {
  const fullName = `${lawyer.firstName} ${lawyer.lastName}`.trim();
  const initials = `${lawyer.firstName?.[0] || "A"}${lawyer.lastName?.[0] || "L"}`;
  const primarySpec =
    lawyer.specialties.find((s) => s.isPrimary)?.name ||
    lawyer.specialties[0]?.name ||
    "Especialista Jurídico";

  return (
    <article className="group relative rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between hover:border-blue-300/80">
      <div>
        {/* Top Header: Avatar + Badges */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F172A] to-slate-800 text-white flex items-center justify-center font-bold text-lg overflow-hidden shadow-xs font-serif group-hover:scale-105 transition-transform">
              {lawyer.avatarUrl ? (
                <img
                  src={lawyer.avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            {lawyer.isVerified && (
              <span
                title="Abogado Colegiado y Verificado por el CAL/CAA"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-2xs"
              >
                <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#0F172A] font-serif group-hover:text-[#2563EB] transition-colors truncate">
                {fullName}
              </h3>
            </div>

            <p className="text-xs text-[#2563EB] font-medium font-sans truncate mt-0.5">
              {primarySpec}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono">
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                <Award className="w-3 h-3 text-[#2563EB]" />
                {lawyer.barAssociation || "CAL"} {lawyer.barNumber}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {lawyer.city}
              </span>
            </div>
          </div>
        </div>

        {/* Bio Excerpt */}
        {lawyer.bio && (
          <p className="text-xs text-slate-600 line-clamp-2 mt-3.5 leading-relaxed font-sans">
            {lawyer.bio}
          </p>
        )}

        {/* Specialties Chips */}
        {lawyer.specialties && lawyer.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {lawyer.specialties.slice(0, 3).map((spec, i) => (
              <span
                key={spec.id || i}
                className="text-[10px] px-2.5 py-0.5 rounded-lg bg-blue-50/70 text-blue-700 border border-blue-100 font-medium"
              >
                {spec.name}
              </span>
            ))}
            {lawyer.specialties.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-medium">
                +{lawyer.specialties.length - 3} más
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info & Action */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Rating & Fee */}
        <div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-slate-800 ml-1">
                {lawyer.ratingAverage.toFixed(1)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              ({lawyer.totalReviews} {lawyer.totalReviews === 1 ? "opinión" : "opiniones"})
            </span>
          </div>

          <div className="text-xs text-slate-700 font-semibold mt-1">
            {lawyer.consultationPrice ? (
              <span>
                Consulta: <strong className="text-[#0F172A] font-bold">S/ {lawyer.consultationPrice.toFixed(2)}</strong>
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">Tarifa referencial</span>
            )}
          </div>
        </div>

        {/* CTA Link */}
        <Link
          href={`/abogados/${lawyer.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all shadow-xs group-hover:bg-[#2563EB]"
        >
          <span>Ver Perfil</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
