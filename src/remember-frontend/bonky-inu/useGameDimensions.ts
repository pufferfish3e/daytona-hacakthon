import { type RefObject, useEffect, useState } from "react";

import { normalizePlayableSize } from "./game-scale";

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 480;

export interface GameDimensions {
  compact: boolean;
  height: number;
  width: number;
}

export function useGameDimensions(
  containerRef: RefObject<HTMLElement | null> | undefined,
  embedded: boolean,
  /** Measure the parent panel instead of the viewport (inline live preview). */
  fillContainer = false,
): GameDimensions {
  const [dimensions, setDimensions] = useState<GameDimensions>({
    compact: false,
    height: DEFAULT_HEIGHT,
    width: DEFAULT_WIDTH,
  });

  useEffect(() => {
    const measure = (): void => {
      const bounds = containerRef?.current?.getBoundingClientRect();
      const useViewport = embedded && !fillContainer;
      const containerWidth = useViewport
        ? window.innerWidth
        : bounds && bounds.width > 0
          ? bounds.width
          : window.innerWidth;
      const containerHeight = useViewport
        ? window.innerHeight
        : bounds && bounds.height > 0
          ? bounds.height
          : window.innerHeight;

      setDimensions(normalizePlayableSize(containerWidth, containerHeight, embedded || fillContainer));
    };

    measure();
    const frame = window.requestAnimationFrame(measure);

    const observer = containerRef?.current ? new ResizeObserver(measure) : undefined;
    if (containerRef?.current) observer?.observe(containerRef.current);

    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [containerRef, embedded, fillContainer]);

  return dimensions;
}
