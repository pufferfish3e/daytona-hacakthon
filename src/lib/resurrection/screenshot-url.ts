const HTTPS_PROTOCOL = "https:";

export const resolveScreenshotUrl = (previewUrl: string): string | undefined => {
  try {
    const url = new URL(previewUrl);
    if (url.protocol !== HTTPS_PROTOCOL || url.username.length > 0 || url.password.length > 0) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
};
