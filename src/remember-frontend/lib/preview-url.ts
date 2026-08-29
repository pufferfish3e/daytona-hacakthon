const DEFAULT_APP_PORT = 3000;
const DEFAULT_APP_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : `http://localhost:${DEFAULT_APP_PORT}`;

/** Static resurrected-app UI — Bonky Inu runs at this route and inline in LivePreviewPanel. */
export const LOCAL_MOCK_PREVIEW_URL = "/embed/preview";

const configuredPublicPreview = process.env.NEXT_PUBLIC_PROJECT_RESURRECTION_PREVIEW_URL?.trim();

/** Default iframe target: Bonky embed route. Override via env for /preview/live. */
export const LOCAL_PREVIEW_URL = configuredPublicPreview || LOCAL_MOCK_PREVIEW_URL;

/** Proxied demo game (requires `npm run demo:preview` on DEMO_PREVIEW_PORT). */
export const LOCAL_LIVE_PREVIEW_URL = `/preview/live`;

export const isBonkyEmbedPreviewUrl = (previewUrl: string): boolean => {
  try {
    const parsed = new URL(previewUrl, DEFAULT_APP_ORIGIN);
    return parsed.pathname === "/embed/preview" || parsed.pathname.startsWith("/embed/preview/");
  } catch {
    return previewUrl === LOCAL_MOCK_PREVIEW_URL;
  }
};

/** Same-origin paths that must never load inside the live preview iframe (infinite nesting). */
const BLOCKED_PREVIEW_PATHS = [
  "/mocks/complete",
  "/create",
  "/create/generated",
] as const;

const isBlockedSameOriginPath = (pathname: string): boolean => {
  if (pathname === "/" || pathname === "") return true;
  return BLOCKED_PREVIEW_PATHS.some(
    (blocked) => pathname === blocked || pathname.startsWith(`${blocked}/`),
  );
};

const isAllowedSameOriginPreview = (pathname: string): boolean =>
  pathname === "/embed/preview" || pathname.startsWith("/preview/live");

/**
 * Ensures preview iframes only load leaf content (embed mock or live game proxy),
 * never another full Remember workspace shell.
 */
export const sanitizePreviewUrl = (previewUrl: string, fallback = LOCAL_MOCK_PREVIEW_URL): string => {
  try {
    const parsed = new URL(previewUrl, DEFAULT_APP_ORIGIN);
    const sameOrigin =
      typeof window !== "undefined"
        ? parsed.origin === window.location.origin
        : parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    if (!sameOrigin) return previewUrl;
    if (isAllowedSameOriginPreview(parsed.pathname)) return parsed.toString();
    if (isBlockedSameOriginPath(parsed.pathname)) return fallback;

    // Unknown same-origin route — don't embed the main app by accident.
    return fallback;
  } catch {
    return fallback;
  }
};

export const previewUrlForProject = (previewUrl?: string): string => {
  const resolved = previewUrl ?? LOCAL_PREVIEW_URL;
  if (resolved.startsWith("/")) {
    return typeof window !== "undefined" ? `${window.location.origin}${resolved}` : resolved;
  }
  return sanitizePreviewUrl(resolved);
};

export const previewAddressLabel = (previewUrl: string): string => {
  try {
    const url = new URL(previewUrl);
    return `${url.host}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return previewUrl;
  }
};
