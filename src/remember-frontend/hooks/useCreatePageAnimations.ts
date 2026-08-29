import { useEffect, useRef } from "react";
import { gsap, getScrollTrigger } from "../lib/gsap";

export function useCreatePageAnimations() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const ScrollTrigger = getScrollTrigger();
    if (!root || !ScrollTrigger) return;

    const ctx = gsap.context(() => {
      const heroItems = root.querySelectorAll("[data-animate='hero']");
      gsap.from(heroItems, {
        y: 36,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.15,
      });

      const gridSection = root.querySelector("[data-animate='grid-section']");
      if (gridSection) {
        gsap.from(gridSection, {
          y: 48,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: gridSection,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        });
      }

      ScrollTrigger.batch("[data-animate='repo-card']", {
        interval: 0.08,
        batchMax: 6,
        onEnter: (batch) => {
          gsap.from(batch, {
            y: 32,
            opacity: 0,
            duration: 0.65,
            stagger: 0.08,
            ease: "power2.out",
            overwrite: true,
          });
        },
        once: true,
        start: "top 92%",
      });

      const recentSection = root.querySelector("[data-animate='recent']");
      if (recentSection) {
        gsap.from(recentSection, {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: recentSection,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return rootRef;
}
