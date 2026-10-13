"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Scale,
  FileCheck,
} from "lucide-react";

export function HeroCrystalVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const faceLayerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const chipTopRef = useRef<HTMLDivElement>(null);
  const chipBottomRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const faceLayer = faceLayerRef.current;
    const spotlight = spotlightRef.current;
    const chipTop = chipTopRef.current;
    const chipBottom = chipBottomRef.current;
    const glow = glowRef.current;

    if (!card || !faceLayer) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    if (prefersReducedMotion || isTouchDevice) {
      gsap.fromTo(
        card,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
      );
      return;
    }

    // -------------------------------------------------------------
    // INTERACCIÓN FACIAL CON EL MOUSE ("Face & Head Motion Field")
    // Escucha en todo el viewport para que la mirada y rostro de
    // la Dama de la Justicia sigan el cursor continuamente
    // -------------------------------------------------------------
    const handleMouseMove = (e: MouseEvent) => {
      // Normalizado de -1 a 1 basado en la pantalla completa
      const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);

      // 1. Marco exterior 3D
      gsap.to(card, {
        rotationY: x * 8,
        rotationX: -y * 8,
        x: x * 10,
        y: y * 8,
        transformPerspective: 1200,
        ease: "power2.out",
        duration: 0.65,
      });

      // 2. Rostro y busto de la Dama de la Justicia:
      // Anclado en 48% 22% (zona exacta del rostro y la venda)
      // para que gire y oriente su mirada hacia el cursor con profundidad 3D
      gsap.to(faceLayer, {
        rotationY: x * 16,
        rotationX: -y * 13,
        x: x * 22,
        y: y * 18,
        scale: 1.09,
        transformPerspective: 900,
        ease: "power2.out",
        duration: 0.55,
      });

      // 3. Foco de luz especular dinámica sobre el rostro
      if (spotlight) {
        gsap.to(spotlight, {
          x: x * 35,
          y: y * 30,
          opacity: 0.55 + Math.abs(x) * 0.35,
          ease: "power2.out",
          duration: 0.7,
        });
      }

      // 4. Chip superior (Expediente Activo) con contra-paralaje
      if (chipTop) {
        gsap.to(chipTop, {
          x: x * -24,
          y: y * -18,
          rotationZ: x * -3,
          ease: "power2.out",
          duration: 0.85,
        });
      }

      // 5. Chip inferior (Bóveda AES-256)
      if (chipBottom) {
        gsap.to(chipBottom, {
          x: x * 26,
          y: y * 20,
          rotationZ: x * 3,
          ease: "power2.out",
          duration: 0.95,
        });
      }

      // 6. Halo ambiental de fondo
      if (glow) {
        gsap.to(glow, {
          x: x * 45,
          y: y * 45,
          ease: "power2.out",
          duration: 1.2,
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to([card, faceLayer, spotlight, chipTop, chipBottom, glow], {
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        x: 0,
        y: 0,
        scale: 1,
        ease: "power3.out",
        duration: 1.2,
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    // Entrada cinematográfica inicial
    gsap.fromTo(
      card,
      { opacity: 0, scale: 0.95, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "power3.out" }
    );

    if (chipTop) {
      gsap.fromTo(
        chipTop,
        { opacity: 0, x: -25 },
        { opacity: 1, x: 0, duration: 1.2, ease: "back.out(1.4)", delay: 0.25 }
      );
    }

    if (chipBottom) {
      gsap.fromTo(
        chipBottom,
        { opacity: 0, x: 25 },
        { opacity: 1, x: 0, duration: 1.2, ease: "back.out(1.4)", delay: 0.35 }
      );
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf([card, faceLayer, spotlight, chipTop, chipBottom, glow]);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[540px] mx-auto select-none py-4 sm:py-6"
      aria-label="Escena jurídica de alta gama de ALYA"
    >
      {/* Halo de atmósfera zafiro en fondo */}
      <div
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-tr from-[#3157D5]/20 via-[#4777F5]/10 to-cyan-400/15 blur-3xl pointer-events-none -z-10"
      />

      {/* SATELLITE CHIP 1 (Top Left) - Expediente Activo */}
      <div
        ref={chipTopRef}
        className="absolute -top-3 -left-2 sm:-left-6 z-30 hidden sm:flex items-center gap-3 rounded-2xl luxury-glass px-4 py-3 shadow-xl border border-slate-200/90 pointer-events-none backdrop-blur-md"
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
        <span className="rounded-full bg-blue-50 text-[#3157D5] border border-blue-200 px-2 py-0.5 text-[9px] font-bold ml-1 font-mono">
          98.5% Certeza
        </span>
      </div>

      {/* SATELLITE CHIP 2 (Bottom Right) - Bóveda Cifrada */}
      <div
        ref={chipBottomRef}
        className="absolute -bottom-4 -right-2 sm:-right-5 z-30 hidden sm:flex items-center gap-3 rounded-2xl luxury-glass px-4 py-3 shadow-xl border border-slate-200/90 pointer-events-none backdrop-blur-md"
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

      {/* MARCO ARQUITECTÓNICO DE CRISTAL OSCURO */}
      <div
        ref={cardRef}
        className="relative z-10 w-full rounded-[32px] bg-gradient-to-b from-[#0F172A] via-[#101828] to-[#0A0F1D] border border-slate-800 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.45)] p-4 sm:p-6 overflow-hidden flex flex-col justify-between text-white"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Destello sutil superior */}
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/10 via-transparent to-blue-500/10 pointer-events-none" />

        {/* 1. BARRA SUPERIOR DE ESTADO */}
        <div className="flex items-center justify-between gap-2 relative z-20 pb-3 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3.5 py-1.5 shadow-md border border-white/10">
            <span className="flex h-2 w-2 rounded-full bg-[#4777F5] animate-ping" />
            <span className="text-[11px] font-bold text-white tracking-wide font-mono">
              98.2% Compatibilidad Legal
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-[10.5px]">Colegiatura CAL Auditada</span>
          </div>
        </div>

        {/* 2. ESCULTURA CON SEGUIMIENTO FACIAL 3D */}
        <div className="relative my-2 sm:my-3 w-full h-[390px] sm:h-[450px] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-black">
          {/* Capa del rostro animada con rotación y desplazamiento de perspectiva */}
          <div
            ref={faceLayerRef}
            className="relative w-full h-full"
            style={{
              transformOrigin: "48% 22%", // Ubicación exacta del rostro y venda de la estatua
              willChange: "transform",
              transformStyle: "preserve-3d",
            }}
          >
            <Image
              src="/images/lady-justice.jpg"
              alt="Dama de la Justicia con la Balanza y la Espada — ALYA LegalTech"
              fill
              priority
              className="object-cover object-center scale-105 pointer-events-none"
              sizes="(max-width: 768px) 100vw, 540px"
            />

            {/* Foco de luz especular interactiva sobre el rostro */}
            <div
              ref={spotlightRef}
              className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-60 bg-[radial-gradient(circle_at_48%_22%,rgba(71,119,245,0.45)_0%,rgba(56,189,248,0.2)_28%,transparent_62%)]"
            />
          </div>

          {/* Insignia inferior de equilibrio legal */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-[#101828]/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-lg pointer-events-none">
            <Scale className="h-4 w-4 text-[#4777F5]" />
            <span className="text-[11px] font-mono font-medium tracking-wide">
              Equilibrio Procesal • Ley N.° 29733
            </span>
          </div>
        </div>

        {/* 3. RESUMEN DE PERFIL COLEGIADO */}
        <div className="relative z-20 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#1E293B] to-[#3157D5] text-white flex items-center justify-center font-bold text-sm font-serif shrink-0 shadow-md border border-slate-700">
              CAL
            </div>
            <div>
              <p className="text-xs font-bold text-white font-serif">
                Dra. Elena Ramos Morales
              </p>
              <p className="text-[10px] text-blue-400 font-mono font-medium">
                Reg. CAL N.° 48921 • Tutela Laboral • PUCP
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Habilitada</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#3157D5] hover:bg-[#2547BD] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-colors cursor-pointer">
              <span>Match Bilateral</span>
              <ArrowRight className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
