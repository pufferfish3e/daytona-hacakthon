"use client";

import dynamic from "next/dynamic";
import type { ReactElement } from "react";

const RememberApp = dynamic(() => import("@/remember-frontend/App"), {
  ssr: false,
  loading: () => (
    <div className="mesh-bg flex min-h-screen items-center justify-center text-archive-muted">
      Loading…
    </div>
  ),
});

export default function CatchAllPage(): ReactElement {
  return <RememberApp />;
}
