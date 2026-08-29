import { BONKY_INU_SPRITE_URL } from "./constants";

type InuProps = {
  inuBottom: number;
  inuWidth: number;
  inuHeight: number;
  inuLeft: number;
};

export function Inu({ inuBottom, inuWidth, inuHeight, inuLeft }: InuProps) {
  return (
    <img
      alt=""
      aria-hidden
      src={BONKY_INU_SPRITE_URL}
      className="pointer-events-none absolute select-none"
      style={{
        bottom: inuBottom + inuHeight / 2,
        height: inuHeight,
        left: inuLeft,
        width: inuWidth,
      }}
    />
  );
}
