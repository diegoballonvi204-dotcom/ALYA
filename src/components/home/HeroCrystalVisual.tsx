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
  const eyeGlowRef = useRef<HTMLDivElement>(null);
  const chipTopRef = useRef<HTMLDivElement>(null);
  const chipBottomRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const faceLayer = faceLayerRef.current;
    const spotlight = spotlightRef.current;
    const eyeGlow = eyeGlowRef.current;
    const chipTop = chipTopRef.current;
    const chipBottom = chipBottomRef.current;
    const glow = glowRef.current;

    if (!card || !faceLayer) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.fromTo(
        card,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
      );
      return;
    }

    // -------------------------------------------------------------
    // INTERACCIÓN FACIAL CON EL MOUSE ("Face & Gaze Follow Tracking")
    // Calcula la posición del cursor RELATIVA AL ROSTRO de la estatua
    // para que la cabeza, mirada y reflejos lumínicos sigan el cursor
    // -------------------------------------------------------------
    let cachedRect: DOMRect | null = null;
    const updateRect = () => {
      if (card) cachedRect = card.getBoundingClientRect();
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, { passive: true });

    // GSAP QuickTo setters for ultra-smooth 60fps tracking
    const cardRotY = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power2.out" });
    const cardRotX = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power2.out" });
    const cardMoveX = gsap.quickTo(card, "x", { duration: 0.6, ease: "power2.out" });
    const cardMoveY = gsap.quickTo(card, "y", { duration: 0.6, ease: "power2.out" });

    const faceRotY = gsap.quickTo(faceLayer, "rotationY", { duration: 0.45, ease: "power2.out" });
    const faceRotX = gsap.quickTo(faceLayer, "rotationX", { duration: 0.45, ease: "power2.out" });
    const faceMoveX = gsap.quickTo(faceLayer, "x", { duration: 0.45, ease: "power2.out" });
    const faceMoveY = gsap.quickTo(faceLayer, "y", { duration: 0.45, ease: "power2.out" });

    const chipTopX = chipTop ? gsap.quickTo(chipTop, "x", { duration: 0.75, ease: "power2.out" }) : null;
    const chipTopY = chipTop ? gsap.quickTo(chipTop, "y", { duration: 0.75, ease: "power2.out" }) : null;

    const chipBottomX = chipBottom ? gsap.quickTo(chipBottom, "x", { duration: 0.85, ease: "power2.out" }) : null;
    const chipBottomY = chipBottom ? gsap.quickTo(chipBottom, "y", { duration: 0.85, ease: "power2.out" }) : null;

    const glowMoveX = glow ? gsap.quickTo(glow, "x", { duration: 1.1, ease: "power2.out" }) : null;
    const glowMoveY = glow ? gsap.quickTo(glow, "y", { duration: 1.1, ease: "power2.out" }) : null;

    const handlePointerMove = (e: MouseEvent | PointerEvent) => {
      if (!cachedRect) updateRect();
      if (!cachedRect) return;

      // Ubicación exacta del rostro de la Dama de la Justicia dentro del marco
      const faceCenterX = cachedRect.left + cachedRect.width * 0.48;
      const faceCenterY = cachedRect.top + cachedRect.height * 0.32;

      // Desplazamiento normalizado desde el centro del rostro
      // -1 (a la izquierda del rostro) a +1 (a la derecha del rostro)
      const deltaX = (e.clientX - faceCenterX) / (cachedRect.width * 0.6);
      const deltaY = (e.clientY - faceCenterY) / (cachedRect.height * 0.55);

      // Limitar suavemente
      const nx = Math.max(-1.4, Math.min(1.4, deltaX));
      const ny = Math.max(-1.4, Math.min(1.4, deltaY));

      // 1. Inclinación 3D del marco exterior
      cardRotY(nx * 8);
      cardRotX(-ny * 8);
      cardMoveX(nx * 8);
      cardMoveY(ny * 6);

      // 2. Movimiento y giro tridimensional del rostro de la Dama de la Justicia
      // Anclado en su rostro (48% 22%) para orientar su cabeza hacia donde esté el mouse
      faceRotY(nx * 20);
      faceRotX(-ny * 16);
      faceMoveX(nx * 22);
      faceMoveY(ny * 18);

      // 3. Foco especular dinámico que viaja sobre el rostro de bronce y la venda
      if (spotlight) {
        const lightX = 48 + nx * 26;
        const lightY = 22 + ny * 22;
        spotlight.style.background = `radial-gradient(circle 180px at ${lightX}% ${lightY}%, rgba(96, 165, 250, 0.75) 0%, rgba(59, 130, 246, 0.3) 30%, transparent 68%)`;
      }

      // 4. Destello en la venda / mirada de la justicia
      if (eyeGlow) {
        gsap.to(eyeGlow, {
          x: nx * 14,
          y: ny * 8,
          opacity: 0.6 + Math.abs(nx) * 0.4,
          duration: 0.3,
          ease: "power2.out",
        });
      }

      // 5. Chips satélite en contra-perspectiva
      if (chipTopX && chipTopY) {
        chipTopX(nx * -22);
        chipTopY(ny * -18);
      }
      if (chipBottomX && chipBottomY) {
        chipBottomX(nx * 24);
        chipBottomY(ny * 18);
      }

      // 6. Halo ambiental
      if (glowMoveX && glowMoveY) {
        glowMoveX(nx * 40);
        glowMoveY(ny * 40);
      }
    };

    const handlePointerLeave = () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        x: 0,
        y: 0,
        ease: "power3.out",
        duration: 0.9,
      });

      gsap.to(faceLayer, {
        rotationX: 0,
        rotationY: 0,
        x: 0,
        y: 0,
        ease: "power3.out",
        duration: 0.9,
      });

      if (spotlight) {
        spotlight.style.background = `radial-gradient(circle 180px at 48% 22%, rgba(96, 165, 250, 0.5) 0%, rgba(59, 130, 246, 0.2) 30%, transparent 68%)`;
      }

      if (eyeGlow) {
        gsap.to(eyeGlow, { x: 0, y: 0, opacity: 0.4, duration: 0.8 });
      }

      if (chipTop) {
        gsap.to(chipTop, { x: 0, y: 0, duration: 0.9, ease: "power3.out" });
      }
      if (chipBottom) {
        gsap.to(chipBottom, { x: 0, y: 0, duration: 0.9, ease: "power3.out" });
      }
      if (glow) {
        gsap.to(glow, { x: 0, y: 0, duration: 1.2, ease: "power3.out" });
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);

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
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
      document.removeEventListener("mouseleave", handlePointerLeave);
      gsap.killTweensOf([card, faceLayer, chipTop, chipBottom, glow]);
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
        className="relative z-10 w-full rounded-[32px] bg-gradient-to-b from-[#0F172A] via-[#101828] to-[#0A0F1D] border border-slate-800 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.45)] p-4 sm:p-6 overflow-hidden flex flex-col justify-between text-white transition-shadow duration-300 hover:shadow-[0_40px_100px_-20px_rgba(49,87,213,0.35)] cursor-pointer"
        style={{ transformStyle: "preserve-3d", perspective: 1100 }}
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
        <div className="relative my-2 sm:my-3 w-full h-[390px] sm:h-[450px] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-black group">
          {/* Capa del rostro animada con rotación y desplazamiento de perspectiva */}
          <div
            ref={faceLayerRef}
            className="relative w-full h-full scale-[1.08] transition-transform duration-75"
            style={{
              transformOrigin: "48% 22%", // Anclado en la frente, rostro y venda de la Dama de la Justicia
              willChange: "transform",
              transformStyle: "preserve-3d",
            }}
          >
            <Image
              src="/images/lady-justice.jpg"
              alt="Dama de la Justicia con la Balanza y la Espada — ALYA LegalTech"
              fill
              priority
              className="object-cover object-center pointer-events-none"
              sizes="(max-width: 768px) 100vw, 540px"
            />

            {/* Foco de luz especular interactiva que se desplaza sobre el rostro */}
            <div
              ref={spotlightRef}
              className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-all duration-100 ease-out"
              style={{
                background:
                  "radial-gradient(circle 180px at 48% 22%, rgba(96, 165, 250, 0.65) 0%, rgba(59, 130, 246, 0.25) 30%, transparent 68%)",
              }}
            />

            {/* Resplandor holográfico sutil centrado en la mirada y venda de la justicia */}
            <div
              ref={eyeGlowRef}
              className="absolute top-[18%] left-[42%] w-[80px] h-[30px] rounded-full bg-cyan-400/30 blur-md pointer-events-none mix-blend-screen opacity-40 transition-opacity"
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
