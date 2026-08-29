import { useEffect, useState } from "react";

/** True when this page is rendered inside a preview iframe (not the top-level app). */
export function useIsEmbedded(): boolean {
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    setEmbedded(window.self !== window.top);
  }, []);

  return embedded;
}
