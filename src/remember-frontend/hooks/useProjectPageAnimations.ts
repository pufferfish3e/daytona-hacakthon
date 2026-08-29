import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

export function useProjectPageAnimations(projectId?: string) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !projectId) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-animate='project-header']", {
        y: -12,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });

      gsap.from("[data-animate='project-col']", {
        x: (_i, el) => {
          const side = (el as HTMLElement).dataset.side;
          return side === "left" ? -24 : side === "right" ? 24 : 0;
        },
        opacity: 0,
        duration: 0.75,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.1,
      });

      gsap.from("[data-animate='repair-lane']", {
        y: 28,
        opacity: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.35,
      });

      gsap.from("[data-animate='snapshot']", {
        scale: 0.96,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        delay: 0.2,
      });
    }, root);

    return () => ctx.revert();
  }, [projectId]);

  return rootRef;
}
