"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function GsapScrollController() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // 1. Staggered reveal for "¿Cómo funciona?" Crystal Cards
    const cards = document.querySelectorAll(".gsap-step-card");
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 50,
          rotationX: 8,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          scale: 1,
          stagger: 0.14,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#como-funciona",
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }

    // 2. Parallax drift for specialty cards
    const specialtyCards = document.querySelectorAll(".gsap-specialty-card");
    if (specialtyCards.length > 0) {
      gsap.fromTo(
        specialtyCards,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#especialidades",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }

    // 3. Smooth background floating parallax elements
    const parallaxOrbs = document.querySelectorAll(".gsap-parallax-orb");
    parallaxOrbs.forEach((orb, i) => {
      const speed = (i + 1) * 25;
      gsap.to(orb, {
        y: -speed,
        ease: "none",
        scrollTrigger: {
          trigger: orb.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return null;
}
