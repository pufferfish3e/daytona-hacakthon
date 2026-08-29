import { useEffect, useRef } from "react";
import { gsap, getScrollTrigger } from "../lib/gsap";

export function useLandingPageAnimations() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const ScrollTrigger = getScrollTrigger();
    if (!root || !ScrollTrigger) return;

    const ctx = gsap.context(() => {
      const heroItems = root.querySelectorAll("[data-animate='hero']");
      if (heroItems.length) {
        gsap.from(heroItems, {
          y: 40,
          opacity: 0,
          duration: 1,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.2,
        });
      }

      ScrollTrigger.batch("[data-animate='section']", {
        interval: 0.1,
        batchMax: 3,
        onEnter: (batch) => {
          gsap.from(batch, {
            y: 48,
            opacity: 0,
            duration: 0.85,
            stagger: 0.08,
            ease: "power2.out",
            overwrite: true,
          });
        },
        once: true,
        start: "top 88%",
      });

      ScrollTrigger.batch("[data-animate='card']", {
        interval: 0.08,
        batchMax: 6,
        onEnter: (batch) => {
          gsap.from(batch, {
            y: 32,
            opacity: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: "power2.out",
            overwrite: true,
          });
        },
        once: true,
        start: "top 92%",
      });

      ScrollTrigger.batch("[data-animate='logo']", {
        interval: 0.05,
        batchMax: 8,
        onEnter: (batch) => {
          gsap.from(batch, {
            y: 16,
            opacity: 0,
            duration: 0.6,
            stagger: 0.06,
            ease: "power2.out",
            overwrite: true,
          });
        },
        once: true,
        start: "top 95%",
      });

      const terminal = root.querySelector("[data-animate='terminal']");
      if (terminal) {
        gsap.from(terminal, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: terminal,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return rootRef;
}
