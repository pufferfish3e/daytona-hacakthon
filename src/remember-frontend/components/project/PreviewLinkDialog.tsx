"use client";

import { Check, Copy, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type PreviewLinkDialogProps = {
  previewUrl: string;
  onClose: () => void;
};

export function PreviewLinkDialog({ previewUrl, onClose }: PreviewLinkDialogProps) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      inputRef.current?.select();
      document.execCommand("copy");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [previewUrl]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => inputRef.current?.select());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-link-title"
        className="glass-panel-strong w-full max-w-lg rounded-2xl border border-archive-border p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p id="preview-link-title" className="text-sm font-semibold text-archive-ink">
              Share live preview
            </p>
            <p className="mt-1 text-xs text-archive-muted">
              Anyone with this link can open the resurrected prototype.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-archive-muted transition-colors hover:bg-white/5 hover:text-archive-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <input
            ref={inputRef}
            readOnly
            value={previewUrl}
            className="glass-input-shell min-w-0 flex-1 rounded-xl px-3 py-2.5 font-mono text-xs text-archive-ink outline-none"
            onFocus={(event) => event.target.select()}
          />
          <button
            type="button"
            onClick={() => void copyLink()}
            className="archive-cta flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
