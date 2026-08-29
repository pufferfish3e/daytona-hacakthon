"use client";

import { ImageDown } from "lucide-react";
import { PRODUCT_NAME } from "../../constants";

type ShareSnapshotButtonProps = {
  owner: string;
  name: string;
  sessionId: string;
};

export function ShareSnapshotButton({ owner, name, sessionId }: ShareSnapshotButtonProps) {
  async function handleExport() {
    const canvas = document.createElement("canvas");
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0a0a0a");
    gradient.addColorStop(1, "#1a1510");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    roundRect(ctx, 48, 48, width - 96, height - 96, 24);
    ctx.stroke();

    ctx.fillStyle = "#86efac";
    ctx.font = "600 20px system-ui, sans-serif";
    ctx.fillText("PROJECT RESURRECTED", 88, 110);

    ctx.fillStyle = "#fafaf9";
    ctx.font = "700 52px Georgia, serif";
    ctx.fillText(`${owner}/${name}`, 88, 190);

    ctx.fillStyle = "rgba(250,250,249,0.65)";
    ctx.font="400 24px system-ui, sans-serif";
    wrapText(ctx, "Dormant repo rebuilt in an isolated Daytona sandbox — now a live prototype anyone can click through.", 88, 250, width - 176, 34);

    ctx.fillStyle = "rgba(250,250,249,0.45)";
    ctx.font = "500 18px ui-monospace, monospace";
    ctx.fillText(`Session ${sessionId}`, 88, height - 120);
    ctx.fillText(PRODUCT_NAME, 88, height - 88);

    ctx.fillStyle = "rgba(134,239,172,0.15)";
    roundRect(ctx, width - 320, height - 160, 240, 72, 16);
    ctx.fill();
    ctx.fillStyle = "#86efac";
    ctx.font = "600 20px system-ui, sans-serif";
    ctx.fillText("Live preview ready", width - 296, height - 115);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `remember-${owner}-${name}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <button
      type="button"
      onClick={() => void handleExport()}
      className="flex items-center gap-1.5 rounded-full border border-archive-border px-3 py-1.5 text-xs text-archive-muted transition-colors hover:border-archive-border-strong hover:text-archive-ink"
    >
      <ImageDown className="h-3 w-3" />
      Export snapshot
    </button>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let offsetY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, offsetY);
      line = word;
      offsetY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, offsetY);
}
