import { BONKY_BG_URL } from "./constants";

type BonkyWaitingScreenProps = {
  onStart: () => void;
};

export function BonkyWaitingScreen({ onStart }: BonkyWaitingScreenProps) {
  return (
    <div
      className="mx-auto flex h-[280px] w-full max-w-[900px] items-center justify-center rounded-lg bg-[#3d6b8a] bg-cover bg-center sm:h-[360px] lg:h-[420px]"
      style={{ backgroundImage: `url(${BONKY_BG_URL})` }}
    >
      <div className="rounded-xl bg-black/35 px-6 py-5 text-center backdrop-blur-sm">
        <button
          type="button"
          className="rounded-xl bg-[#223333] px-5 py-2.5 text-sm font-bold uppercase text-white shadow-xl transition-transform hover:scale-[1.02]"
          onClick={onStart}
        >
          New Game
        </button>
        <p className="mt-4 text-base font-bold text-white sm:text-xl">
          Click to jump and score your best!
        </p>
        <p className="mt-2 text-xs text-white/80 sm:text-sm">
          Resurrected demo — wallet optional for live devnet
        </p>
      </div>
    </div>
  );
}
