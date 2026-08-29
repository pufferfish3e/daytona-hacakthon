import gsap from "gsap";

type ScrollTriggerPlugin = typeof import("gsap/ScrollTrigger").ScrollTrigger;

let scrollTrigger: ScrollTriggerPlugin | null = null;

/** Register ScrollTrigger only in the browser (safe for Next.js SSR). */
export function getScrollTrigger(): ScrollTriggerPlugin | null {
  if (typeof window === "undefined") return null;
  if (!scrollTrigger) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy client-only load
    const { ScrollTrigger: ScrollTriggerPlugin } = require("gsap/ScrollTrigger") as {
      ScrollTrigger: ScrollTriggerPlugin;
    };
    gsap.registerPlugin(ScrollTriggerPlugin);
    scrollTrigger = ScrollTriggerPlugin;
  }
  return scrollTrigger;
}

export { gsap };
