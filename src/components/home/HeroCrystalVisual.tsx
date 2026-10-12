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
  Scale,
  Gavel,
  FileCheck,
} from "lucide-react";

export function HeroCrystalVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const chipLeftRef = useRef<HTMLDivElement>(null);
  const chipRightRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const scaleBeamRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    const chipLeft = chipLeftRef.current;
    const chipRight = chipRightRef.current;
    const glow = glowRef.current;
    const scaleBeam = scaleBeamRef.current;

    if (!container || !card) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    // Subtle breathing balance oscillation
    let idleAnim: gsap.core.Tween | null = null;
    if (scaleBeam && !prefersReducedMotion) {
      idleAnim = gsap.to(scaleBeam, {
        rotation: 2.2,
        transformOrigin: "center center",
        repeat: -1,
        yoyo: true,
        duration: 3,
        ease: "sine.inOut",
      });
    }

    if (prefersReducedMotion || isTouchDevice) {
      gsap.fromTo(
        card,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
      );
      return () => {
        idleAnim?.kill();
      };
    }

    // 3D Parallax & Specular tracking on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

      // Main Card 3D Tilt
      gsap.to(card, {
        rotationY: x * 8,
        rotationX: -y * 8,
        x: x * 10,
        y: y * 8,
        transformPerspective: 1200,
        ease: "power2.out",
        duration: 0.7,
      });

      // Satellite chip left (Expediente Legal)
      if (chipLeft) {
        gsap.to(chipLeft, {
          x: x * -16,
          y: y * -14,
          rotationZ: x * -2,
          ease: "power2.out",
          duration: 0.9,
        });
      }

      // Satellite chip right (Bóveda AES-256)
      if (chipRight) {
        gsap.to(chipRight, {
          x: x * 20,
          y: y * 16,
          rotationZ: x * 2,
          ease: "power2.out",
          duration: 1,
        });
      }

      // Ambient Specular Glow
      if (glow) {
        gsap.to(glow, {
          x: x * 35,
          y: y * 35,
          ease: "power2.out",
          duration: 1.2,
        });
      }

      // Dynamic tilt on scale beam
      if (scaleBeam) {
        gsap.to(scaleBeam, {
          rotation: x * 4,
          transformOrigin: "center center",
          ease: "power2.out",
          duration: 0.8,
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
        duration: 1,
      });
      if (scaleBeam) {
        gsap.to(scaleBeam, {
          rotation: 0,
          transformOrigin: "center center",
          ease: "power3.out",
          duration: 1,
        });
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // Initial cinematic entrance
    gsap.fromTo(
      card,
      { opacity: 0, y: 30, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "power3.out" }
    );

    if (chipLeft) {
      gsap.fromTo(
        chipLeft,
        { opacity: 0, x: -25 },
        { opacity: 1, x: 0, duration: 1.2, ease: "back.out(1.4)", delay: 0.2 }
      );
    }

    if (chipRight) {
      gsap.fromTo(
        chipRight,
        { opacity: 0, x: 25 },
        { opacity: 1, x: 0, duration: 1.2, ease: "back.out(1.4)", delay: 0.3 }
      );
    }

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      idleAnim?.kill();
      gsap.killTweensOf([card, chipLeft, chipRight, glow, scaleBeam]);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto lg:max-w-none select-none py-4 sm:py-6"
    >
      {/* Background Specular Ambient Glows */}
      <div
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-gradient-to-tr from-[#3157D5]/15 via-blue-500/10 to-cyan-400/10 blur-3xl pointer-events-none -z-10"
      />
      <div className="absolute top-8 right-6 h-64 w-64 rounded-full bg-[#101828]/5 blur-3xl pointer-events-none -z-10" />

      {/* SATELLITE CHIP 1 (Top Left) - Legal File Case Input */}
      <div
        ref={chipLeftRef}
        className="absolute -top-3 -left-2 sm:-left-6 z-20 hidden sm:flex items-center gap-3 rounded-2xl luxury-glass px-4 py-3 shadow-xl border border-slate-200/90"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#101828] text-[#4777F5] shadow-xs">
          <FileCheck className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#3157D5] uppercase tracking-wider font-mono">
            Expediente Activo
          </p>
          <p className="text-xs font-bold text-[#101828]">Materia: Tutela Laboral</p>
        </div>
        <span className="rounded-full bg-blue-50 text-[#3157D5] border border-blue-200 px-2.5 py-0.5 text-[9px] font-bold ml-1 font-mono">
          98.5% Certeza
        </span>
      </div>

      {/* SATELLITE CHIP 2 (Bottom Right) - Encrypted Vault */}
      <div
        ref={chipRightRef}
        className="absolute -bottom-4 -right-2 sm:-right-5 z-20 hidden sm:flex items-center gap-3 rounded-2xl luxury-glass px-4 py-3 shadow-xl border border-slate-200/90"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#101828] border border-slate-200 shadow-xs">
          <Lock className="h-4 w-4 text-[#3157D5]" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Ley N.° 29733
          </p>
          <p className="text-xs font-bold text-[#101828]">Bóveda Cifrada AES-256</p>
        </div>
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* MAIN 3D ARCHITECTURAL SHOWCASE CARD */}
      <div
        ref={cardRef}
        className="relative z-10 rounded-3xl luxury-glass p-6 sm:p-7 shadow-[0_28px_65px_-15px_rgba(16,24,40,0.12)] border border-slate-200/90"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Optical Glass Sheen */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/50 via-transparent to-blue-50/20 pointer-events-none" />

        {/* 1. Header: Live Compatibility Badge + CAL Verification */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#101828] px-3.5 py-1.5 shadow-md">
            <span className="flex h-2 w-2 rounded-full bg-[#4777F5] animate-ping" />
            <span className="text-[11px] font-bold text-white tracking-wide font-mono">
              98.2% Compatibilidad
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#101828] bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-mono text-[10.5px]">Colegiada CAL Habilitada</span>
          </div>
        </div>

        {/* 2. Interactive Legal Sculpture Ribbon (Stylized Scale & Gavel in Metallic Chrome) */}
        <div className="mt-4 py-3 px-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#101828] to-slate-900 text-white shadow-lg border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Elegant SVG Metallic Scale of Justice */}
            <div className="relative w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/80 shadow-inner">
              <svg
                className="w-7 h-7 text-slate-200 drop-shadow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Central Column */}
                <path d="M12 3v17" stroke="url(#colGrad)" />
                <path d="M5 21h14" stroke="#94A3B8" />
                {/* Oscillating Beam with pans */}
                <g ref={scaleBeamRef}>
                  <path d="M5 6h14" stroke="#E2E8F0" />
                  {/* Left Pan */}
                  <path d="M5 6l-3 7h6l-3-7z" stroke="#93C5FD" fill="#1E293B" fillOpacity="0.4" />
                  {/* Right Pan */}
                  <path d="M19 6l-3 7h6l-3-7z" stroke="#93C5FD" fill="#1E293B" fillOpacity="0.4" />
                </g>
                <circle cx="12" cy="3" r="1.5" fill="#60A5FA" />
                <defs>
                  <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#64748B" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                  Equilibrio Procesal
                </span>
                <span className="h-1 w-1 rounded-full bg-blue-400" />
                <span className="text-[10px] text-slate-400 font-mono">Bilateral</span>
              </div>
              <p className="text-xs font-bold text-white tracking-tight">
                Correspondencia Doctrinal Auditada
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-700/80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              <Gavel className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-right">
              <span className="block text-[9px] font-mono text-slate-400 uppercase">Criterio</span>
              <span className="text-[10.5px] font-bold text-slate-200">Ley N.° 29733</span>
            </div>
          </div>
        </div>

        {/* 3. Matched Lawyer Profile Presentation */}
        <div className="mt-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          {/* Avatar with midnight metallic border */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-[#101828] via-[#1E293B] to-[#334155] p-1 shadow-md">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#101828] text-white text-xl font-bold font-serif">
                ER
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#3157D5] text-white shadow-md border-2 border-white">
              <ShieldCheck className="h-3.5 w-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#101828] tracking-tight font-serif">
              Dra. Elena Ramos Morales
            </h3>
            <p className="text-xs font-semibold text-[#3157D5] mt-0.5 font-mono">
              Registro CAL N.° 48921 • Lima
            </p>
            <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
              Especialista en Derecho Laboral Corporativo, despidos arbitrarios y tutela de derechos. Posgrado PUCP.
            </p>
          </div>
        </div>

        {/* 4. Analytical Metric Chips */}
        <div className="mt-5 grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50/90 p-3.5 border border-slate-200/80 shadow-xs">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-[#101828] font-bold text-sm font-mono">
              <Star className="h-3.5 w-3.5 fill-[#3157D5] text-[#3157D5]" />
              <span>4.96</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">142 Reseñas</p>
          </div>

          <div className="text-center border-x border-slate-200">
            <div className="flex items-center justify-center gap-1 text-[#101828] font-bold text-sm font-mono">
              <Clock className="h-3.5 w-3.5 text-[#3157D5]" />
              <span>&lt; 15m</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Respuesta</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-[#101828] font-bold text-sm font-mono">
              <Briefcase className="h-3.5 w-3.5 text-[#101828]" />
              <span>12 Años</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Litigación</p>
          </div>
        </div>

        {/* 5. Case Analysis Hypothesis Pill */}
        <div className="mt-3.5 rounded-xl bg-white border border-slate-200 p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5 font-mono text-[11px]">
              <TrendingUp className="h-3.5 w-3.5 text-[#3157D5]" />
              Hipótesis Ponderada:
            </span>
            <span className="font-mono text-[10px] font-bold text-[#3157D5] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Caso Factible
            </span>
          </div>
          <p className="text-[11.5px] text-slate-600 leading-relaxed">
            "Despido incausado con liquidación pendiente. Requiere cálculo de indemnización y citación de conciliación ante el MTPE."
          </p>
        </div>

        {/* 6. Footer inside card */}
        <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-slate-200/70">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <div className="h-6 w-6 rounded-full bg-[#101828] text-white text-[9px] flex items-center justify-center font-bold border border-white font-mono">
                CAL
              </div>
              <div className="h-6 w-6 rounded-full bg-[#3157D5] text-white text-[9px] flex items-center justify-center font-bold border border-white font-mono">
                PUCP
              </div>
            </div>
            <span className="text-[10.5px] text-slate-500 font-medium">Credenciales auditadas</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-3.5 py-1.5 text-xs font-bold text-white transition-colors shadow-xs">
            <span>Match Bilateral</span>
            <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
