import { useState, type FormEvent } from "react";
import { CtaButton } from "./CtaButton";

type RepoUrlInputProps = {
  onSubmit: (url: string) => void;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
  defaultValue?: string;
  variant?: "dark" | "archival";
};

export function RepoUrlInput({
  onSubmit,
  placeholder = "https://github.com/owner/repository",
  buttonLabel = "Resurrect project",
  className = "",
  defaultValue = "",
  variant = "dark",
}: RepoUrlInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError("Paste a GitHub URL to continue.");
      return;
    }
    setError("");
    onSubmit(value.trim());
  }

  const isArchival = variant === "archival";

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div
        className={`flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:rounded-full sm:p-1.5 ${
          isArchival
            ? "sm:border sm:border-archive-border sm:bg-archive-panel sm:shadow-sm"
            : "sm:bg-white"
        }`}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          placeholder={placeholder}
          aria-label="Public GitHub repository"
          className={`w-full rounded-full px-5 py-3 text-sm outline-none sm:flex-1 sm:bg-transparent sm:py-2 ${
            isArchival
              ? "bg-archive-panel text-archive-ink placeholder:text-archive-faint"
              : "bg-white text-[#010101] placeholder:text-[#010101]/40"
          }`}
        />
        {isArchival ? (
          <button
            type="submit"
            className="archive-cta w-full shrink-0 rounded-full px-6 py-2.5 text-sm font-medium transition-opacity sm:w-auto sm:self-stretch"
          >
            {buttonLabel}
          </button>
        ) : (
          <CtaButton
            type="submit"
            label={buttonLabel}
            className="w-full sm:w-auto sm:self-stretch sm:px-6"
          />
        )}
      </div>
      {error && (
        <p className={`mt-2 text-sm ${isArchival ? "text-red-600" : "text-red-400"}`}>
          {error}
        </p>
      )}
    </form>
  );
}
