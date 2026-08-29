const DEFAULT_APP_PORT = Number(process.env.PORT ?? 3000);
const DEFAULT_DEMO_GAME_PORT = Number(process.env.DEMO_PREVIEW_PORT ?? 5174);

export const defaultEmbedPreviewPath = "/embed/preview";
export const defaultLivePreviewPath = "/preview/live";

export const resolvePreviewUrl = (_sandboxPort = 3000): string => {
  const configured = process.env.PROJECT_RESURRECTION_PREVIEW_URL?.trim();
  if (configured) return configured;
  return `http://localhost:${DEFAULT_APP_PORT}${defaultEmbedPreviewPath}`;
};

export const resolveLiveGamePreviewUrl = (): string =>
  `http://localhost:${DEFAULT_APP_PORT}${defaultLivePreviewPath}`;

export const resolveDemoGameOrigin = (): string =>
  `http://localhost:${DEFAULT_DEMO_GAME_PORT}`;
