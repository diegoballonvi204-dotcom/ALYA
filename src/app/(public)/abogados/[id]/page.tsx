import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicLawyerDetailAction } from "@/actions/directory.actions";
import {
  ShieldCheck,
  Star,
  MapPin,
  Video,
  Building,
  Briefcase,
  Award,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Scale,
  Sparkles,
} from "lucide-react";

interface LawyerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: LawyerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { lawyer } = await getPublicLawyerDetailAction(id);

  if (!lawyer) {
    return {
      title: "Abogado no encontrado | ALYA",
    };
  }

  const fullName = `${lawyer.firstName} ${lawyer.lastName}`.trim();
  const primarySpec = lawyer.specialties[0]?.name || "Derecho";
  const title = `Dr. ${fullName} — Abogado ${primarySpec} en ${lawyer.city} | ALYA`;
  const description =
    lawyer.bio?.slice(0, 160) ||
    `Perfil profesional del Dr. ${fullName}, colegiado ${lawyer.barAssociation || "CAL"} ${lawyer.barNumber}. ${lawyer.yearsExperience} años de experiencia en ${primarySpec}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      locale: "es_PE",
      images: lawyer.avatarUrl ? [lawyer.avatarUrl] : undefined,
    },
  };
}

export default async function PublicLawyerProfilePage({
  params,
}: LawyerDetailPageProps) {
  const { id } = await params;
  const { lawyer, error } = await getPublicLawyerDetailAction(id);

  if (error || !lawyer) {
    notFound();
  }

  const fullName = `${lawyer.firstName} ${lawyer.lastName}`.trim();
  const initials = `${lawyer.firstName?.[0] || "A"}${lawyer.lastName?.[0] || "L"}`;
  const primarySpec = lawyer.specialties.find((s) => s.isPrimary)?.name || lawyer.specialties[0]?.name || "Especialista Jurídico";

  // Structured Data (JSON-LD) para Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Attorney",
    name: `Dr. ${fullName}`,
    description: lawyer.bio || `Abogado especialista en ${primarySpec} en ${lawyer.city}, Perú.`,
    image: lawyer.avatarUrl || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: lawyer.city,
      addressCountry: "PE",
    },
    priceRange: lawyer.consultationPrice ? `PEN ${lawyer.consultationPrice}` : "PEN 150.00",
    aggregateRating: lawyer.totalReviews > 0 ? {
      "@type": "AggregateRating",
      ratingValue: lawyer.ratingAverage.toFixed(1),
      reviewCount: lawyer.totalReviews,
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Schema.org Injected Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Breadcrumb Nav */}
      <div className="bg-white border-b border-slate-200">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 py-4 flex items-center justify-between">
          <Link
            href="/abogados"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#2563EB] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Directorio de Abogados</span>
          </Link>

          <span className="text-xs text-slate-400 font-mono">
            {lawyer.barAssociation || "CAL"} Matrícula {lawyer.barNumber}
          </span>
        </div>
      </div>

      <main className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Principal Izquierda (8/12) */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-8">
            {/* 1. Header Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0F172A] to-slate-800 text-white flex items-center justify-center font-bold text-3xl overflow-hidden shadow-md font-serif">
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
                      title="Colegiado Habilitado Verificado"
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-2xs"
                    >
                      <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-serif tracking-tight">
                      {fullName}
                    </h1>
                    {lawyer.isVerified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Colegiado Habilitado
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-[#2563EB] mt-1 font-sans">
                    {primarySpec} • {lawyer.yearsExperience} años de ejercicio profesional
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-mono">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-semibold">
                      <Award className="w-3.5 h-3.5 text-[#2563EB]" />
                      {lawyer.barAssociation || "CAL"} {lawyer.barNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {lawyer.city}, Perú
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-500 font-sans font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {lawyer.ratingAverage.toFixed(1)} ({lawyer.totalReviews} opiniones)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Biografía y Presentación */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#0F172A] font-serif flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#2563EB]" />
                <span>Presentación Profesional y Trayectoria</span>
              </h2>

              <p className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                {lawyer.bio ||
                  `El Dr. ${fullName} es abogado colegiado en el ${lawyer.barAssociation || "Colegio de Abogados de Lima (CAL)"} con amplia trayectoria en la defensa y patrocinio de causas legales en ${lawyer.city} y a nivel nacional.`}
              </p>

              {lawyer.addressOffice && lawyer.physicalAttention && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-700">
                  <Building className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Despacho Profesional:</span>
                    <span>{lawyer.addressOffice}</span>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Especialidades Jurídicas */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#0F172A] font-serif flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#2563EB]" />
                <span>Áreas de Práctica y Especialidades</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {lawyer.specialties.map((spec, i) => (
                  <div
                    key={spec.id || i}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {spec.name}
                      </h4>
                      {spec.isPrimary && (
                        <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider">
                          Especialidad Principal
                        </span>
                      )}
                    </div>
                    {spec.experienceYears && (
                      <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {spec.experienceYears} años
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Testimonios y Calificaciones Auditadas */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#0F172A] font-serif flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>Opiniones Auditadas ({lawyer.totalReviews})</span>
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  Promedio: <strong>{lawyer.ratingAverage.toFixed(1)} / 5.0</strong>
                </span>
              </div>

              {lawyer.reviews && lawyer.reviews.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {lawyer.reviews.map((rev) => (
                    <div key={rev.id} className="py-4 first:pt-2 last:pb-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                            {rev.clientName[0]}
                          </div>
                          <span className="text-xs font-bold text-slate-900">
                            {rev.clientName}
                          </span>
                        </div>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3.5 h-3.5 ${
                                idx < rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-slate-600 leading-relaxed font-sans pl-9">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  Este letrado aún no registra reseñas públicas. Sé el primero en consultar su servicio profesional.
                </div>
              )}
            </section>
          </div>

          {/* Columna Lateral Derecha (4/12) - Widget de Reserva y Contacto */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-6">
            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              {/* Tarifa de Consulta */}
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">
                  Honorario de Consulta Legal
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-[#0F172A] font-serif">
                    S/ {(lawyer.consultationPrice || 150).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    / sesión de 45 min
                  </span>
                </div>
              </div>

              {/* Modalidades Disponibles */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-900 block font-sans">
                  Modalidades Habilitadas:
                </span>
                {lawyer.virtualAttention && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Video className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Videoconsulta de 1 Clic (Jitsi Meet Cifrado)</span>
                  </div>
                )}
                {lawyer.physicalAttention && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Building className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Atención Presencial en Despacho</span>
                  </div>
                )}
              </div>

              {/* Garantía de Custodia ALYA */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Custodia de Honorarios ALYA</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed font-sans">
                  Tu pago permanece custodiado de forma segura y solo se liquida al letrado una vez concluida satisfactoriamente la asesoría.
                </p>
              </div>

              {/* Botón Principal de Contacto / Reserva */}
              <Link
                href={`/dashboard?lawyerId=${lawyer.id}`}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Solicitar Asesoría Legal</span>
              </Link>

              <div className="text-center text-[11px] text-slate-500 font-sans">
                Sin compromiso previo • Respuesta estimada en menos de 2 horas
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
