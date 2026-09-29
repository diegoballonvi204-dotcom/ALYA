import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import {
  Scale,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  FileText,
  Users,
  Building2,
  HeartHandshake,
  Home,
  Receipt,
  GraduationCap,
  Shield,
  HelpCircle,
  Clock,
  Award,
} from "lucide-react";
import { HeroCrystalVisual } from "@/components/home/HeroCrystalVisual";
import { MatchingAlgorithmVisual } from "@/components/home/MatchingAlgorithmVisual";
import { GsapScrollController } from "@/components/home/GsapScrollController";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profile?.role || "client").toLowerCase();
    if (role === "admin" || role === "verifier") {
      redirect("/admin");
    } else if (role === "lawyer") {
      redirect("/lawyer/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  const curatedSpecialties = [
    {
      name: "Derecho Laboral",
      slug: "derecho-laboral",
      description: "Despidos arbitrarios, reclamo de liquidaciones y hostigamiento laboral ante MTPE y Juzgados.",
      lawyersCount: "64 Abogados",
      icon: Briefcase,
    },
    {
      name: "Derecho Penal",
      slug: "derecho-penal",
      description: "Defensa penal técnica y urgente en investigaciones preliminares, fiscalía y flagrancia.",
      lawyersCount: "52 Abogados",
      icon: Shield,
    },
    {
      name: "Derecho Civil",
      slug: "derecho-civil",
      description: "Contratos de arrendamiento, indemnizaciones por daños y perjuicios y prescripción adquisitiva.",
      lawyersCount: "48 Abogados",
      icon: Scale,
    },
    {
      name: "Derecho de Familia",
      slug: "derecho-familia",
      description: "Fijación y aumento de alimentos, régimen de visitas, tenencia y divorcios notariales céleres.",
      lawyersCount: "70 Abogados",
      icon: HeartHandshake,
    },
    {
      name: "Derecho Inmobiliario",
      slug: "derecho-inmobiliario",
      description: "Desalojos express (Ley 30933), saneamiento físico-legal de predios y títulos ante SUNARP.",
      lawyersCount: "38 Abogados",
      icon: Home,
    },
    {
      name: "Derecho Corporativo",
      slug: "derecho-corporativo",
      description: "Constitución societaria, acuerdos de accionistas, fusiones, adquisiciones y compliance.",
      lawyersCount: "42 Abogados",
      icon: Building2,
    },
    {
      name: "Protección al Consumidor",
      slug: "proteccion-consumidor",
      description: "Reclamos ante INDECOPI, cláusulas abusivas, idoneidad de servicio y sanciones administrativas.",
      lawyersCount: "35 Abogados",
      icon: FileText,
    },
    {
      name: "Derecho Tributario",
      slug: "derecho-tributario",
      description: "Fiscalizaciones tributarias SUNAT, recursos de reclamación y apelación ante Tribunal Fiscal.",
      lawyersCount: "29 Abogados",
      icon: Receipt,
    },
  ];

  return (
    <div className="relative overflow-hidden bg-[#F8FAFC] text-[#0F172A] bg-noise">
      {/* GSAP Scroll Controller Plugin Engine */}
      <GsapScrollController />

      {/* Atmospheric Parallax Glows */}
      <div className="gsap-parallax-orb absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none -z-10 blur-3xl" />
      <div className="gsap-parallax-orb absolute top-80 right-0 w-[550px] h-[550px] bg-gradient-to-br from-slate-900/5 to-transparent pointer-events-none -z-10 blur-3xl" />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION CON GSAP 3D PARALLAX                                      */}
      {/* ========================================================================= */}
      <section className="relative mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 sm:pt-20 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Main Headline - Editorial Typography with Serif Accents */}
            <h1 className="text-3xl sm:text-5xl lg:text-[60px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
              El{" "}
              <span className="font-serif italic font-normal text-gradient-sapphire text-[1.06em]">
                abogado adecuado
              </span>{" "}
              para tu problema,{" "}
              <span className="text-gradient-obsidian">
                sin rodeos ni incertidumbre.
              </span>
            </h1>

            {/* Concise Editorial Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans font-normal">
              Cuéntanos qué ocurrió en tus propias palabras. Nuestro motor de correspondencia legal analiza los hechos y te conecta con especialistas colegiados con experiencia auditada.
            </p>

            {/* High-End CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/cases/new"
                className="w-full sm:w-auto group inline-flex items-center justify-center gap-3 rounded-xl bg-[#0F172A] px-8 py-4 text-sm sm:text-base font-bold text-white shadow-xl shadow-slate-900/20 hover:bg-[#1E293B] hover:-translate-y-0.5 transition-all border border-slate-800"
              >
                <span>Describir mi problema</span>
                <ArrowRight className="w-4 h-4 text-blue-400 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/register?role=lawyer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl luxury-glass px-7 py-4 text-sm sm:text-base font-semibold text-[#0F172A] hover:border-[#2563EB]/40 hover:bg-white transition-all shadow-sm"
              >
                <ShieldCheck className="w-4.5 h-4.5 text-[#2563EB]" />
                <span>Soy Abogado Colegiado</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive GSAP 3D Parallax Visual */}
          <div className="lg:col-span-5 flex justify-center">
            <HeroCrystalVisual />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CÓMO FUNCIONA (CRYSTAL CARDS CON GSAP SCROLL REVEAL)                  */}
      {/* ========================================================================= */}
      <section id="como-funciona" className="py-20 sm:py-28 border-t border-slate-200/80 bg-white relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono block">
              Metodología Estructurada
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] font-serif">
              Un proceso riguroso, de principio a fin.
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Eliminamos la incertidumbre en cuatro pasos transparentes para conectar tu necesidad legal con el especialista exacto.
            </p>
          </div>

          {/* Connected 4 Crystal Cards Flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="gsap-step-card rounded-3xl luxury-glass luxury-glass-interactive p-7 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-2xl font-black text-[#2563EB]">01</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F172A] text-blue-400 shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#0F172A] font-serif">Cuéntanos tu caso</h3>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-sans">
                  Sin tecnicismos jurídicos. Describe los hechos en lenguaje natural. El sistema clasifica preliminarmente la materia, gravedad y urgencia.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-[11px] font-semibold text-slate-700 font-mono">
                <span>Lenguaje natural y confidencial</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="gsap-step-card rounded-3xl luxury-glass luxury-glass-interactive p-7 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-2xl font-black text-[#2563EB]">02</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F172A] text-blue-400 shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#0F172A] font-serif">Analizamos tu necesidad</h3>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-sans">
                  Nuestro motor cruza especialidad procesal, distrito judicial, cuantía estimada y disponibilidad de agenda con la base de datos de abogados.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-[11px] font-semibold text-slate-700 font-mono">
                <span>Ponderación objetiva en 5 factores</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="gsap-step-card rounded-3xl luxury-glass luxury-glass-interactive p-7 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-2xl font-black text-[#2563EB]">03</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F172A] text-blue-400 shadow-sm">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#0F172A] font-serif">Encuentra compatibles</h3>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-sans">
                  Explora abogados con porcentaje de afinidad desglosado. Puedes dar "Me interesa" (swipe bilateral) o examinar perfiles detallados en directorio.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-[11px] font-semibold text-slate-700 font-mono">
                <span>Colegiaturas oficiales auditadas</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="gsap-step-card rounded-3xl luxury-glass luxury-glass-interactive p-7 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-2xl font-black text-[#2563EB]">04</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F172A] text-blue-400 shadow-sm">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#0F172A] font-serif">Contacta con el abogado</h3>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-sans">
                  Cuando el interés es recíproco, se concreta el MATCH. Se desbloquea la sala de chat cifrada, el intercambio de expedientes y la reserva de citas.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-[11px] font-semibold text-slate-700 font-mono">
                <span>Cifrado bancario de extremo a extremo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ESPECIALIDADES JURÍDICAS CURADAS                                       */}
      {/* ========================================================================= */}
      <section id="especialidades" className="py-20 sm:py-28 border-t border-slate-200/80 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
                Áreas de Práctica en Perú
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] mt-1 font-serif">
                Especialistas Colegiados para cada Materia
              </h2>
            </div>
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0F172A] hover:text-[#2563EB] transition-colors"
            >
              <span>Publicar consulta personalizada</span>
              <ChevronRight className="w-4 h-4 text-[#2563EB]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {curatedSpecialties.map((spec, index) => {
              const Icon = spec.icon;
              return (
                <div
                  key={index}
                  className="gsap-specialty-card rounded-3xl luxury-glass luxury-glass-interactive p-6 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0F172A] border border-slate-200/80 shadow-sm group-hover:bg-[#0F172A] group-hover:text-blue-400 transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-mono border border-slate-200">
                        {spec.lawyersCount}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors font-serif">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3 font-sans">
                      {spec.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <Link
                      href={`/cases/new?specialty=${spec.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors"
                    >
                      <span>Consultar esta materia</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MOTOR DE MATCHING PONDERADO                                            */}
      {/* ========================================================================= */}
      <section id="matching" className="py-20 sm:py-28 border-t border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
              Tecnología de Coincidencia
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] font-serif">
              No buscamos cualquier abogado. Buscamos compatibilidad.
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              El éxito de un patrocinio legal depende de la afinidad entre el problema y el experto. Nuestro algoritmo ponderado elimina el azar comercial.
            </p>
          </div>

          <MatchingAlgorithmVisual />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECCIÓN PARA ABOGADOS COLEGIADOS                                       */}
      {/* ========================================================================= */}
      <section id="para-abogados" className="py-20 sm:py-28 border-t border-slate-200/80 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-8 sm:p-14 shadow-2xl relative overflow-hidden border border-slate-800">
            {/* Soft sapphire halo */}
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
              <div className="lg:col-span-7 space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-blue-400 backdrop-blur-sm border border-white/10 font-mono">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Red de Profesionales Colegiados
                </span>

                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight font-serif">
                  Convierte tus conocimientos en nuevas oportunidades jurídicas.
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-sans font-normal">
                  Forma parte de la primera plataforma LegalTech de alto estándar en el Perú. Recibe casos precalificados y compatibles con tu especialidad sin perder tiempo en cotizaciones infructuosas.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Casos filtrados por tu especialidad exacta</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Agenda integrada y cobros de consulta</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Insignia de colegiatura auditada oficial</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Bóveda documental cifrada y chat en vivo</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register?role=lawyer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:brightness-105 transition-all"
                  >
                    <span>Soy Abogado — Postular a la red</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all"
                  >
                    <span>Iniciar sesión profesional</span>
                  </Link>
                </div>
              </div>

              {/* Showcase Card for Lawyers */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg font-mono">
                      CAL
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white font-serif">Colegiatura Verificada</p>
                      <p className="text-[11px] text-blue-400 font-mono">Colegios de Abogados del Perú</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/30 p-3.5 border border-white/10 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Tasa de Aceptación Bilateral</span>
                      <span className="font-bold text-blue-400 font-mono">94.2%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Consultas Atendidas</span>
                      <span className="font-bold text-white font-mono">+1,200</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Calificación Promedio</span>
                      <span className="font-bold text-emerald-400 font-mono">4.92 ★</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed text-center font-sans">
                    Auditoría documental conforme al Decreto Supremo N.° 003-2013-JUS y Estatuto del Colegio de Abogados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SEGURIDAD Y PRIVACIDAD (LEY N.° 29733)                                 */}
      {/* ========================================================================= */}
      <section id="seguridad" className="py-20 sm:py-28 border-t border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
              Confidencialidad & Cumplimiento
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] font-serif">
              Tu información merece protección absoluta.
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              El secreto profesional y la protección de datos personales son pilares fundamentales de nuestra arquitectura tecnológica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl luxury-glass p-6">
              <div className="h-10 w-10 rounded-2xl bg-[#0F172A] text-blue-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] font-serif">Cifrado Bancario AES-256</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-sans">
                Tus comunicaciones, expedientes y documentos adjuntos se almacenan con encriptación simétrica en reposo y tránsito.
              </p>
            </div>

            <div className="rounded-3xl luxury-glass p-6">
              <div className="h-10 w-10 rounded-2xl bg-[#0F172A] text-blue-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] font-serif">Colegiatura Auditada</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-sans">
                Cada abogado somete su carné vigente y número de colegiatura a cotejo manual y digital antes de habilitar su cuenta.
              </p>
            </div>

            <div className="rounded-3xl luxury-glass p-6">
              <div className="h-10 w-10 rounded-2xl bg-[#0F172A] text-blue-400 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] font-serif">Ley N.° 29733 (ANPDP)</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-sans">
                Bancos de datos personales inscritos ante la Autoridad Nacional de Protección de Datos Personales del MINJUSDH.
              </p>
            </div>

            <div className="rounded-3xl luxury-glass p-6">
              <div className="h-10 w-10 rounded-2xl bg-[#0F172A] text-blue-400 flex items-center justify-center mb-4">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] font-serif">Derechos ARCO</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-sans">
                Canal formal garantizado de Acceso, Rectificación, Cancelación y Oposición dentro de los plazos legales perentorios.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/privacidad"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] transition-colors font-mono"
            >
              <span>Conoce nuestra Política de Privacidad y Banco de Datos Oficial</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CTA FINAL DE CONVERSIÓN                                               */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-24 border-t border-slate-200/80 bg-[#F8FAFC]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
            Comienza Hoy Mismo
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A] font-serif">
            El respaldo legal que necesitas está a solo unos clics.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-sans">
            Describe tu consulta en lenguaje sencillo y recibe coincidencias con abogados colegiados habilitados en todo el Perú.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/cases/new"
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0F172A] px-8 py-4 text-base font-bold text-white shadow-xl shadow-slate-900/25 hover:bg-[#1E293B] transition-all border border-slate-800"
            >
              <span>Describir mi problema legal</span>
              <ArrowRight className="w-4 h-4 text-blue-400 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/#como-funciona"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl luxury-glass px-7 py-4 text-base font-semibold text-[#0F172A] hover:bg-white shadow-sm transition-all"
            >
              <HelpCircle className="w-4 h-4 text-[#2563EB]" />
              <span>Ver cómo funciona</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER INSTITUCIONAL COMPLETO (5 COLUMNAS)                             */}
      {/* ========================================================================= */}
      <footer className="border-t border-slate-800 bg-[#0F172A] text-slate-300 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Columna 1: Brand & Manifesto */}
            <div className="col-span-2 space-y-4">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-blue-400 border border-slate-700">
                  <Scale className="h-4.5 w-4.5 stroke-[2.2]" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight font-serif">
                  ALYA<span className="text-blue-400 font-sans text-xs ml-1 italic font-normal">LegalTech</span> Perú
                </span>
              </Link>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-sans">
                Plataforma de matching jurídico de precisión en el Perú. Conecta a personas y empresas con abogados colegiados bajo estrictos criterios de especialidad y ética.
              </p>
              <p className="text-[11px] font-mono text-blue-400">
                Conecta. Encuentra. Resuelve.
              </p>
            </div>

            {/* Columna 2: Plataforma */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Plataforma</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/#como-funciona" className="hover:text-blue-400 transition-colors">¿Cómo funciona?</Link></li>
                <li><Link href="/#matching" className="hover:text-blue-400 transition-colors">Algoritmo de Matching</Link></li>
                <li><Link href="/cases/new" className="hover:text-blue-400 transition-colors">Publicar Caso</Link></li>
                <li><Link href="/login" className="hover:text-blue-400 transition-colors">Iniciar Sesión</Link></li>
              </ul>
            </div>

            {/* Columna 3: Especialidades */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Especialidades</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/cases/new?specialty=derecho-laboral" className="hover:text-blue-400 transition-colors">Derecho Laboral</Link></li>
                <li><Link href="/cases/new?specialty=derecho-penal" className="hover:text-blue-400 transition-colors">Derecho Penal</Link></li>
                <li><Link href="/cases/new?specialty=derecho-civil" className="hover:text-blue-400 transition-colors">Derecho Civil</Link></li>
                <li><Link href="/cases/new?specialty=derecho-familia" className="hover:text-blue-400 transition-colors">Derecho de Familia</Link></li>
                <li><Link href="/cases/new?specialty=derecho-inmobiliario" className="hover:text-blue-400 transition-colors">Derecho Inmobiliario</Link></li>
              </ul>
            </div>

            {/* Columna 4: Legal & Privacidad */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Legal & Privacidad</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/privacidad" className="hover:text-blue-400 transition-colors">Política de Privacidad</Link></li>
                <li><Link href="/privacidad/arco" className="hover:text-blue-400 transition-colors">Ejercicio Derechos ARCO</Link></li>
                <li><Link href="/privacidad#banco-datos" className="hover:text-blue-400 transition-colors">Banco de Datos RNPDP</Link></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Términos y Condiciones</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Libro de Reclamaciones</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
            <p>© 2026 ALYA LegalTech Perú. Todos los derechos reservados. Conforme a la Ley N.° 29733 y D.S. 003-2013-JUS.</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Lima, Perú</span>
              <span>•</span>
              <span>Registro CAL N.° 48921 Validado</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
