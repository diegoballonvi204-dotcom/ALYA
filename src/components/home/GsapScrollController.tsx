"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function GsapScrollController() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 1024px)",
        isMobile: "(max-width: 1023px)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isDesktop, reduceMotion } = context.conditions as {
          isDesktop: boolean;
          isMobile: boolean;
          reduceMotion: boolean;
        };

        if (reduceMotion) {
          // If reduced motion is requested, render everything static and visible immediately
          gsap.set(
            [
              ".gsap-step-card",
              ".gsap-specialty-card",
              ".gsap-story-scene",
              ".gsap-story-node",
            ],
            { opacity: 1, y: 0, scale: 1 }
          );
          return;
        }

        // -------------------------------------------------------------
        // ESCENA 1: EL PROBLEMA & METODOLOGÍA (Paso a paso progresivo)
        // -------------------------------------------------------------
        const stepCards = gsap.utils.toArray<HTMLElement>(".gsap-step-card");
        if (stepCards.length > 0) {
          gsap.fromTo(
            stepCards,
            {
              opacity: 0,
              y: isDesktop ? 45 : 25,
              rotationX: isDesktop ? 6 : 0,
              scale: 0.96,
            },
            {
              opacity: 1,
              y: 0,
              rotationX: 0,
              scale: 1,
              stagger: 0.12,
              duration: 0.85,
              ease: "power3.out",
              scrollTrigger: {
                trigger: "#como-funciona",
                start: "top 78%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        // -------------------------------------------------------------
        // ESCENA 2: LA CONEXIÓN & ALGORITMO (Matching ponderado)
        // -------------------------------------------------------------
        const matchingSection = document.querySelector("#matching");
        if (matchingSection) {
          const matchNodes = document.querySelectorAll(".gsap-match-pulse");
          if (matchNodes.length > 0) {
            gsap.fromTo(
              matchNodes,
              { scale: 0.85, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                stagger: 0.15,
                duration: 0.8,
                ease: "back.out(1.4)",
                scrollTrigger: {
                  trigger: "#matching",
                  start: "top 75%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }
        }

        // -------------------------------------------------------------
        // ESCENA 3: EL DESCUBRIMIENTO & ESPECIALIDADES
        // -------------------------------------------------------------
        const specialtyCards = gsap.utils.toArray<HTMLElement>(".gsap-specialty-card");
        if (specialtyCards.length > 0) {
          gsap.fromTo(
            specialtyCards,
            {
              opacity: 0,
              y: 35,
            },
            {
              opacity: 1,
              y: 0,
              stagger: isDesktop ? 0.07 : 0.04,
              duration: 0.75,
              ease: "power2.out",
              scrollTrigger: {
                trigger: "#especialidades",
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        // -------------------------------------------------------------
        // ESCENA 4: LA CONFIANZA & SEGURIDAD (Ley N.° 29733, CAL)
        // -------------------------------------------------------------
        const trustCards = gsap.utils.toArray<HTMLElement>(".gsap-trust-card");
        if (trustCards.length > 0) {
          gsap.fromTo(
            trustCards,
            {
              opacity: 0,
              y: 30,
              scale: 0.98,
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              stagger: 0.1,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: "#seguridad",
                start: "top 82%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        // -------------------------------------------------------------
        // ESCENA 5: LA ACCIÓN (Final CTA reveal)
        // -------------------------------------------------------------
        const actionBox = document.querySelector(".gsap-action-box");
        if (actionBox) {
          gsap.fromTo(
            actionBox,
            { opacity: 0, y: 40, scale: 0.97 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: actionBox,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        // -------------------------------------------------------------
        // PARALLAX ATMOSPHERIC ORBS (Differential depth scrub)
        // -------------------------------------------------------------
        const parallaxOrbs = gsap.utils.toArray<HTMLElement>(".gsap-parallax-orb");
        parallaxOrbs.forEach((orb, i) => {
          const speed = (i + 1) * (isDesktop ? 30 : 15);
          gsap.to(orb, {
            y: -speed,
            ease: "none",
            scrollTrigger: {
              trigger: orb.parentElement || document.body,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          });
        });
      }
    );

    return () => {
      mm.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return null;
}
