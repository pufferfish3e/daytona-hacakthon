import { useState } from "react";
import { BONKY_REPO_URL } from "./constants";

export type BonkyPage = "game" | "leaderboard" | "achievements";

type BonkyNavbarProps = {
  page: BonkyPage;
  onNavigate: (page: BonkyPage) => void;
};

export function BonkyNavbar({ page, onNavigate }: BonkyNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const links: { id: BonkyPage; label: string }[] = [
    { id: "game", label: "Game" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "achievements", label: "Achievements" },
  ];

  return (
    <nav className="rounded border border-gray-200 bg-white px-2 py-2.5 sm:px-4">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate("game")}
          className="text-lg font-bold uppercase hover:cursor-pointer sm:text-xl"
        >
          Bonky Inu
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 md:hidden"
          aria-label="Open main menu"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="w-full md:block md:w-auto">
          <ul
            className={`mt-4 flex-col items-center p-4 md:mt-0 md:flex md:flex-row md:space-x-8 md:p-0 md:text-xl ${
              menuOpen ? "flex" : "hidden md:flex"
            }`}
          >
              {links.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(link.id);
                      setMenuOpen(false);
                    }}
                    className={`block py-2 pl-3 pr-4 font-bold uppercase md:p-0 ${
                      page === link.id ? "text-[#FA6E00]" : "text-black"
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <a
                  href={BONKY_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white md:mt-0 md:text-sm"
                >
                  View source
                </a>
              </li>
            </ul>
        </div>
      </div>
    </nav>
  );
}
