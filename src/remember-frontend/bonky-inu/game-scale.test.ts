import { describe, expect, it } from "vitest";

import { getGameLayout, normalizePlayableSize } from "./game-scale";

describe("game-scale", () => {
  it("keeps playable proportions for a short wide iframe", () => {
    const size = normalizePlayableSize(820, 210, true);
    expect(size.height).toBeGreaterThanOrEqual(210);
    expect(size.width / size.height).toBeLessThanOrEqual(2.1);
  });

  it("scales gap and sprite size down for compact layouts", () => {
    const layout = getGameLayout(640, 300, true);
    expect(layout.gap).toBeLessThan(200);
    expect(layout.inuHeight).toBeLessThan(60);
  });
});
