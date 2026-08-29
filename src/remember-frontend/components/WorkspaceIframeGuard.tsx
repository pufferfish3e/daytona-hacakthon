import type { ReactNode } from "react";
import { RevivedAppMock } from "../components/project/RevivedAppMock";
import { useIsEmbedded } from "../hooks/useIsEmbedded";

/**
 * Full workspace shells must not render inside preview iframes — that causes
 * infinite Remember-in-Remember nesting. Show leaf mock UI instead.
 */
export function WorkspaceIframeGuard({ children }: { children: ReactNode }) {
  const embedded = useIsEmbedded();
  if (embedded) return <RevivedAppMock />;
  return children;
}
