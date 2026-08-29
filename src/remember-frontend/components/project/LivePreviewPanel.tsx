"use client";

import { Copy, ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";
import { useEffect, useState } from "react";
import { previewAddressLabel } from "../../lib/preview-url";

type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function LivePreviewPanel({
  owner,
  name,
  previewUrl,
}: {
  owner: string;
  name: string;
  previewUrl: string;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  const [isFrameLoading, setIsFrameLoading] = useState(true);

  useEffect(() => {
    setIsFrameLoading(true);
  }, [previewUrl]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-archive-bg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-archive-border px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-medium text-archive-success">Project resurrected</p>
          <h2 className="mt-1 text-lg font-semibold text-archive-ink">Live prototype</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-archive-border p-0.5">
            {(
              [
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const
            ).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                className={`rounded-md p-1.5 transition-colors ${
                  device === key
                    ? "bg-archive-ink text-archive-bg"
                    : "text-archive-muted hover:text-archive-ink"
                }`}
                aria-label={`${key} preview`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(previewUrl)}
            className="flex items-center gap-1.5 rounded-full border border-archive-border px-3 py-1.5 text-xs text-archive-muted transition-colors hover:border-archive-border-strong hover:text-archive-ink"
          >
            <Copy className="h-3 w-3" />
            Copy link
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="archive-cta rounded-full px-4 py-1.5 text-xs font-medium transition-opacity"
          >
            Open live project
          </a>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto bg-archive-bg-deep p-4 sm:p-6">
        <div
          className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border border-archive-border-strong bg-archive-panel shadow-lg transition-all duration-500"
          style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
        >
          <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-archive-border bg-archive-bg-deep px-3">
            <span className="h-2 w-2 rounded-full bg-archive-border-strong" />
            <span className="h-2 w-2 rounded-full bg-archive-border-strong" />
            <span className="h-2 w-2 rounded-full bg-archive-border-strong" />
            <span className="ml-2 truncate font-mono text-[10px] text-archive-faint">
              {previewAddressLabel(previewUrl)}
            </span>
          </div>

          <div className="relative min-h-0 flex-1 bg-[#fafafa]">
            {isFrameLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#fafafa] p-8 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Loading live preview</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Connecting to {previewAddressLabel(previewUrl)}…
                  </p>
                </div>
              </div>
            )}
            <iframe
              key={previewUrl}
              title={`Live preview for ${owner}/${name}`}
              src={previewUrl}
              className="h-full w-full border-0 bg-white"
              onLoad={() => setIsFrameLoading(false)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-archive-border bg-[#0a0a0a]/60 px-5 py-3 backdrop-blur-sm sm:px-6">
        <p className="text-xs text-archive-muted">
          Revived from a dormant repo — interactive and shareable
        </p>
        <a
          href={`https://github.com/${owner}/${name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-archive-muted transition-colors hover:text-archive-ink"
        >
          View source
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
