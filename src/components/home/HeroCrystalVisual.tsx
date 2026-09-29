"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  ShieldCheck,
  Star,
  Sparkles,
  Lock,
  Clock,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export function HeroCrystalVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const chipLeftRef = useRef<HTMLDivElement>(null);
  const chipRightRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    const chipLeft = chipLeftRef.current;
    const chipRight = chipRightRef.current;
    const glow = glowRef.current;

    if (!container || !card) return;

    // Mouse movement 3D Parallax with GSAP
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const xPercent = x / (rect.width / 2);
      const yPercent = y / (rect.height / 2);

      // Main card 3D tilt
      gsap.to(card, {
        rotationY: xPercent * 9,
        rotationX: -yPercent * 9,
        x: xPercent * 10,
        y: yPercent * 10,
        transformPerspective: 1200,
        ease: "power2.out",
        duration: 0.8,
      });

      // Satellite chip left
      if (chipLeft) {
        gsap.to(chipLeft, {
          x: xPercent * -18,
          y: yPercent * -16 + (Math.sin(Date.now() / 800) * 4),
          rotationZ: xPercent * -3,
          ease: "power2.out",
          duration: 1.1,
        });
      }

      // Satellite chip right
      if (chipRight) {
        gsap.to(chipRight, {
          x: xPercent * 24,
          y: yPercent * 20,
          rotationZ: xPercent * 2.5,
          ease: "power2.out",
          duration: 1.2,
        });
      }

      // Dynamic ambient specular glow
      if (glow) {
        gsap.to(glow, {
          x: xPercent * 40,
          y: yPercent * 40,
          ease: "power2.out",
          duration: 1.5,
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to([card, chipLeft, chipRight, glow], {
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        x: 0,
        y: 0,
        ease: "power3.out",
        duration: 1.2,
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // Initial entrance animation
    gsap.fromTo(
      card,
      { opacity: 0, y: 35, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out", delay: 0.1 }
    );

    if (chipLeft) {
      gsap.fromTo(
        chipLeft,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 1.3, ease: "back.out(1.5)", delay: 0.3 }
      );
    }

    if (chipRight) {
      gsap.fromTo(
        chipRight,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 1.3, ease: "back.out(1.5)", delay: 0.4 }
      );
    }

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-auto lg:max-w-none select-none py-6">
      {/* Background Parallax Ambient Glows */}
      <div
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none -z-10"
      />
      <div className="absolute top-10 right-4 h-64 w-64 rounded-full bg-slate-800/5 blur-3xl pointer-events-none -z-10" />

      {/* Satellite Floating Card (Top Left) - Semantic Analysis */}
      <div
        ref={chipLeftRef}
        className="absolute -top-3 -left-2 sm:-left-6 z-20 hidden sm:flex items-center gap-3 rounded-2xl luxury-glass px-4 py-3 shadow-xl border border-slate-200/90"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A] text-blue-400 shadow-inner">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Análisis Semántico</p>
          <p className="text-xs font-bold text-[#0F172A]">Materia: Derecho Laboral</p>
        </div>
        <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[9px] font-bold ml-1 font-mono">
          98.5% Certeza
        </span>
      </div>

      {/* Satellite Floating Card (Bottom Right) - Encrypted Vault */}
      <div
        ref={chipRightRef}
        className="absolute -bottom-4 -right-2 sm:-right-5 z-20 hidden sm:flex items-center gap-3 rounded-2xl luxury-glass px-4 py-3 shadow-xl border border-slate-200/90"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">
          <Lock className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ley N.° 29733</p>
          <p className="text-xs font-bold text-[#0F172A]">Bóveda Cifrada AES-256</p>
        </div>
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* Main 3D Glass Showcase Card */}
      <div
        ref={cardRef}
        className="relative z-10 rounded-3xl luxury-glass p-6 sm:p-8 shadow-[0_28px_65px_-15px_rgba(15,23,42,0.12)] border border-slate-200/90"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Subtle Diagonal Specular Reflection */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/40 via-transparent to-blue-50/20 pointer-events-none" />

        {/* Card Header: Match Affinity Pill & Live Status */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-3.5 py-1.5 shadow-md">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-ping" />
            <span className="text-[11px] font-bold text-white tracking-wide font-mono">
              98.2% Compatibilidad
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Colegiada CAL Habilitada</span>
          </div>
        </div>

        {/* Lawyer Profile Presentation */}
        <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          {/* Avatar with luxury midnight frame */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#334155] p-1 shadow-md">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0F172A] text-white text-xl font-bold font-serif">
                ER
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md border-2 border-white">
              <ShieldCheck className="h-3.5 w-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#0F172A] tracking-tight font-serif">
              Dra. Elena Ramos Morales
            </h3>
            <p className="text-xs font-semibold text-blue-600 mt-0.5 font-mono">
              Registro CAL N.° 48921 • Lima
            </p>
            <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
              Especialista en Derecho Laboral Corporativo, despidos intempestivos y tutela de derechos. Posgrado PUCP.
            </p>
          </div>
        </div>

        {/* Analytical Metric Chips */}
        <div className="mt-6 grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/80 shadow-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-[#0F172A] font-bold text-sm font-mono">
              <Star className="h-3.5 w-3.5 fill-blue-600 text-blue-600" />
              <span>4.96</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">142 Reseñas</p>
          </div>

          <div className="text-center border-x border-slate-200">
            <div className="flex items-center justify-center gap-1 text-[#0F172A] font-bold text-sm font-mono">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>&lt; 15m</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Respuesta</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-[#0F172A] font-bold text-sm font-mono">
              <Briefcase className="h-3.5 w-3.5 text-[#0F172A]" />
              <span>12 Años</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Litigación</p>
          </div>
        </div>

        {/* Case Analysis Breakdown Pill */}
        <div className="mt-4 rounded-xl bg-white border border-slate-200 p-3.5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5 font-mono text-[11px]">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
              Hipótesis Ponderada:
            </span>
            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              Caso Factible
            </span>
          </div>
          <p className="text-[11.5px] text-slate-600 leading-relaxed">
            "Despido incausado con liquidación pendiente. Requiere cálculo de indemnización y citación de conciliación ante el MTPE."
          </p>
        </div>

        {/* Action Button inside visual card */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <div className="h-6 w-6 rounded-full bg-[#0F172A] text-white text-[9px] flex items-center justify-center font-bold border border-white font-mono">
                CAL
              </div>
              <div className="h-6 w-6 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold border border-white font-mono">
                PUCP
              </div>
            </div>
            <span className="text-[10.5px] text-slate-500 font-medium">Credenciales auditadas</span>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm"
          >
            <span>Conectar</span>
            <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
